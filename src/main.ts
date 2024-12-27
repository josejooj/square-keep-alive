import { square_init, square_url } from "./constants";
import fs from 'fs';

const log = (tag: string, msg: string) => console.log(`[${tag}] - ${msg}`);
const init = async () => {

    const user_req = await fetch(`${square_url}/users/me`, square_init);
    const user = await user_req.json().then(r => r.response.user) as { name: string, plan: { name: string } };

    if (user_req.status === 401) return log('ERROR', "Please, verify your API Key!")
    if (user.plan.name === 'free') log('ALERT', `Don't host me on Square Cloud with free plan.`) // maybe you are hosting on another machine
    if (!fs.existsSync("./logs")) fs.mkdirSync("./logs")

    log('INFO', `Started successfully! Hello ${user.name}!`)
    log('INFO', `I will check all applications each 15 seconds`);
    log('INFO', `Starting to check now!`)

}

init();