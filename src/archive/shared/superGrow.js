/** @param {NS} ns */
export async function main(ns) {
    let server = ns.args[0];
    let target = ns.args[1];
    let ramAvailable = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
    let ramPerThread = ns.getScriptRam('/scripts/grow.js');
    let threads = Math.floor(ramAvailable / ramPerThread);

    ns.tprint("Super growing on " + target + " with " + threads + " threads.");

    ns.exec('/scripts/grow.js', server, threads, target);
}