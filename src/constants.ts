export const
    square_url = "https://api.squarecloud.app/v2",
    discord_url = "https://discord.com/api/v10/",
    square_init = { headers: { Authorization: process.env.SQUARE_API_KEY! } };

type log_class = 'error' | 'warn' | 'info'

const log_colors: Record<log_class, string> = {
    error: "31m",
    warn: "33m",
    info: "36m"
}

export const Log = (level: log_class, msg: string) => {
    console[level](`\x1b[${log_colors[level]}[${level}] - ${msg}\x1b[0m`);
}