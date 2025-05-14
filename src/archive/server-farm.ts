import { NS } from "@ns";

export async function main(ns: NS) {
    // Globals
    const memory = 262144;  // Memory to purchase on the servers
    const numOfServers = 1;  // For use with the purchase calculation dry run or purchasing Server Farms
    const hostNamePrefix = "SERVER-";  // When creating a server farm, prefix servers with this name
    const buy = false;  // Check prices or simulate the purchase before you actually buy

    // Variables
    let serverName;
    const serversCost = ns.getPurchasedServerCost(memory) * numOfServers;  // Comment out * numOfServers if needed
    const totalCost = serversCost * numOfServers;

    // Quick total purchase cost dry calculation
    ns.tprint("Total Cost is " + ns.nFormat(totalCost, "$0.000a" + "."));

    // Main Script
    // Toggle buy flag in Globals to enable actual purchase
    if (buy) {
        // You have to kill all scripts on servers before you can delete or buy new ones
        ns.killall("Darkstar");
        ns.killall("Starlight");
        ns.killall("Starbright");
        ns.killall("Battlestar");
        ns.killall("Blackhole");

        // Remove existing servers
        ns.deleteServer("Darkstar");
        ns.deleteServer("Starlight");
        ns.deleteServer("Starbright");
        ns.deleteServer("Battlestar");
        ns.deleteServer("Blackhole");

        // Buy new servers with required memory
        ns.purchaseServer("Darkstar", memory);
        ns.purchaseServer("Starlight", memory);
        ns.purchaseServer("Starbright", memory);
        ns.purchaseServer("Battlestar", memory);
        ns.purchaseServer("Blackhole", memory);

        // For buying a Server Farm uncomment this below and set the proper number of servers to purchase in the header.
        // This will buy a group of servers with a common name and number, which makes it easier to manage and automate.
        //
        //for (var index = 1; index <= numOfServers; index++) {
        //	serverName = hostNamePrefix + index.toString();
        //	ns.tprint("Buying " + serverName);

        //	ns.killall(serverName);
        //	ns.deleteServer(serverName);
        //	ns.purchaseServer(serverName, memory);
        //}

    }
}