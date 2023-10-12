import { Application, Plans, Status, User } from "./typing";
import { config as ConfigEnv } from 'dotenv';
import axios from "axios";

ConfigEnv()

const limit: Record<Plans, number> = {
    free: 60,
    basic: 60,
    medium: 60,
    advanced: 120,
    senior: 120,
    deluxe: 180,
    orion: 360,
    enterprise: 720
}

const log = (tag: string, msg: string) => console.log(`[${tag}] - ${msg}`)
const square = axios.create({ baseURL: "https://api.squarecloud.app/v2", headers: { Authorization: process.env.SQUARE_API_TOKEN } })
const divisor = +(process.env.REQUEST_LIMIT_DIVISOR || 4);

(async () => {

    const { data, status } = await square.get(`/user`).catch(e => e.response);
    const user = data.response?.user as User;
    const apps = data.response?.applications as Application[];

    if (typeof divisor !== 'number' || isNaN(divisor) || divisor % 1 !== 0 || divisor < 3) return log('ERROR', "REQUEST_LIMIT_DIVISOR must be a integer bigger than 3")
    if (status === 401) return log('ERROR', "Please, verify your API Key!")
    if (user.plan.name === 'free') return log('ERROR', `I can't check your applications with free plan, because your unique application will be me`)

    log('INFO', `Started successfully! Hello ${user.tag}!`)
    log('INFO', `I will check ${apps.length} applications.`)

    for (let i = 0; i < apps.length; i++) log('INFO', `Application ${i + 1}: ID ${apps[i].id} - "${apps[i].tag}" `)

    const timer = 1000 * 60 / limit[user.plan.name] * divisor;

    log('INFO', `As you have the ${user.plan.name} plan, your request limit is ${limit[user.plan.name]}r/60s`);
    log('INFO', `So i will do ${(limit[user.plan.name] / divisor).toFixed(2)}r/60s, one request every ${timer / 1000} second(s)`);
    log('INFO', `As you have ${apps.length} applications, each application will be re-checked every ${timer / 1000 * apps.length} second(s)`);
    log('INFO', `Starting to check now!`)

    async function check(i: number = 0) {

        try {

            const app = apps[i % apps.length];

            if (app) {

                const { data, status } = await square.get("/apps/" + app.id + "/status").catch(e => e.response);
                const response = data.response as Status;

                if (status === 404) {
                    delete apps[i % apps.length];
                    log('WARNING', `The application "${app.tag}" (ID ${app.id}) was deleted. Removing of check list.`)
                }

                if (status === 401) return log('ERROR', `Please, re-configure your api key.`)
                if (status === 200 && !response.running) {

                    const { status } = await square.post(`/apps/${app.id}/start`).catch(e => e.response);

                    if (status === 200) log('INFO', `[CHECK ${i + 1}] - The application "${app.tag}" was offline, and i restarted it successfully!`);
                    else log('WARNING', `[CHECK ${i + 1}] - I received the HTTP ERROR ${status} when i tried to restart the application "${app.tag}" (ID ${app.id})`)

                }

            }
        } catch(e: any) {
            if (!e.message.includes("Cannot destructure")) throw e;
        }

        setTimeout(check.bind(null, i + 1), timer);
    }

    check();

})()