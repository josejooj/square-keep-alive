import { discord_url, Log, square_init, square_url } from "../constants";
import { APIApplicationStatusAll } from '@squarecloud/api-types/payloads/v2/status';

export async function CheckStatus() {
    Log('info', `I will check all applications each 15 seconds`);
    Log('info', `Starting to check now!`);
    Loop();
}

let i = 0;

async function Loop() {

    try {

        const req = await fetch(`${square_url}/apps/status`, square_init);
        const response = await req.json().then(r => r.response) as APIApplicationStatusAll[];
        const processed = new Set<string>();

        if (req.status === 401) return Log('error', `Please, re-configure your api key.`)

        /**
         * I could use "of response.filter(app => !app.running)" here,
         * but this is unperformatic, because i'm already doind a loop, i dont need another loop (filter is a loop)
         */

        for (const raw of response) {

            const app = applications.find(app => app.id === raw.id);

            if (raw.running || !app || processed.has(app.id)) continue;
            else processed.add(app.id);

            const { status, json } = await fetch(`${square_url}/apps/${app.id}/restart`, { ...square_init, method: "POST" });
            const response = JSON.stringify(await json().catch(() => null), null, '  ')
            const body: Record<string, any> = {};

            if (status === 200) {
                Log('info', `[CHECK ${++i}] - The application "${app.id}" - "${app.name}" was offline, and i restarted it successfully!`);
                body.embeds = [{
                    color: 0x88FF88,
                    description: `- One applicaton was offline, and i restarted it successfully!`,
                    fields: [
                        { name: "ID", value: app.id, inline: true },
                        { name: "Name", value: app.name, inline: true },
                        { name: "HTTP Status", value: status.toString(), inline: true },
                        { name: "Response", value: `\`\`\`json\n${response}\`\`\`` }
                    ]
                }]
            } else {
                Log('warn', `[CHECK ${++i}] - I received the HTTP ERROR ${status} when i tried to restart the application "${app.id}"`)
                body.embeds = [{
                    color: 0xFFFF88,
                    description: `I received the HTTP ERROR \`${status}\` when i tried to restart one application`,
                    fields: [
                        { name: "ID", value: app.id, inline: true },
                        { name: "Name", value: app.name, inline: true },
                        { name: "HTTP Status", value: status.toString(), inline: true },
                        { name: "Response", value: `\`\`\`json\n${response}\`\`\`` }
                    ]
                }]
            }

            if (process.env.DISCORD_WEBHOOK_ID && process.env.DISCORD_WEBHOOK_TOKEN) {
                await fetch(
                    `${discord_url}/webhooks/${process.env.DISCORD_WEBHOOK_ID}/${process.env.DISCORD_WEBHOOK_TOKEN}`,
                    { body: JSON.stringify(body), method: "POST", headers: { 'Content-Type': "application/json" } }
                );
            }
        }

    } catch (e: any) {
        if (!e.message.includes("fetch failed")) throw e;
    }

    setTimeout(Loop, 1000 * 30);

}