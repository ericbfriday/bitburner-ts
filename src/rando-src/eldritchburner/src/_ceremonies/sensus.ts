import { NS } from "@ns";
import { KeeperOfInventory, KeeperOfNetwork, Network, sensusOf, ServerRef } from "/_necronomicon/keeper";
import { Whisperer } from "/_necronomicon/whisperer";


/**
 * Register all souls, and categorize them
 *
 * @remarks RAM cost: 1.85GB (NS: 250MB)
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
    if (args.help || args._.length > 0) {
        ns.tprint([
            `Usage: run ${ns.getScriptName()}`,
            `Register all souls, and categorize them`,
            `Example:`,
            `  > run ${ns.getScriptName()}`
        ].join("\n"))
        return
    }

    // Initialise the logger
    const log: Whisperer = new Whisperer(ns, Whisperer.FromVerbosity(args.verbose as boolean, args.quiet as boolean))
    log.debug("Register all souls, and categorize them: [%s]", args)

    const networkMap = await networkScan(ns);
    const enrichedMap = _(networkMap)
        .filter(s => s.hostname != "darkweb")
        .mapValues(s => { return { ...s, sensus: sensusOf({ ...ns.getServer(s.hostname) }) } as ServerRef })
        .value() as Network

    await (new KeeperOfNetwork(ns)).entrust(enrichedMap)

    const player = ns.getPlayer()
    await (new KeeperOfInventory(ns)).entrust(player)

    log.toast("Finished sensus of the cult's informations")
}

const LOW_LEVEL_SERVERS: { [key: string]: number } = { n00dles: 1, foodnstuff: 1, "sigma-cosmetics": 5, };

/**
 * Map basic information about the Network
 *
 * @remarks RAM cost: 250MB
 * @param ns
 * @returns A basic map of the network
 */
export async function networkScan(ns: NS): Promise<Network> {
    // We always start a network scan from home server
    const servers: Network = {
        "home": {
            hostname: "home",
            path: ["~"],
            neighbours: ns.scan("home"),
            sensus: sensusOf({
                hasAdminRights: true,
                purchasedByPlayer: true,
            })
        }
    }

    const scanQueue: string[] = [...servers.home.neighbours]
    const scanned = (server: string) => _.has(servers, server)

    // Breadth-first search
    while (scanQueue.length > 0) {
        const targetName = scanQueue.shift() as string
        if (_.has(servers, targetName)) continue;

        const targetRef: ServerRef = {
            hostname: targetName,
            neighbours: ns.scan(targetName), // RAM: 200NB
            path: ["!unknown"],
            sensus: sensusOf({
                hasAdminRights: ns.hasRootAccess(targetName), // RAM: 50MB
                purchasedByPlayer: targetName == "home" || targetName.startsWith("cultist-"),
            })
        }

        // Force level 1 for know easy targets
        if (LOW_LEVEL_SERVERS[targetName]) {
            targetRef.sensus.requiredHackingSkill = LOW_LEVEL_SERVERS[targetName]
        }

        // Compute shartest path (only considerating current scanned)
        // NOTE: Doubtful than a better path is necessary
        const path: string[] = targetRef.neighbours
            .filter(scanned)
            .map(n => servers[n].path.concat([targetName]))
            .filter(p => p && p.length && p[0] === "~")
            .map(p => p as string[])
            .sort((a, b) => a.length - b.length)
            .shift() as string[]

        // Register in the network
        servers[targetName] = { ...targetRef, path }

        // Continue spreading corruption from target server to non
        scanQueue.push(...targetRef.neighbours.filter(server => !scanned(server)))

        await ns.sleep(1)
    }
    return servers
}
