import { NodeStats, NS, Player } from "@ns";
import { MINUTE } from "/_necronomicon/forbidden_knowledge";
import { KeeperOfHacks, KeeperOfInventory } from "/_necronomicon/keeper";
import { Whisperer } from "/_necronomicon/whisperer";

const RECRUITING_HACKNET = true

/**
 * Hustle our way to passive disposable income
 *
 * @remarks RAM cost: 5.90GB
 *
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
            `Hustle our way to passive disposable income`,
            `Example:`,
            `  > run ${ns.getScriptName()} -t 8 ...`
        ].join("\n"))
        return
    }

    // Initialise the logger
    const log: Whisperer = new Whisperer(ns, Whisperer.FromVerbosity(args.verbose as boolean, args.quiet as boolean))

    // Scan the hacknet
    const hacknetNodes = await listNodes(ns) // RAM cost: 4.00GB (ns.hacknet)
    await (new KeeperOfHacks(ns)).entrust(hacknetNodes)

    // Grow the hacknet to increase pasive income
    const hacknetRecruits: HacknetRecruits = { purchasedNodes: 0, purchasedLevels: 0, purchasedRam: 0, purchasedCores: 0 }

    while (RECRUITING_HACKNET && await shouldContinue(ns)) { // RAM cost: 0.30GB
        const recruitmentRound = await recruitHacknet(ns) // RAM cost: 4.10GB - 0.10GB
        if (recruitmentRound.purchasedNodes == 0) break

        hacknetRecruits.purchasedNodes += recruitmentRound.purchasedNodes
        hacknetRecruits.purchasedLevels += recruitmentRound.purchasedLevels
        hacknetRecruits.purchasedRam += recruitmentRound.purchasedRam
        hacknetRecruits.purchasedCores += recruitmentRound.purchasedCores

        await ns.sleep(1)
    }

    // Update the keeper after the recruitment
    await (new KeeperOfHacks(ns)).entrust(await listNodes(ns))

    await notifyCultLeader(ns, log, hacknetRecruits)
}


/**
 * Evaluate if the script should continue spend money on recruits.
 *
 * If the passiveIncome is not provided, all corresponding conditions will be ignored.
 *
 * @remarks RAM cost: 0.30GB
 *
 * @param {NS} ns NetScript object
 * @param {number} passiveIncome $/sec of the player.
 * @returns Wether if the script should continue to spend money.
 */
export async function shouldContinue(ns: NS): Promise<boolean> {
    // Pocket change = 1 million
    const playerMoney = ns.getServerMoneyAvailable("home") // RAM cost: 0.10GB
    if (playerMoney < 1e6) return false

    // Keep enough to upgrade home server to 32GB RAM
    if (ns.getServerMaxRam("home") < 32) return playerMoney > 5e6 // RAM cost: 0.05GB

    // Player related multipliers
    const player: Player | undefined = await (new KeeperOfInventory(ns)).listen() // RAM cost: 0.00GB
    const hacknetMult = player?.mults?.hacknet_node_money ?? 1;

    // Boost passive income to 500/sec
    const curretIncome = await passiveIncome(ns) // RAM cost: 0.00GB
    if (curretIncome < 500 * hacknetMult) return true

    // Pocket change = Keep 5 minute of cash flow
    if (playerMoney < curretIncome * 5 * MINUTE) return false

    const hackingLevel = ns.getHackingLevel() // RAM cost: 0.05GB


    // Keep enough to buy the next softwares
    if (!ns.fileExists("BruteSSH.exe", "home")) return playerMoney > 1e6 // RAM cost: 0.10GB
    if (hackingLevel >= 100 && !ns.fileExists("FTPCrack.exe", "home")) return playerMoney > 2e6

    // Grow to 2k/sec then keep for 64GB RAM update
    if (curretIncome < 2e3) return true
    if (ns.getServerMaxRam("home") < 64) return playerMoney > 15e6

    // Keep enough to buy the next softwares then grow hacknet and repeat
    if (hackingLevel >= 150 && !ns.fileExists("relaySMTP.exe", "home")) return playerMoney > 7.5e6
    if (curretIncome < 10e3) return true

    if (hackingLevel >= 200 && !ns.fileExists("HTTPWorm.exe", "home")) return playerMoney > 50e6
    if (curretIncome < 25e3) return true

    if (hackingLevel >= 500 && !ns.fileExists("SQLInject.exe", "home")) return playerMoney > 400e6

    // We want Formulas.exe quickly
    if (!ns.fileExists("Formulas.exe", "home")) return playerMoney > 5e9

    return true
}


/**
 * Euristic for the amound of money to spend on one upgrade.
 *
 * If the passiveIncome is not provided, all corresponding conditions will be ignored.
 *
 * @remarks RAM cost: 0.10GB
 *
 * @param {NS} ns NetScript object
 * @param {number} passiveIncome $/sec of the player.
 * @returns amount of spendable $ (on 1 item).
 */
export async function purchaseMaxCost(ns: NS): Promise<number> {
    const playerMoney = ns.getServerMoneyAvailable("home") // RAM cost: 0.10GB

    // We want to spend between 1% and 10% of our money
    // But never more than 1 minute of passive income
    return Math.max(
        Math.min(
            await passiveIncome(ns) * MINUTE,
            playerMoney * 0.1
        ),
        playerMoney * 0.01
    )
}


