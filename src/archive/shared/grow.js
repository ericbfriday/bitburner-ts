/** @param {NS} ns */
export async function main(ns) {
    let target = ns.args[0];
    let serverMoneyAvailable = ns.getServerMoneyAvailable(target);
    let serverMaxMoney = ns.getServerMaxMoney(target);

    while (serverMoneyAvailable < (serverMaxMoney * 0.75)) {
        serverMoneyAvailable = ns.getServerMoneyAvailable(target);
        serverMaxMoney = ns.getServerMaxMoney(target);

        ns.tprint("-------------------------------------------------------");
        ns.tprint("Server money available on " + target + " is " + ns.nFormat(serverMoneyAvailable, "$0.000a" + "."));
        ns.tprint("Server max money on " + target + " is " + ns.nFormat(serverMaxMoney, "$0.000a" + "."));
        ns.tprint("Starting grow on " + target + " with " + ns.getHostname() + " to " + ns.nFormat(serverMaxMoney * 0.75, "$0.000a") + "...");

        await ns.grow(target);
    }

    serverMoneyAvailable = ns.getServerMoneyAvailable(target);
    serverMaxMoney = ns.getServerMaxMoney(target);

    ns.tprint("-------------------------------------------------------");
    ns.tprint("Optimal current money on " + target + " reached !!!");
    ns.tprint("Server money available on " + target + " is " + ns.nFormat(serverMoneyAvailable, "$0.000a" + "."));
    ns.tprint("Server max money on" + target + " is " + ns.nFormat(serverMaxMoney, "$0.000a" + "."));
}