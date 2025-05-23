import { NS } from "@ns";

export async function main(ns: NS) {
    const delayTime = Number(ns.args[0]) || 1000;
    const thresholdMultiplier = Number(ns.args[1]) || 1; //Bigger threshold, the less it spends

    while (true) {
        const ownedNodes = ns.hacknet.numNodes();
        let minValue = ns.hacknet.getPurchaseNodeCost();
        let nodeIndex = ownedNodes;
        let upgradeType = -1; //-1 -> purchase, 0 -> level, 1 -> ram, 2 -> core

        for (let i = 0; i < ownedNodes; i++) {
            const upgrades = [
                ns.hacknet.getLevelUpgradeCost(i, 1),
                ns.hacknet.getRamUpgradeCost(i, 1),
                ns.hacknet.getCoreUpgradeCost(i, 1)
            ];

            const value = Math.min(...upgrades);
            if (value < minValue) {
                minValue = value;
                nodeIndex = i;
                upgradeType = upgrades.indexOf(value);
            }
        }

        await waitForMoney(ns, minValue, delayTime, thresholdMultiplier);
        switch (upgradeType) {
            case -1:
                ns.hacknet.purchaseNode();
                break;
            case 0:
                ns.hacknet.upgradeLevel(nodeIndex, 1);
                break;
            case 1:
                ns.hacknet.upgradeRam(nodeIndex, 1);
                break;
            case 2:
                ns.hacknet.upgradeCore(nodeIndex, 1);
                break;
        }

        await ns.sleep(1);
    }
}

async function waitForMoney(ns: NS, targetMoney: number, delayTime: number, thresholdMultiplier: number) {
    while (ns.getPlayer().money / thresholdMultiplier < targetMoney) {
        await ns.sleep(delayTime);
    }
}