import { NS } from "@ns";

export async function main(ns: NS) {
    const target: string = (ns.args[0] as string);
    let securityLevelMin;
    let currentSecurityLevel;
    let serverMaxMoney;
    let serverMoneyAvailable;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        securityLevelMin = ns.getServerMinSecurityLevel(target);  // Get the Min Security Level
        currentSecurityLevel = ns.getServerSecurityLevel(target);    // Get max money for server

        ns.tprint("---------------------------------------------------------------");
        ns.tprint("Starting attack on " + target + " with " + ns.getHostname() + "...");

        while (currentSecurityLevel > securityLevelMin + 5) {
            ns.tprint("---------------------------------------------------------------");
            ns.tprint(target + " min security level is " + securityLevelMin);
            ns.tprint("Current security level on " + target + " is " + ns.nFormat(currentSecurityLevel, "0.00") + ".");
            ns.tprint("Weakening " + target + " with " + ns.getHostname() + "...");

            await ns.weaken(target);
            currentSecurityLevel = ns.getServerSecurityLevel(target)
        }

        ns.tprint("---------------------------------------------------------------");
        serverMoneyAvailable = ns.getServerMoneyAvailable(target);
        serverMaxMoney = ns.getServerMaxMoney(target);

        ns.tprint("Minimum security level on " + target + " reached !!!");

        while (serverMoneyAvailable < (serverMaxMoney * 0.75)) {
            ns.tprint("---------------------------------------------------------------");
            ns.tprint(target + " Current Money: " + ns.nFormat(serverMoneyAvailable, "$0.000a"));
            ns.tprint(target + " Max Money: " + ns.nFormat(serverMaxMoney, "$0.000a"));
            ns.tprint("Growing " + target + " with " + ns.getHostname() + " to " + ns.nFormat(serverMaxMoney * 0.75, "$0.000a") + "...");

            await ns.grow(target);
            serverMoneyAvailable = ns.getServerMoneyAvailable(target);
            serverMaxMoney = ns.getServerMaxMoney(target);
        }

        ns.tprint("---------------------------------------------------------------");
        ns.tprint("Optimal current money on " + target + " reached !!!");
        ns.tprint(target + " Current Money: " + ns.nFormat(serverMoneyAvailable, "$0.000a"));
        ns.tprint(target + " Max Money: " + ns.nFormat(serverMaxMoney, "$0.000a"));
        ns.tprint("---------------------------------------------------------------");
        ns.tprint("Hacking " + target + " with " + ns.getHostname() + "...");

        await ns.hack(target);
        serverMoneyAvailable = ns.getServerMoneyAvailable(target)
        serverMaxMoney = ns.getServerMaxMoney(target);
    }
}