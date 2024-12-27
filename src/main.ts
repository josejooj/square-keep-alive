import { Log, square_init, square_url } from "./constants";
import { APIUser } from '@squarecloud/api-types/v2'
import fs from 'fs';

const init = async () => {

    const user_req = await fetch(`${square_url}/users/me`, square_init);
    const user = await user_req.json().then(r => r.response.user) as APIUser;

    if (user_req.status === 401) return Log('error', "Please, verify your API Key!")
    if (user.plan.name === 'free') Log('warn', `Don't host me on Square Cloud with free plan.`) // maybe you are hosting on another machine
    if (!fs.existsSync("./logs")) fs.mkdirSync("./logs")

    Log('info', `Started successfully! Hello ${user.name}!`);

}

init();