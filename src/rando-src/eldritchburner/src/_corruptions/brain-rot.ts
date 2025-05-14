import { NS } from "@ns";
import { Whisperer } from "../_necronomicon/whisperer";

const THRESHOLD_MAX_SECURITY = 5
const THRESHOLD_MONEY_PERCENT = 0.75

/**
 * Rot a target to the core, until completely depleted.
 *
 * @remarls RAM cost: 2.45GB (NS: 850MB)
 * @param {NS} ns NetScript object
 */
export async function main(ns: NS): Promise<void> {
    // CLI Argument parsing
    const args = ns.flags([
        ["help", false],
        ["verbose", false],
        ["quiet", false],
        ["uuid", "null"],
    ]);

    if (!(args._ instanceof Array)) args._ = [args._.toString()]
    if (args.help || args._.length > 2) {
        ns.tprint([
            `Usage: run ${ns.getScriptName()} [HOST [COUNT]]`,
            `Rot a target to the core, until completely depleted.`,
            `Example:`,
            `  > run ${ns.getScriptName()} -t 8 n00dles`
        ].join("\n"))
        return
    }

    // Start the whisperer
    const log: Whisperer = new Whisperer(ns, Whisperer.FromVerbosity(args.verbose as boolean, args.quiet as boolean))
    log.debug("The rot is spreading: [%s]", args)

    const sacrifice = args._.length > 0 ? args._[0] as string : ns.getHostname() // RAM: 50MB
    if (sacrifice == "home" || sacrifice.startsWith("cult1st-")) {
        log.toast("Prevented corruption of the cult's resources: %s", "error", sacrifice)
        return
    }

    const rounds = args._.length > 1 ? parseInt(args._[1]) : Number.MAX_SAFE_INTEGER

    const moneyThresh = ns.getServerMaxMoney(sacrifice) * THRESHOLD_MONEY_PERCENT // RAM: 100MB
    const securityThresh = ns.getServerMinSecurityLevel(sacrifice) + THRESHOLD_MAX_SECURITY // RAM: 100MB

    for (let i = 0; i < rounds; i++) {
        await corrupt(ns, log, sacrifice, securityThresh, moneyThresh) // RAM: 600MB
        await ns.sleep(500)
    }
}

/**
 * Rot the brain of a sacrifice, managing growth and security weakening
 *
 * @remarks RAM cost: 600MB
 * @param {NS} ns
 * @param {Whisperer} log
 * @param {string} sacrifice
 * @param {number} securityThresh When to weaken the sacrifice
 * @param {number} moneyThresh When to start draining the sacrifice
 */
export async function corrupt(ns: NS, log: Whisperer, sacrifice: string, securityThresh: number, moneyThresh: number): Promise<void> {
    log.info("Sacrificing to zvilpogghua: %s", sacrifice)

    const security = ns.getServerSecurityLevel(sacrifice) // RAM: 0.1GB
    log.debug(" > security=%.02f (ok=%s, thres=%.02f)", security, security < securityThresh, securityThresh)

    const money = ns.getServerMoneyAvailable(sacrifice) // RAM: 0.1GB
    log.debug(" > money=%d (ok=%s, thres=%d)", money, money > moneyThresh, moneyThresh)

    if (security > securityThresh) {
        log.info(">> By Gloon's name I curse thy!")
        await ns.weaken(sacrifice); // RAM: 0.15GB
    } else if (money < moneyThresh) {
        log.info(">> May Istasha's darkness grows...")
        await ns.grow(sacrifice); // RAM: 0.15GB
    } else {
        log.info(`** Almightty Zvilpogghua accept this ripe offering! **`)
        await ns.hack(sacrifice); // RAM: 0.1GB
    }
}

// Unsuported public API yet for autocomplete
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServerData = { [key: string]: any }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data: ServerData, args: string[]): string[] {
    return ["--help", "--verbose", "--quiet", "--uuid", ...data.servers]
}