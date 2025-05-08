import { NS } from "@ns";
import { Collection } from "lodash";
import { networkScan } from "/_ceremonies/sensus";
import { KeeperOfInventory, KeeperOfNetwork, ServerRef } from "/_necronomicon/keeper";
import { Whisperer } from "/_necronomicon/whisperer";

/**
 * The great old one will spread the corruption
 *
 * This script MUST run on <5.5GB as it's the entrypoint
 * of the whole process, and should keep 1.5GB available
 * on home.
 *
 * @remarks RAM cost: 5.20GB (NS: 3.6GB)
 * @param {NS} ns NetScript object
 */
export async function main(ns: NS): Promise<void> {
    // CLI Argument parsing
    const args = ns.flags([
        ["help", false],
        ["verbose", false],
        ["quiet", false],
        ["strategy", "auto"],
        ["skip", []],
        ["only", []],
    ]);

    if (!(args._ instanceof Array)) args._ = [args._.toString()]
    if (args.help || args._.length > 1) {
        ns.tprint([
            `Usage: run ${ns.getScriptName()}`,
            `The great old one will spread the corruption`,
            `Example:`,
            `  > run ${ns.getScriptName()}`,
            `  > run ${ns.getScriptName()} --only=spread`
        ].join("\n"))
        return
    }

    // Initialise the logger
    const log: Whisperer = new Whisperer(ns, Whisperer.FromVerbosity(args.verbose as boolean, args.quiet as boolean))
    if (ns.getHostname() != "home") {
        log.toast("Cthulhu growth must be started from your main cult base", "error")
        ns.exit()
    }

    log.toast("Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn!", "success")

    // Computing steps asked
    const onlySteps: string[] = (args.only as string[]).flatMap(x => x.split(',')).filter(_.identity)
    const skipSteps: string[] = (args.skip as string[]).flatMap(x => x.split(',')).filter(_.identity)
    const steps: Collection<string> = _(STEPS)
        .filter(s => onlySteps.length == 0 || _.includes(onlySteps, s.name))
        .filter(s => !_.includes(skipSteps, s.name))
        .flatMap(s => [s, ...s.deps?.map(d => _.find(STEPS, { name: d }) as CthulhuStep) ?? []])
        // We need to remove the skipped before and after including the dependencies
        .filter(s => !_.includes(skipSteps, s.name))
        .map("name")
        .uniq()

    // ANCHOR: Withering the feeeble-minded
    if (steps.includes("wither")) {
        log.info("The Dreamer will set their gaze upon the world and corrupt the feeble-minded.")
        await witheringGaze(ns, log)
    }

    // ANCHOR: Ceremonial
    const ceremonials = steps.filter(s => s.startsWith("ceremonies:")).map(s => s.slice(11)).clone()
    for (const ceremonial of ceremonials) {
        log.info("Starting ceremonies of ceremonial: %s", ceremonial)

        const ceremonies: CthulhuCeremony[] = CEREMONIES.filter(x => x.ceremonial == ceremonial)
        for (const { name, allocation } of ceremonies) {
            await waitFor(ns, await startCursedChant(ns, log, `_ceremonies/${name}`, allocation ?? 0))
        }
    }

    // ANCHOR: Spreading the corruption
    if (steps.includes("spread")) {
        log.info("Spreading corruption")
        for (const server of _.filter(await networkScan(ns), s => s.hostname != "home" && s.sensus.hasAdminRights)) {
            await waitFor(ns, await startCursedChant(ns, log, "_corruptions/naegleria/spread", 0, server.hostname))
        }
    }

    // ANCHOR: Network sensus
    if (steps.includes("sensus")) {
        log.info("Starting a sensus...")
        if (!await startCursedChant(ns, log, `_ceremonies/sensus`, 12)) {
            log.toast("Could not start a full sensus, updating the keeper with minimal infos", "warning")
            await (new KeeperOfNetwork(ns)).entrust(await networkScan(ns))
            await (new KeeperOfInventory(ns)).clear()
        }
    }

    // ANCHOR: Spawning Zvilpogghua
    if (steps.includes("spawn")) {
        log.toast("Zvilpogghua I order thy to wake up")
        ns.spawn("/zvilpogghua.js", 1, `--strategy=${args.strategy}`)
    }
}

// SECTION: Configurations

type CthulhuCeremony = { name: string, ceremonial: string, allocation?: number }
const CEREMONIES: CthulhuCeremony[] = [
    { name: "evangelization", ceremonial: "peasantWorks" },
    { name: "hustle-culture", ceremonial: "peasantWorks" },
]

