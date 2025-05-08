import type { NS } from '@ns';
/** 
 * @param {} ns 
 * **/
export async function main(ns: NS) {
    ns.run("v3/deployer.js", 1);
    ns.run("v2/purchase-servers.js", 1);
}