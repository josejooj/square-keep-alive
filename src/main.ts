import { Status } from "./typing";
import axios from "axios";
import fs from 'fs';

const log = (tag: string, msg: string) => console.log(`[${tag}] - ${msg}`)
const square = axios.create({ baseURL: "https://api.squarecloud.app/v2", headers: { Authorization: process.env.SQUARE_API_KEY } });
const discord = axios.create({ baseURL: "https://discord.com/api/v10/" })

square.interceptors.response.use(res => res, error => error.response);
discord.interceptors.response.use(res => res, error => error.response);

(async () => {

    const { data, status } = await square.get(`/user`).catch(e => e.response);
    const user = data.response?.user as { tag: string, plan: { name: string } };

    if (status === 401) return log('ERROR', "Please, verify your API Key!")
    if (user.plan.name === 'free') log('ALERT', `Don't host me on Square Cloud with free plan.`) // maybe you are hosting on another machine
    if (!fs.existsSync("./logs")) fs.mkdirSync("./logs")

    log('INFO', `Started successfully! Hello ${user.tag}!`)
    log('INFO', `I will check all applications each 15 seconds`);
    log('INFO', `Starting to check now!`)

    async function check(i: number = 0) {

        try {

            const { data, status } = await square.get("/apps/all/status");
            const response = data.response as Status[];

            if (status === 401) return log('ERROR', `Please, re-configure your api key.`)

            /**
             * I could use "of response.filter(app => !app.running)" here,
             * but this is unperformatic, because i'm already doind a loop, i dont need another loop (filter is a loop)
             */

            for (const app of response) {

                if (app.running) continue;

                const { data } = await square.get(`/apps/${app.id}/logs`);
                const { status } = await square.post(`/apps/${app.id}/start`);
                const body: Record<string, any> = {};

                if (data.status === 'success') fs.writeFileSync(`./logs/[${new Date().getTime()}] - ${app.id}.log`, data.response.logs)
                if (status === 200) {
                    log('INFO', `[CHECK ${i + 1}] - The application "${app.id}" was offline, and i restarted it successfully!`);
                    body.embeds = [{
                        color: 0x00FF00,
                        description: `**The application \`"${app.id}"\` was offline, and i restarted it successfully!**`
                    }]
                }
                else {
                    log('WARNING', `[CHECK ${i + 1}] - I received the HTTP ERROR ${status} when i tried to restart the application "${app.id}"`)
                    body.embeds = [{
                        color: 0xFFFF00,
                        description: `**I received the HTTP ERROR \`${status}\` when i tried to restart the application \`${app.id}\`**`
                    }]
                }

                if ('DISCORD_WEBHOOK_ID' in process.env && 'DISCORD_WEBHOOK_TOKEN' in process.env) {
                    await discord.post(`/webhooks/${process.env.DISCORD_WEBHOOK_ID}/${process.env.DISCORD_WEBHOOK_TOKEN}`, body)
                }
            }

            ++i

        } catch (e: any) {
            if (!e.message.includes("Cannot destructure")) throw e;
        }

        setTimeout(check.bind(null, i), 1000 * 15);
    }

    check();

})()