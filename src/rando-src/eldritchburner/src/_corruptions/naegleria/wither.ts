import { NS } from "@ns";
import { wither } from "/_corruptions/naegleria";
import { Whisperer } from "/_necronomicon/whisperer";

/**
 * Wither a future sacrifice mind away, bending their will to the elder ones.
 *
 * @remarks RAM cost: 2.15GB (NS: 550MB)
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
    if (args.help || args._.length != 1) {
        ns.tprint([
            `Usage: run ${ns.getScriptName()} SACRIFICE`,
            `Wither a future sacrifice mind away, bending their will to the elder ones.`,
            `Example:`,
            `  > run ${ns.getScriptName()} n00dles`
        ].join("\n"))
        return
    }

    // Initialise the logger
    const log: Whisperer = new Whisperer(ns, Whisperer.FromVerbosity(args.verbose as boolean, args.quiet as boolean))
    log.debug("Wither a future sacrifice mind away, bending their will to the elder ones: [%s]", args)

    const sacrifice = args._[0] as string
    if (sacrifice == "home") {
        log.toast("Prevented corruption of the cult's stronghold!", "error")
        return
    }

    await wither(ns, log, sacrifice) // RAM: 550MB
}

// Unsuported public API yet for autocomplete
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServerData = { [key: string]: any }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data: ServerData, args: string[]): string[] {
    return ["--help", "--verbose", "--quiet", ...data.servers]
}
