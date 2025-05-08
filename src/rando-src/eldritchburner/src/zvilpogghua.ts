import { NS } from "@ns";
import { WorkRef } from "/_necronomicon/chamberlain";
import { MINUTE } from "/_necronomicon/forbidden_knowledge";
import { KeeperOfInventory, KeeperOfNetwork, ServerRef } from "/_necronomicon/keeper";
import { uuid } from "/_necronomicon/name-giver";
import { Whisperer, fmt } from "/_necronomicon/whisperer";
import { availableRam } from "/cthulhu";

const THRESHOLD_MAX_SECURITY = 5
const THRESHOLD_MONEY_PERCENT = 0.75

/**
 * Zvilpogghua will feast on the corrupted
 *
 * @remarks RAM cost: 9.99GB
 * @param {NS} ns NetScript object
 */
export async function main(ns: NS): Promise<void> {
    // CLI Argument parsing
    const args = ns.flags([
        ["help", false],
        ["verbose", false],
        ["quiet", false],
        ["strategy", "auto"],
        ["duration", 5]
    ]);

    if (!(args._ instanceof Array)) args._ = [args._.toString()]
    if (args.help || args._.length > 1) {
        ns.tprint([
            `Usage: run ${ns.getScriptName()}`,
            `Zvilpogghua will feast on the corrupted`,
            `Example:`,
            `  > run ${ns.getScriptName()}`
        ].join("\n"))
        return
    }

    // Initialise the logger
    const log: Whisperer = new Whisperer(ns, Whisperer.FromVerbosity(args.verbose as boolean, args.quiet as boolean))
    log.toast("We sacrifice to thy!", "success")

    ns.disableLog("exec")

    // NOTE: This is in MS, but input is in MINUTES
    const corruptionDuration = args.duration as number * MINUTE
    const sacrifices = await chooseJuiciesSacrifices(ns)

    await runFor(ns, corruptionDuration, async () => {
        if (sacrifices.length == 0) {
            log.warn("None of the juiceiests servers are subdued, can't proceed with sacrifice.")
            await ns.sleep(MINUTE);
            return
        }
        const sacrificeUuid = `sacrifice-${uuid().split("-")[0]}`
        const slots = await findCorruptedMembers(ns)

        for (const slot of slots) {
            const sacrifice = sacrifices.shift()
            // We cycle through the sacrifices, so it should never be empty
            if (!sacrifice) return
            else sacrifices.push(sacrifice)

            await protoBatching(ns, log, sacrifice, slot, corruptionDuration * 2.5, sacrificeUuid)
            await ns.sleep(1)
        }
    })

    // We started the feast, nudge the great old...
    ns.spawn("/cthulhu.js", 1, `--strategy=${args.strategy}`)
}

/**
 * Repeatly execute the given async function for the duration
 *
 * @remarks RAM cost: 0kB
 * @param {NS} ns NetScript object
 * @param {number} duration number of ms to run for
 * @param {async (): void} fn async function to execute
 * @param {number} delay delay in ms between execution (default: 1000ms)
 */
export async function runFor(ns: NS, duration: number, fn: () => Promise<void>, delay = 1000): Promise<void> {
    const loop_id = ["zvlipogghua", ns.getScriptName(), performance.now()].join(":")
    performance.mark(loop_id)

    while (performance.measure(loop_id, loop_id).duration < duration) {
        await fn()
        await ns.sleep(delay)
    }

    performance.clearMarks(loop_id)
    performance.clearMeasures(loop_id)
}

export type CorruptionSlot = { server: ServerRef, ram: number }
export const RAM_RESERVES: { [key: string]: number } = {
    "home": 512,
}

/**
 * Find all the corrupted members available for the ceremony using Cthulhu's store
 *
 * @remarks RAM cost: 100MB
 * @param {NS} ns NetScript object
 * @returns {CorruptionSlot[]} Availables corrupted members
 */
export async function findCorruptedMembers(ns: NS, maxSlotSize = 4096): Promise<CorruptionSlot[]> {
    const network = await (new KeeperOfNetwork(ns)).listen()

    return _(network)
        .values()
        .filter({ sensus: { hasAdminRights: true } })
        // Remove reserved ram for named servers
        .map(server => {
            const ram = availableRam(ns, server.hostname) - (RAM_RESERVES[server.hostname] ?? 0) // RAM: 100MB
            return { server, ram } as CorruptionSlot
        })
        // Filter out slots with no ram (so no slots on them, might be <0 because of reserves)
        .filter(slot => slot.ram >= 2)
        .flatMap(slot => {
            if (slot.ram <= maxSlotSize) return [slot]
            const parts = Math.min(10, Math.floor(slot.ram / maxSlotSize))
            const ramPart = Math.floor(slot.ram / parts)
            return _.range(parts).map(i => i != 0 ?
                { ...slot, ram: ramPart } :
                { ...slot, ram: slot.ram - ramPart * (parts - 1) }
            )
        })
        .value() as CorruptionSlot[]
}