/**
 * Spamming the tosts for every single recruit is annoying.
 *
 * @remarks RAM cost: 0.00GB
 *
 * @param {NS} ns NetScript object
 * @param {HacknetRecruits} hacknetRecruits Hacknet Recruits.
 */
export async function notifyCultLeader(ns: NS, log: Whisperer, hacknetRecruits: HacknetRecruits): Promise<void> {
    if (hacknetRecruits.purchasedNodes > 0
        || hacknetRecruits.purchasedLevels > 0
        || hacknetRecruits.purchasedRam > 0
        || hacknetRecruits.purchasedCores > 0
    ) {
        const upgrades = []

        if (hacknetRecruits.purchasedNodes > 0) {
            upgrades.push(`Recruited ${hacknetRecruits.purchasedNodes} nodes.`)
        }

        if (hacknetRecruits.purchasedLevels > 0 || hacknetRecruits.purchasedRam > 0 || hacknetRecruits.purchasedCores > 0) {
            upgrades.push(`Upgraded nodes with`)
            const nodeUpgrades = []

            if (hacknetRecruits.purchasedLevels > 0) nodeUpgrades.push(`${hacknetRecruits.purchasedLevels} levels`)
            if (hacknetRecruits.purchasedRam > 0) nodeUpgrades.push(`${hacknetRecruits.purchasedRam} RAM upgrades`)
            if (hacknetRecruits.purchasedCores > 0) nodeUpgrades.push(`${hacknetRecruits.purchasedCores} cores`)

            upgrades.push(nodeUpgrades.join(', ') + ".")
        }

        log.toast(upgrades.reverse().join(" "))
    } else {
        log.info(`Growing the cult hacknet is too expensive`)
    }
}


// ANCHOR Hacknet

/**
 * List all the hacknet nodes.
 *
 * @remarks RAM cost: 4.00GB (ns.hacknet)
 *
 * @param {NS} ns NetScript object
 * @returns List of nodes.
 */
export async function listNodes(ns: NS): Promise<NodeStats[]> {
    const nodes: NodeStats[] = []
    const hacknet = ns.hacknet  // RAM cost: 4.00GB
    for (let i = 0; i < hacknet.numNodes(); i++) nodes.push(hacknet.getNodeStats(i))
    return nodes
}

/**
 * Compute the total production of the hacknet nodes.
 *
 * @remarks RAM cost: 0.00GB
 *
 * @param {NS} ns NetScript object
 * @returns Total $/sec of the hacknet nodes.
 */
export async function passiveIncome(ns: NS): Promise<number> {
    return (await (new KeeperOfHacks(ns)).listen() ?? [])
        .reduce((total, node) => total + node.production, 0)
}

type HacknetRecruits = { purchasedNodes: number, purchasedLevels: number, purchasedRam: number, purchasedCores: number }

/**
 * Recruit Hacknet nodes.
 *
 * @remarks RAM cost: 4.10GB (ns.hacknet)
 *
 * @param {NS} ns NetScript object
 * @returns Amount of recruits and upgrades purchased.
 */
export async function recruitHacknet(ns: NS): Promise<HacknetRecruits> {
    const hacknet = ns.hacknet  // RAM cost: 4.00GB
    const upgrades = { purchasedNodes: 0, purchasedLevels: 0, purchasedRam: 0, purchasedCores: 0 }

    let maxCost = await purchaseMaxCost(ns) // RAM cost: 0.10GB

    // Purchase a node if possible
    const purchasedNodeCost = hacknet.getPurchaseNodeCost()
    if (purchasedNodeCost < maxCost) {
        const newNode = hacknet.purchaseNode()
        if (newNode != -1) {
            upgrades.purchasedNodes++
            maxCost -= purchasedNodeCost

            // I'm a bit anal about levels...
            if (hacknet.upgradeLevel(newNode, 9)) {
                upgrades.purchasedLevels += 10
            }
        }
    }

    // Then upgrade node after node
    const nodes = await listNodes(ns) // RAM cost: 0.00GB (ns.hacknet)
    nodes.map((_, i) => i).forEach(i => {
        const levelUpdagradeCost = hacknet.getLevelUpgradeCost(i, 10)
        if (levelUpdagradeCost < maxCost) {
            if (hacknet.upgradeLevel(i, 10)) {
                upgrades.purchasedLevels += 10
                maxCost -= levelUpdagradeCost
            }
        }

        const ramUpgradeCost = hacknet.getRamUpgradeCost(i, 1)
        if (ramUpgradeCost < maxCost) {
            if (hacknet.upgradeRam(i, 1)) {
                upgrades.purchasedRam++
                maxCost -= ramUpgradeCost
            }
        }

        const coreUpgradeCost = hacknet.getCoreUpgradeCost(i, 1)
        if (coreUpgradeCost < maxCost) {
            if (hacknet.upgradeCore(i, 1)) {
                upgrades.purchasedCores++
                maxCost -= coreUpgradeCost
            }
        }
    })

    return upgrades
}
