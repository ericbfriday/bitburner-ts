/** @param {NS} ns **/
export async function main(ns) {
    ns.run("deployer.js", 1);
    ns.run("purchase-servers.js", 1);
}