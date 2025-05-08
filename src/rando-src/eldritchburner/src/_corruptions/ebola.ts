import { NS } from "@ns";
import { Whisperer } from "/_necronomicon/whisperer";


/**
 * A defastating corruption, most efficient to drain your sacrifice
 *
 * @remarks RAM cost: 2.0GB (NS: 400MB)
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
    if (args.help || args._.length < 1 || args._.length > 3) {
        ns.tprint([
            `Usage: run ${ns.getScriptName()} SACRIFICE [COUNT [BATCH]]`,
            `A defastating corruption, most efficient to drain your sacrifice`,
            `Example:`,
            `  > run ${ns.getScriptName()} -t 8 ...`
        ].join("\n"))
        return
    }

    // Initialise the logger
    const log: Whisperer = new Whisperer(ns, Whisperer.FromVerbosity(args.verbose as boolean, args.quiet as boolean))
    log.debug("A defastating corruption, most effient to drain your sacrifice: [%s]", args)

    const sacrifice = args._[0] as string
    if (sacrifice == "home" || sacrifice.startsWith("cult1st-")) {
        log.toast("Prevented corruption of the cult's resources: %s", "error", sacrifice)
        return
    }

    const rounds = args._.length >= 2 ? parseInt(args._[1]) as number : Number.MAX_SAFE_INTEGER
    const batch = args._.length == 3 ? (args._[2] as string).toUpperCase() : "HGW"
    for (let i = 0; i < rounds; i++) {
        log.info("Sacrificing to zvilpogghua: %s => %s", sacrifice, batch)
        for (const s of batch) switch (s) {
            case "H":
                log.info(`** Almightty Zvilpogghua accept this ripe offering! **`)
                await ns.hack(sacrifice) // RAM: 100MB
                break
            case "G":
                log.info(">> May Istasha's darkness grows...")
                await ns.grow(sacrifice) // RAM: 150MB
                break
            case "W":
                log.info(">> By Gloon's name I curse thy!")
                await ns.weaken(sacrifice) // RAM: 150MB
                break
        }
    }
}

// Unsuported public API yet for autocomplete
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServerData = { [key: string]: any }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data: ServerData, args: string[]): string[] {
    return ["--help", "--verbose", "--quiet", "--uuid", "--flog", ...data.servers]
}
