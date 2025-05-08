import { NS } from "@ns";
import { Whisperer } from "/_necronomicon/whisperer";


/**
 * Wither a future sacrifice mind away, bending their will to the elder ones.
 * The Temple's corruptions will also be spread to the target.
 *
 * @remarks RAM cost: 3GB (NS: 1.35GB)
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
    if (args.help || args._.length != 1) {
        ns.tprint([
            `Usage: run ${ns.getScriptName()} SACRIFICE`,
            `Wither a future sacrifice mind away, and spread the corruption.`,
            `Example:`,
            `  > run ${ns.getScriptName()} -t 8 n00dles`
        ].join("\n"))
        return
    }

    // Initialise the logger
    const log: Whisperer = new Whisperer(ns, Whisperer.FromVerbosity(args.verbose as boolean, args.quiet as boolean))
    log.info("Wither a future sacrifice mind away, and spread the corruption: [%s]", args)

    const sacrifice = args._[0] as string
    if (sacrifice == "home") {
        log.toast("Prevented corruption of the cult's stronghold!", "error")
        return
    }

    if (!await wither(ns, log, sacrifice)) { // RAM: 550MB
        log.warn("Could not wither %s", sacrifice)
    }

    if (!await spread(ns, log, sacrifice)) { // RAM: 800MB
        log.warn("Could not spread to %s", sacrifice)
    }
}

/**
 * Wither a future sacrifice mind away, bending their will to the elder ones.
 *
 * @remarks RAM cost: 550MB
 * @param {NS} ns
 * @param {Whisperer} log
 * @param {string} sacrifice Sacrifice to be
 * @returns wether the target was breached
 **/
export async function wither(ns: NS, log: Whisperer, sacrifice: string): Promise<boolean> {
    // Skip if already breached
    if (ns.hasRootAccess(sacrifice)) return true // RAM: 50MB

    const neededPorts = ns.getServerNumPortsRequired(sacrifice) // RAM: 100MB
    if (neededPorts >= 6) {
        log.toast("Requires 6 or more opened ports! { %s }", "warning", sacrifice);
        return false;
    }

    // Breach ports
    if (ns.fileExists("SQLInject.exe", "home")) { // RAM: 100MB
        ns.sqlinject(sacrifice); // RAM: 50MB
    } else if (neededPorts >= 5) {
        return false;
    }

    if (ns.fileExists("HTTPWorm.exe", "home")) {
        ns.httpworm(sacrifice); // RAM: 50MB
    } else if (neededPorts >= 4) {
        return false;
    }

    if (ns.fileExists("relaySMTP.exe", "home")) {
        ns.relaysmtp(sacrifice); // RAM: 50MB
    } else if (neededPorts >= 3) {
        return false;
    }

    if (ns.fileExists("FTPCrack.exe", "home")) {
        ns.ftpcrack(sacrifice); // RAM: 50MB
    } else if (neededPorts >= 2) {
        return false;
    }

    if (ns.fileExists("BruteSSH.exe", "home")) {
        ns.brutessh(sacrifice); // RAM: 50MB
    } else if (neededPorts >= 1) {
        return false;
    }

    // Acquire root access if needed
    ns.nuke(sacrifice); // RAM: 50MB
    log.toast("** Root access acquired ** { %s }", "info", sacrifice);

    return true
}

/**
 * Spread the Temple's corruption to the target
 *
 * @remarks RAM cost: 800MB
 * @param {NS} ns
 * @param {Whisperer} log
 * @param {string} sacrifice Target to spread to
 * @returns true if all corruptions have been updated
 */
export async function spread(ns: NS, log: Whisperer, sacrifice: string): Promise<boolean> {
    // Transfer updated version of scripts
    const scripts = ns
        .ls("home") // RAM: 200MB
        .filter((f) => (f.startsWith("_corruptions/") || f.startsWith("_necronomicon/")) && f.endsWith(".js"));

    log.info("Spreading %s corruptions to %s", scripts.length, sacrifice)

    return ns.scp(scripts, sacrifice, "home") // RAM: 600MB
}

// Unsuported public API yet for autocomplete
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServerData = { [key: string]: any }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data: ServerData, args: string[]): string[] {
    return ["--help", "--verbose", "--quiet", ...data.servers]
}