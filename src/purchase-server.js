/** @param {NS} ns **/
export async function main(ns) {
    let servers = ns.getPurchasedServers();
    let ram = 8;
    for (let i = servers.length; i < ns.getPurchasedServerLimit(); i++) {
        let name = "pserv-" + i;
        while (ns.getPurchasedServerCost(ram) > ns.getServerMoneyAvailable("home")) {
            await ns.sleep(3000);
        }
        ns.purchaseServer(name, ram);
    }
}