/**
 * Choose a juicy sacrifice according to the last network map and recomendations
 *
 * @remarks RAM cost: 0kB
 * @param {NS} ns NetScript object
 * @param {Whisperer} log
 * @returns {ServerRef?} if found a juicy sacrifice
 */
export async function chooseJuiciesSacrifices(ns: NS): Promise<ServerRef[]> {
    const inventory = await (new KeeperOfInventory(ns)).listen()
    const network = await (new KeeperOfNetwork(ns)).listen() ?? {}

    // This is a primitive implementation
    return _(network)
        .filter({ sensus: { purchasedByPlayer: false } })
        .filter({ sensus: { hasAdminRights: true } })
        .filter(s => s.sensus.requiredHackingSkill <= (inventory?.skills?.hacking ?? 1))
        .shuffle()
        .sortBy((s: ServerRef) => -1 *
            (s.sensus.serverGrowth * s.sensus.moneyMax * ((inventory?.skills?.hacking ?? 1) - s.sensus.requiredHackingSkill)) /
            (s.sensus.minDifficulty * s.sensus.requiredHackingSkill)
        )
        .take(15)
        .value() as ServerRef[]
}

/**
 * Proto Batching algorithm
 *
 * @remarks RAM cost: 1.75GB
 * @param {NS} ns NetScript object
 * @param {Whisperer} log
 */
export async function protoBatching(ns: NS, log: Whisperer, sacrifice: ServerRef, slot: CorruptionSlot, corruptionDuration: number, sacrificeUuid: string): Promise<void> {
    const corruption = WorkRef.FromPath("_corruptions/ebola.js")
    const slotCost = ns.getScriptRam(corruption.path) // RAM: 100MB

    // See how many threads we can fit in the slot
    const numThreads = Math.floor(slot.ram / slotCost)
    if (numThreads <= 0) return

    // Sacrifice status
    const money = ns.getServerMoneyAvailable(sacrifice.hostname) // RAM: 100MB
    const fatSacrifice = sacrifice.sensus.moneyMax * THRESHOLD_MONEY_PERCENT < money

    const security = ns.getServerSecurityLevel(sacrifice.hostname) // RAM: 100MB
    const lowSecurity = security < (sacrifice.sensus.minDifficulty + THRESHOLD_MAX_SECURITY)

    const sacrificeIsReady = fatSacrifice && lowSecurity

    // Batch orders
    const ceremonialSacrifice = []
    if (sacrificeIsReady) ceremonialSacrifice.push(security <= sacrifice.sensus.minDifficulty + 1 ? "H" : "HW", "GW")
    else {
        if (!lowSecurity) ceremonialSacrifice.push("W")
        if (!fatSacrifice) ceremonialSacrifice.push(lowSecurity ? "GGW" : "GW")
    }

    const roundsForFatSacrifice: number = 1 + Math.ceil(corruptionDuration / // RAM: 150MB
        (2 * ns.getWeakenTime(sacrifice.hostname) +
            ns.getHackTime(sacrifice.hostname) +
            ns.getGrowTime(sacrifice.hostname))
    )

    // If the sacrifice is not ready we do less round for better turnover
    const numberOfSacrifices = Math.ceil(roundsForFatSacrifice / (!sacrificeIsReady ? 5 : 1))

    const pid = ns.exec( // RAM: 1.3GB
        corruption.path,
        slot.server.hostname,
        numThreads,
        `--uuid=${sacrificeUuid}-${slot.server.hostname}`,
        sacrifice.hostname,
        numberOfSacrifices,
        ceremonialSacrifice.join("")
    )

    if (pid != 0) {
        log.info([
            "Sacrificing `%s`",
            "> batch: %s * %d",
            "> from: `%s` * %d",
            "> cash: %s$ {max: %s$, thres: %s$}",
            "> security: %d {min: %d, thres: %d}"
        ].join("\n\t"),
            sacrifice.hostname,
            ceremonialSacrifice.join("").toUpperCase(),
            numberOfSacrifices,
            slot.server.hostname, numThreads,
            fmt.bigNum(money), fmt.bigNum(sacrifice.sensus.moneyMax),
            fmt.bigNum(sacrifice.sensus.moneyMax * THRESHOLD_MONEY_PERCENT),
            security, sacrifice.sensus.minDifficulty, sacrifice.sensus.minDifficulty + THRESHOLD_MAX_SECURITY
        )
    } else {
        log.error("Failed to start %s on %s", corruption.id, slot.server.hostname)
    }
}

// ANCHOR: autocomplete
// Unsuported public API yet for autocomplete
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServerData = { [key: string]: any }
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data: ServerData, args: string[]): string[] {
    return ["--help", "--verbose", "--quiet", ...data.servers]
}
