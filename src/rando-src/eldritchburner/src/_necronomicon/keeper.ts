import { NS, NodeStats, Player } from "@ns";
import _ from "lodash";

abstract class Keeper<T> {
    constructor(private ns: NS, private tome: string) { }
    private get tomePath(): string {
        return `/.keeper/tome_of_${this.tome}.txt`
    }

    /**
     * Entrust a secret to the keeper to store
     *
     * @remarks RAM cost: 0kB
     * @param {T} secret value to untrust to the keeper
     */
    async entrust(secret: T): Promise<void> {
        this.ns.write(this.tomePath, JSON.stringify(secret, null, 4), "w")
    }

    /**
     * Listen to the Keeper
     *
     * @remarks RAM cost: 0kB
     * @returns {T} what the keeper know
     */
    async clear(): Promise<void> {
        this.ns.write(this.tomePath, "false", "w")
    }

    /**
     * Listen to the Keeper
     *
     * @remarks RAM cost: 0kB
     * @returns {T} what the keeper know
     */
    async listen(): Promise<T | undefined> {
        const payload = this.ns.read(this.tomePath)
        // eslint-disable-next-line no-empty
        try { if (payload) return JSON.parse(payload) as T } catch { }
        return undefined
    }
}

// SECTION: Network
export class KeeperOfNetwork extends Keeper<Network> {
    constructor(ns: NS) {
        super(ns, "network")
    }
}


export type Network = { [key: string]: ServerRef }
export type ServerSensus = {
    /**How many CPU cores this server has. (max=8, affect grow and weaken)*/
    cpuCores: number

    /** Effectiveness of grow() Netscript function */
    serverGrowth: number

    /** Flag indicating whether player has admin/root access to this server */
    hasAdminRights: boolean

    /** RAM (GB) available on this server */
    maxRam: number

    /** Name of company/faction/etc. that this server belongs to. */
    organizationName?: string

    /** Flag indicating whether this is a purchased server */
    purchasedByPlayer: boolean

    /** Flag indicating whether this server has a backdoor installed by a player */
    backdoorInstalled: boolean

    /** Minimum server security level that this server can be weakened to */
    minDifficulty: number

    /** Maximum amount of money that this server can hold */
    moneyMax: number

    /** Hacking level required to hack this server */
    requiredHackingSkill: number
}


export function sensusOf(sensus?: { [key: string]: boolean | number | string }): ServerSensus {
    const defaultSensus: ServerSensus = {
        cpuCores: 1,
        serverGrowth: 1,
        hasAdminRights: false,
        maxRam: 0,
        purchasedByPlayer: false,
        backdoorInstalled: false,
        minDifficulty: Number.MAX_SAFE_INTEGER,
        moneyMax: 0,
        requiredHackingSkill: Number.MAX_SAFE_INTEGER
    }

    if (sensus) _(sensus)
        .keys()
        .forEach(k => {
            if (_.has(defaultSensus, k)) _.set(defaultSensus, k, sensus[k])
        })

    return defaultSensus as ServerSensus
}

export type ServerRef = {
    readonly hostname: string,
    readonly path: string[],
    readonly neighbours: string[],
    readonly sensus: ServerSensus
}

// !SECTION


export class KeeperOfInventory extends Keeper<Player> {
    constructor(ns: NS) {
        super(ns, "records")
    }
}


export class KeeperOfHacks extends Keeper<NodeStats[]> {
    constructor(ns: NS) {
        super(ns, "hacks")
    }
}
