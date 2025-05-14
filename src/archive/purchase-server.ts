import { NS } from "@ns";

export async function main(ns: NS) {
    const servers = ns.getPurchasedServers();
    const ram = 8;
    for (let i = servers.length; i < ns.getPurchasedServerLimit(); i++) {
        const name = "pserv-" + i;
        while (ns.getPurchasedServerCost(ram) > ns.getServerMoneyAvailable("home")) {
            await ns.sleep(3000);
        }
        ns.purchaseServer(name, ram);
    }
}