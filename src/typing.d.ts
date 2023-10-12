type User = {
    id: string,
    tag: string,
    locale: string,
    email: string,
    blocklist: boolean
    plan: {
        name: Plans,
        memory: {
            limit: number,
            available: number,
            used: number
        },
        duration: {
            formated: string,
            raw: number
        }
    }
}

type Application = {
    id: string,
    tag: string,
    ram: number,
    lang: string,
    type: string,
    cluster: string,
    isWebsite: boolean,
    avatar: string
}

type Status = {
    cpu: string,
    ram: string,
    status: string,
    running: boolean,
    storage: string,
    network: {
        total: string,
        now: string
    },
    requests: number,
    uptime: number,
    time: number
}

type Plans = 'free' | 'basic' | 'medium' | 'advanced' | 'senior' | 'deluxe' | 'orion' | 'enterprise'

export {
    User,
    Application,
    Plans,
    Status
}