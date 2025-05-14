import { NS } from "@ns";
import { Whisperer } from "../../_necronomicon/whisperer";

/**
 * Rot: Hock
 *
 * @remarks RAM cost: 1.70GB
 * @param {NS} ns NetScript object
 */
export async function main(ns: NS): Promise<void> {
    // CLI Argument parsing
    const args = ns.flags([
        ["help", false],
        ["verbose", false],
        ["quiet", false],
        ["uuid", "null"],
        ["delay", ""],

    ]);

    if (!(args._ instanceof Array)) args._ = [args._.toString()]
    if (args.help || args._.length < 1 || args._.length > 2) {
        ns.tprint([
            `Usage: run ${ns.getScriptName()} SACRIFICE [COUNT]`,
            `Corrupt the brain of an unwilling sacrifice.`,
            `Flags:`,
            `  --uid=UID    UID to give to the process.`,
            `  --delay=MS   Delay before starting the process. A pair can`,
            `               be given to delay between each process.`,
            `Example:`,
            `  > run ${ns.getScriptName()} -t 8 foodnstuff`,
            `  > run ${ns.getScriptName()} -t 8 --uid uid-0123 foodnstuff`,
            `  > run ${ns.getScriptName()} -t 8 --delay 1 foodnstuff 5`,
            `  > run ${ns.getScriptName()} -t 8 --delay 1,1 foodnstuff 5`,
            `  > run ${ns.getScriptName()} -t 8 foodnstuff 666`
        ].join("\n"))
        return
    }

    // Initialise the logger
    const log: Whisperer = new Whisperer(ns, Whisperer.FromVerbosity(args.verbose as boolean, args.quiet as boolean))
    const sacrifice = args._[0] as string
    if (sacrifice == "home" || sacrifice.startsWith("cult1st-")) {
        log.toast("Prevented corruption of the cult's resources: %s", "error", sacrifice)
        return
    }

    const rounds = args._.length == 2 ? parseInt(args._[1]) as number : Number.MAX_SAFE_INTEGER

    const delay = parseDelay(args.delay as string)
    for (let i = 0; i < rounds; i++) {
        log.info("Sacrificing to zvilpogghua: %s", sacrifice)
        if (delay.before) await ns.sleep(delay.before)
        log.info(`** Almightty Zvilpogghua accept this ripe offering! **`)
        await ns.hack(sacrifice)
        await ns.sleep(delay.after)
    }
}

export type Delay = { before?: number, after: number }
export function parseDelay(input: string): Delay {
    const parts = input.split(",").filter(s => s.length).map(x => parseInt(x))
    if (parts.length > 2) throw new Error(`Could not parse delay: ${input}`)
    if (parts.length == 1) return { before: parts[0], after: 1 } as Delay
    else return { before: parts[0], after: parts[1] ?? 1 } as Delay
}

// Unsuported public API yet for autocomplete
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServerData = { [key: string]: any }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data: ServerData, args: string[]): string[] {
    return ["--help", "--verbose", "--quiet", "--uuid", "--delay", ...data.servers]
}