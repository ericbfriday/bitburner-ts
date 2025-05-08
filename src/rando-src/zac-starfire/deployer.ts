import { NS } from "@ns";

/** 
 * @param {NS} ns
 * @param {string} hostname The hostname of the target to deploy to.
 *  **/
export async function main(ns: NS, hostname: string) {
    const target = hostname;
    const moneyThresh = ns.getServerMaxMoney(target) * 0.75;
    const securityThresh = ns.getServerMinSecurityLevel(target) + 5;
    const servers: string[] = [];
    const ramPerThread = ns.getScriptRam("/shared/weaken.js");

    let serversToScan = ns.scan("home");
    while (serversToScan.length > 0) {
        const server = serversToScan.shift();
        if (!server) return;
        if (!servers.includes(server) && server !== "home") {
            servers.push(server);
            serversToScan = serversToScan.concat(ns.scan(server));
            await ns.scp([
                "/shared/weaken.js",
                "/shared/grow.js",
                "/shared/hack.js"
            ], server);

            let openPorts = 0;
            if (ns.fileExists("BruteSSH.exe")) {
                ns.brutessh(server);
                openPorts++;
            }
            if (ns.fileExists("FTPCrack.exe")) {
                ns.ftpcrack(server);
                openPorts++;
            }
            if (ns.fileExists("RelaySMTP.exe")) {
                ns.relaysmtp(server);
                openPorts++;
            }
            if (ns.fileExists("HTTPWorm.exe")) {
                ns.httpworm(server);
                openPorts++;
            }
            if (ns.fileExists("SQLInject.exe")) {
                ns.sqlinject(server);
                openPorts++;
            }
            if (ns.getServerNumPortsRequired(server) <= openPorts) {
                ns.nuke(server);
            }
        }
    }

    if (ns.hasRootAccess(hostname)) {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            let sleepTime = 3000;
            for (const server of servers) {
                if (ns.hasRootAccess(server)) {
                    const ramAvailable = ns.getServerMaxRam(server)
                        - ns.getServerUsedRam(server);
                    const threads = Math.floor(ramAvailable / ramPerThread);

                    if (threads > 0) {
                        if (ns.getServerSecurityLevel(hostname) > securityThresh) {
                            sleepTime = ns.getWeakenTime(hostname)
                            ns.exec("/shared/weaken.js", server, threads, hostname);
                        } else if (ns.getServerMoneyAvailable(hostname) < moneyThresh) {
                            sleepTime = ns.getGrowTime(hostname)
                            ns.exec("/shared/grow.js", server, threads, hostname);
                        } else {
                            sleepTime = ns.getHackTime(hostname)
                            ns.exec("/shared/hack.js", server, threads, hostname);
                        }
                    }
                }
            }
            await ns.sleep(sleepTime + 100);
        }
    }
}