type CthulhuStep = { name: string, deps?: string[] }
const STEPS: CthulhuStep[] = [
    { name: "wither", deps: ["spread", "sensus"] },
    { name: "spawn", deps: ["sensus"] },
    { name: "ceremonies", deps: _.uniq(CEREMONIES.map(c => `ceremonies:${c.ceremonial}`)) },
    ...[
        "spread",
        "sensus",
        ..._.uniq(CEREMONIES.map(c => `ceremonies:${c.ceremonial}`))
    ].map(n => { return { name: n } as CthulhuStep })
]
// !SECTION

// SECTION: Services management
/**
 * Return the available ram on the given server (in GB)
 *
 * @remarks RAM cost: 0.1GB
 * @param {NS} ns NetScript object
 * @param {ServerRef | string} server
 * @returns {number} The available ram in GB
 */
export function availableRam(ns: NS, server: ServerRef | string): number {
    const hostname = typeof server == "string" ? server : server.hostname
    return ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname)
}

/**
 * Wait for a chant to finish
 *
 * @remarks RAM cost: 0.1GB
 * @param {NS} ns
 * @param {number} pid chant to wait for
 */
export async function waitFor(ns: NS, pid: number | undefined): Promise<void> {
    while (pid && ns.isRunning(pid as number)) await ns.sleep(50)
}

/**
 * Start a cursed chant in the Temple, ensuring that other voices
 * can still be heard.
 *
 * There is no garanties of unicities of started chants
 *
 * @remarks RAM cost: 1.1GB
 * @param {NS} ns Netscript object
 * @param {string} cursedChant service name
 * @param {number} ramAllocation ensure the ammount of RAM GB will be available after starting (else don't start)
 * @param {...[]} chatArgs arguments passed to the chant
 * @returns PID of the chant if started
 */
export async function startCursedChant(
    ns: NS,
    log: Whisperer,
    cursedChant: string,
    ramAllocation = 0,
    ...chantArgs: (string | number | boolean)[]
): Promise<number | undefined> {
    // Allocate the ram for the service
    if (ns.getScriptRam(`${cursedChant}.js`) > availableRam(ns, "home") - ramAllocation) {
        log.warn("Not enough RAM to run start service: %s %s", cursedChant, chantArgs)
        // Could not start service
        return undefined
    }

    log.debug("Starting cursed chant: %s", cursedChant)
    const pid = ns.run(`${cursedChant}.js`, 1, ...chantArgs)

    if (pid <= 0) {
        log.error("Failed to start service: %s (pid=%d)", cursedChant, pid)
        return undefined
    }

    // Script started successfully
    return pid
}
// !SECTION

// SECTION[id=witheringGaze]: Corruption: Withering the minds
/**
 * The Dreamer will set their gaze upon the world and corrupt the feeble-minded.
 *
 * @remarks RAM usage: 1.45GB
 * @param {NS} ns
 * @param {Whisperer} log
 */
export async function witheringGaze(ns: NS, log: Whisperer): Promise<void> {
    // Network scanning will occur a lot of time while we breack gaze upon alls.
    const attackPerimeter = async (ns: NS) => _(await networkScan(ns))
        .filter((s: ServerRef) => !(s.hostname == "home" || s.sensus.purchasedByPlayer))
        .filter((s: ServerRef) => !s.sensus.hasAdminRights)
        .value() as ServerRef[]

    const witherMind = async (server: ServerRef) => {
        if (server.hostname === "home") return
        await waitFor(ns, await startCursedChant(ns, log, "_corruptions/naegleria/wither", 0, server.hostname))
    }

    // We try until we are not making any nore progress
    // NOTE: Technically a dirrect edge is not necessary, but that's RP on my part
    const perimeter = { previous: ["!undefined#1"], current: ["!undefined#2"] }
    while (perimeter.current && !_.isEqual(perimeter.previous, perimeter.current)) {
        const network = await attackPerimeter(ns)
        for (const server of network) await witherMind(server)

        perimeter.previous = network.map(s => s.hostname).sort()
        perimeter.current = (await attackPerimeter(ns)).map(s => s.hostname).sort()
    }
}
// !SECTION

// ANCHOR: Autocomplete
// Unsuported public API yet for autocomplete
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServerData = { [key: string]: any }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data: ServerData, args: string[]): string[] {
    return ["--help", "--verbose", "--quiet", "--corrupt-only", "--strategy", ...data.servers]
}
