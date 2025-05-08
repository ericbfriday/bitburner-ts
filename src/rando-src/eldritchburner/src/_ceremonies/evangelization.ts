import { NS } from "@ns";
import { purchaseMaxCost, shouldContinue } from "/_ceremonies/hustle-culture";
import { uuid } from "/_necronomicon/name-giver";
import { Whisperer } from "/_necronomicon/whisperer";

const RECRUITING_SERVERS = true

/**
 * Evangelize new recruits to the cult
 *
 * @remarks RAM cost: 7.05GB
 * @param {NS} ns NetScript object
 */
export async function main(ns: NS): Promise<void> {
    // CLI Argument parsing
    const args = ns.flags([
        ["help", false],
        ["verbose", false],
        ["quiet", false],
    ]);

    if (!(args._ instanceof Array)) args._ = [args._.toString()]
    if (args.help || args._.length > 1) {
        ns.tprint([
            `Usage: run ${ns.getScriptName()} ...`,
            `Evangelize new recruits to the cult`,
            `Example:`,
            `  > run ${ns.getScriptName()} -t 8 ...`
        ].join("\n"))
        return
    }

    // Initialise the logger
    const log: Whisperer = new Whisperer(ns, Whisperer.FromVerbosity(args.verbose as boolean, args.quiet as boolean))
    log.debug("Evangelize new recruits to the cult: [%s]", args)
    let cultRecruits = 0

    while (RECRUITING_SERVERS && await shouldContinue(ns)) { // RAM cost: 0.3GB
        if (await recruitServer(ns)) cultRecruits++ // RAM cost: 5.2GB - 0.05GB
        else break

        await ns.sleep(1)
    }

    if (cultRecruits > 0) log.toast(`Recruited ${cultRecruits} servers.`)
}


/**
 * Recruit a server if possible, replacing old ones if needed.
 *
 * @param {NS} ns NetScript object
 * @remarks RAM cost: 5.2GB
 * @returns if the cult leader recruited (or replaced) a member
 */
export async function recruitServer(ns: NS): Promise<boolean> {
    // Max cost we are ready to spend
    const maxCost = await purchaseMaxCost(ns) // RAM cost: 0.1GB
    if (ns.getServerMoneyAvailable("home") < maxCost) return false

    // Get the best server
    const purchasedServers = ns.scan("home").filter(s => s.startsWith("cult1st-")) // RAM cost: 0.2GB
    let purchaseRam = purchasedServers.map(s => ns.getServerMaxRam(s)).reduce((a, b) => Math.max(a, b), 8) // RAM cost: 0.05GB

    // We can't afford to buy a new server
    if (ns.getPurchasedServerCost(purchaseRam) > maxCost) return false // RAM cost: 0.25GB

    // Try to grow the ram amount
    while (ns.getPurchasedServerCost(purchaseRam * 2) < maxCost) purchaseRam *= 2
    purchaseRam = Math.min(ns.getPurchasedServerMaxRam(), purchaseRam)  // RAM cost: 0.05GB

    // Make a name for the new server
    let serverName = await generateServerName(ns)

    // We can afford to delete a server if it has less RAM
    if (purchasedServers.length == ns.getPurchasedServerLimit()) { // RAM cost: 0.05GB
        const serverToReplace = purchasedServers.reduce((a, b) => ns.getServerMaxRam(a) < ns.getServerMaxRam(b) ? a : b)
        if (ns.getServerMaxRam(serverToReplace) > purchaseRam) return false

        ns.deleteServer(serverToReplace) // RAM cost: 2.25GB
        serverName = serverToReplace
    }

    // Purchase the server
    return ns.purchaseServer(serverName, purchaseRam) !== "" // RAM cost: 2.25GB
}

/**
 * Generate a random name for a new server, with insurance that no other server is named the same.
 *
 * @param {NS} ns NetScript object
 * @remarks RAM cost: 0.00GB
 * @returns a server name that does not exist.
 */
export async function generateServerName(ns: NS): Promise<string> {
    while (true) {
        const serverName = `cult1st-${uuid().split('-')[1]}`
        if (!ns.serverExists(serverName)) return serverName
    }
}
