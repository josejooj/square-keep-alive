import { Status } from "./typing";
import { config as ConfigEnv } from 'dotenv';
import axios from "axios";

ConfigEnv()

const log = (tag: string, msg: string) => console.log(`[${tag}] - ${msg}`)
const square = axios.create({ baseURL: "https://api.squarecloud.app/v2", headers: { Authorization: process.env.SQUARE_API_KEY } });

(async () => {

    const { data, status } = await square.get(`/user`).catch(e => e.response);
    const user = data.response?.user as { tag: string, plan: { name: string } };

    if (status === 401) return log('ERROR', "Please, verify your API Key!")
    if (user.plan.name === 'free') log('ALERT', `Don't host me on Square Cloud with free plan.`) // maybe you are hosting on another machine

    log('INFO', `Started successfully! Hello ${user.tag}!`)
    log('INFO', `I will check all applications each 15 seconds`);
    log('INFO', `Starting to check now!`)

    async function check(i: number = 0) {

        try {

            const { data, status } = await square.get("/apps/all/status").catch(e => e.response);
            const response = data.response as Status[];

            if (status === 401) return log('ERROR', `Please, re-configure your api key.`)

            for (const app of response) {

                if (app.running) continue;

                const { status } = await square.post(`/apps/${app.id}/start`).catch(e => e.response);

                if (status === 200) log('INFO', `[CHECK ${i + 1}] - The application "${app.id}" was offline, and i restarted it successfully!`);
                else log('WARNING', `[CHECK ${i + 1}] - I received the HTTP ERROR ${status} when i tried to restart the application "${app.id}" (ID ${app.id})`)

            }
            
            ++i

        } catch (e: any) {
            if (!e.message.includes("Cannot destructure")) throw e;
        }

        setTimeout(check.bind(null, i), 1000 * 16);
    }

    check();

})()