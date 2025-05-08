import { NS } from "@ns";

export async function main(ns: NS) {
    ns.enableLog('ALL');
    // Globals
    const servers = ['n00dles', 'foodnstuff', 'joesguns', 'harakiri-sushi', 'hong-fang-tea', 'iron-gym', 'neo-net', 'zer0', 'phantasy', 'max-hardware', 'omega-net', 'silver-helix', 'the-hub'];
    // default value = ['n00dles', 'foodnstuff', 'joesguns', 'harakiri-sushi', 'hong-fang-tea', 'iron-gym', 'neo-net',
    //	'zer0', 'phantasy', 'max-hardware', 'omega-net', 'silver-helix', 'the-hub', 'rothman-uni',
    //	'sigma-cosmetics', 'aevum-police', 'summit-uni', 'rho-construction', '.', 'alpha-ent',
    //	'zb-institute', 'lexo-corp', 'catalyst', 'millenium-fitness'];

    const targets = ['max-hardware', 'omega-net', 'silver-helix', 'the-hub', 'rothman-uni'];
    // ['rho-construction', 'rho-construction', 'rho-construction', 'rho-construction', 'rho-construction', 'rho-construction', 'rho-construction',
    // 	'rho-construction', 'rho-construction', 'rho-construction', 'rho-construction', 'rho-construction', 'rho-construction', 'rho-construction',
    // 	'rho-construction', 'aevum-police', 'summit-uni', 'rho-construction', 'alpha-ent', 'alpha-ent',
    // 	'zb-institute', 'lexo-corp', 'catalyst', 'millenium-fitness'];

    const script = '/scripts/hack.ts';
    //const script = '/scripts/share.js';

    // Variables
    let totalRAMavailable = 0;
    let serverRAM = 0;

    // Calculate total RAM available on all servers 
    for (let index = 0; index < servers.length; index++) {
        ns.killall(servers[index]);
        serverRAM = ns.getServerMaxRam(servers[index]);
        totalRAMavailable += serverRAM;

        //ns.tprint("Server RAM available = " + serverRAM);
    }


    for (let index = 0; index < servers.length; index++) {
        const ramAvailable = ns.getServerMaxRam(servers[index]) - ns.getServerUsedRam(servers[index]);
        const ramPerThread = ns.getScriptRam(script);
        const threads = Math.floor(ramAvailable / ramPerThread);

        ns.tprint(threads + " threads can be runned on " + servers[index] + ".");

        if (threads > 0) {
            ns.tprint("Starting " + script + " on " + targets[index] + " with " + servers[index] + ".");
            ns.exec(script, servers[index], threads, targets[index]);
        }
        else {
            ns.tprint("NOT ENOUGH MEMORY ON " + servers[index] + ".");
        }


        // eslint-disable-next-line @typescript-eslint/no-extra-semi
    };

    ns.tprint("Total RAM available = " + totalRAMavailable);
}