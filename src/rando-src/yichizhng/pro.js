// A formulas HGW shotgun batcher, with lots of features.
// - Automatic server targeting
// - Efficient prep/reprep algorithm
// - Recalculates hacking level to avoid desyncs (though nothing can prevent desyncs
//   from mults changing during a batch e.g. IPvGO or grafting)
// - Calculates HGW threads considering cores, though not to maximum effectiveness

// Not optimized for late BN12; the needed changes are left as an exercise for the reader.
// Uses hacknet servers, and consumes all available ram on home; again, the needed
// changes to avoid that are left as an exercise for the reader.

const BATCH_CAP = 100000;

/** @param {NS} ns */
function getAllServers(ns) {
  return [...(a => (a.forEach(x => ns.scan(x).map(s => a.add(s))), a))(new Set(['.']))];
}

/** @param {NS} ns */
function bnHackingMultiplier(ns) {
  let mults =
    [,  // 0
      1,  // 1
      0.8,  // 2
      0.8,  // 3
      1,  // 4
      1,  // 5
      0.35,  // 6 
      0.35,  // 7
      1,  // 8
      0.5,  // 9
      0.35,  // 10
      0.6,  // 11
      ,  // 12
      0.25,  // 13
      0.4  // 14
    ]
  if (ns.getResetInfo().currentNode == 12) {
    let bn12level = 1 + ns.getResetInfo().ownedSF.get(12) ?? 0;
    return Math.pow(1.02, -bn12level);
  }
  return mults[ns.getResetInfo().currentNode];
}

/** @param {NS} ns */
function pickTarget(ns) {
  if (ns.getHackingLevel() < 200) return 'joesguns';
  let po = ns.getPlayer();

  /*
  // print metrics and exit
  ns.print(getAllServers(ns)
    .map(ns.getServer)
    .filter(s => s.moneyMax && s.hasAdminRights)
    .map(s => {
      if (ns.args[0] === s.hostname) {
        return [s.hostname, Infinity]
      }
      let preppedBonus = s.hackDifficulty == s.minDifficulty ? 1.2 : 1;
      s.hackDifficulty = s.minDifficulty;

      let hp = ns.formulas.hacking.hackPercent(s, po);
      let gp = ns.formulas.hacking.growPercent(s, 1, po, 1);
      let gt = Math.ceil(Math.log(1 - hp) / -Math.log(gp));

      return [s.hostname,
      preppedBonus *
      ns.formulas.hacking.hackChance(s, po) *
      ns.formulas.hacking.hackPercent(s, po) *
      s.moneyMax / 
      ((1+gt) * Math.max(4, ns.formulas.hacking.weakenTime(s, po)))];
    }).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]).join('\n'));
    ns.exit();
    //*/

  return getAllServers(ns)
    .map(ns.getServer)
    .filter(s => s.moneyMax && s.hasAdminRights)
    .map(s => {
      if (ns.args[0] === s.hostname) {
        return [s.hostname, Infinity]
      }
      // Prefer prepped servers to avoid swapping targets too frequently
      let preppedBonus = s.hackDifficulty == s.minDifficulty ? 1.2 : 1;
      s.hackDifficulty = s.minDifficulty;

      // Adjustment for grow power
      let hp = ns.formulas.hacking.hackPercent(s, po);
      let gp = ns.formulas.hacking.growPercent(s, 1, po, 1);
      let gt = Math.ceil(Math.log(1 - hp) / -Math.log(gp));

      return [s.hostname,
      preppedBonus *
      ns.formulas.hacking.hackChance(s, po) *
      ns.formulas.hacking.hackPercent(s, po) *
      s.moneyMax /
      ((1 + gt) * Math.max(4, ns.formulas.hacking.weakenTime(s, po)))];
    })
    .reduce((a, b) => b[1] > a[1] ? b : a)[0];
}

/**
 * @param {NS} ns
 * @param {Player} po
 * @param {string} targetServer
 * @param {[string, number, number][]} ramMap
 * @param {number} batchLimit Limits the number of batches to fit in available ram.
 * @param {number} growCores The number of cores the server running grow has
 * @param {number} weakenCores The number of cores the server running weaken has
 * @return {number[]} H/0/G/W threads for the optimal batch size
 */
function calcHGWThreads(ns, po, targetServer, ramMap, batchLimit = 100000, growCores = 1, weakenCores = 1) {
  let best_tht = 0;
  let best = [0, 0, 0, 0];
  let so = ns.getServer(targetServer);
  let totalRam = ramMap.reduce((a, b) => a + b[1], 0);
  so.hackDifficulty = so.minDifficulty;
  so.moneyAvailable = so.moneyMax;
  let hp = ns.formulas.hacking.hackPercent(so, po);
  for (let ht = 1; ht * hp < 1; ++ht) {
    so.hackDifficulty = so.minDifficulty + 0.002 * ht; // ns.hackAnalyzeSecurity(ht);
    // so.moneyAvailable *= (1 - ht * hp);
    let gp = ns.formulas.hacking.growPercent(so, 1, po, growCores);
    let gt = Math.ceil(Math.log(1 - ht * hp) / -Math.log(gp));
    let wt = Math.ceil((/*ns.hackAnalyzeSecurity(ht) + ns.growthAnalyzeSecurity(gt)*/
      0.002 * ht + 0.004 * gt) / ns.weakenAnalyze(1, weakenCores));
    {
      // Check that it is possible to schedule at least one batch
      let ramMapCopy = ramMap.map(x => [...x])
      if (!(launchHack(ns, targetServer, ht, ramMapCopy) &&
        launchGrow(ns, targetServer, gt, ramMapCopy, growCores) &&
        launchWeaken(ns, targetServer, wt, ramMapCopy, weakenCores))) {
        break;
      }
    }

    // Yes this is not exactly right, deal with it
    let tb = Math.min(totalRam / (1.7 * ht + 1.75 * (gt + wt)), batchLimit);
    let tht = tb * ht;
    if (tht > best_tht) {
      best = [ht, 0, gt, wt];
      best_tht = tht;
    }
    {
      // Try rounding gt down and using fractional hack
      let fgt = gt - 1;
      let fht = (1 - gp ** -fgt) / hp;
      let fwt = Math.ceil((0.002 * Math.ceil(ht) + 0.004 * gt) / ns.weakenAnalyze(1, weakenCores));
      let ftb = Math.min(Math.floor(totalRam / (1.7 * Math.ceil(fht) + 1.75 * (fgt + fwt))), batchLimit);
      let ftht = ftb * fht;
      if (ftht > best_tht) {
        best = [fht, 0, fgt, fwt];
        best_tht = ftht;
      }
    }
    if (wt - best[3] > 2) break;
  }
  {  // but what if we hacked 100%
    let ht = Math.ceil(1 / hp);
    so.hackDifficulty = so.minDifficulty + 0.002 * ht;
    so.moneyAvailable = 0;
    let gt = ns.formulas.hacking.growThreads(so, po, so.moneyMax);
    let wt = Math.ceil((/*ns.hackAnalyzeSecurity(ht) + ns.growthAnalyzeSecurity(gt)*/
      0.002 * ht + 0.004 * gt) / ns.weakenAnalyze(1, weakenCores));
    let tb = Math.min(Math.floor(totalRam / (1.7 * ht + 1.75 * (gt + wt))), batchLimit);
    {
      // Check that it is possible to schedule at least one batch
      let ramMapCopy = ramMap.map(x => [...x])
      if (!(launchHack(ns, targetServer, ht, ramMapCopy) &&
        launchGrow(ns, targetServer, gt, ramMapCopy, growCores) &&
        launchWeaken(ns, targetServer, wt, ramMapCopy, weakenCores))) {
        tb = 0;
      }
    }
    let tht = tb * ht;
    if (tht > best_tht) {
      best_tht = tht;
      best = [ht, 0, gt, wt];
      ns.exit();
    }
  }
  return best;
}

/**
 * @param {NS} ns
 * @returns {[string, number, number][]} A list of servers available
 * to run scripts on, with their free ram and cpu cores, sorted by
 * free ram.
 */
function getRamMap(ns) {
  return getAllServers(ns).map(ns.getServer)
    .filter(x => x.maxRam && x.hasAdminRights && !x.hostname.startsWith('hacknet'))
    .map(x => [x.hostname, x.maxRam - x.ramUsed, x.cpuCores])
    .sort((a, b) => a[1] - b[1]);
}

/**
 * @param {NS} ns
 * @param {string} target The server to target.
 * @param {string} threads The number of threads to launch the job with.
 * @param {[string, number, number][]} ramMap
 * @param {number[]} [pids] Array to append the pid to or undefined; if undefined, runs in dry mode.
 * @returns {boolean} Whether the hack was successfully launched, or
 * scheduled if in dry mode.
 */
function launchHack(ns, target, threads, ramMap, pids) {
  let script = 'hack-once.js'
  // Prefer uncored ram for hack
  let hsc = ramMap.filter(x => x[1] >= Math.ceil(threads) * 1.7);
  if (hsc.length == 0) return false;
  let hs = hsc.reduce((a, b) => b[2] > a[2] ? a : b);
  if (!hs) return false;
  hs[1] -= 1.7 * Math.ceil(threads);
  if (!pids) return true;
  let pid = ns.exec(script, hs[0], { threads: Math.ceil(threads), temporary: true }, target, ns.getWeakenTime(target) - ns.getHackTime(target), threads);
  if (pid) {
    pids.push(pid);
    return true;
  }
  return false;
}

/**
 * @param {NS} ns
 * @param {string} target The server to target.
 * @param {string} threads The number of threads to launch the job with.
 * @param {[string, number, number][]} ramMap
 * @param {number[]} [pids] Array to append the pid to or undefined; if undefined, runs in dry mode.
 * @returns {boolean} Whether the hack was successfully launched, or
 * scheduled if in dry mode.
 */
function launchGrow(ns, target, threads, ramMap, minCores, pids) {
  let hsc = ramMap.filter(x => x[1] >= Math.ceil(threads) * 1.75 && x[2] >= minCores);
  if (hsc.length == 0) return false;
  let hs = hsc.reduce((a, b) => b[2] > a[2] ? a : b);
  if (!hs) return false;
  hs[1] -= 1.75 * threads;
  if (!pids) { return true; }
  let pid = ns.exec(script, hs[0], { threads, temporary: true }, target, ns.getWeakenTime(target) - ns.getGrowTime(target), threads);
  if (pid) {
    pids.push(pid);
    return true;
  }
  return false;
}

/**
 * @param {NS} ns
 * @param {string} target The server to target.
 * @param {string} threads The number of weaken threads to launch (NOT adjusted for cores)
 * @param {[string, number, number][]} ramMap
 * @param {number} minCores The minimum number of cores to run on
 * @param {number[]} [pids] Array to append the pid to or undefined; if undefined, runs in dry mode.
 * @returns {boolean} Whether the weaken was (all) successfully launched, or
 * scheduled if in dry mode. It is possible that only a partial weaken was launched.
 */
function launchWeaken(ns, target, threads, ramMap, minCores, pids) {
  while (threads > 0) {
    // Prefer uncored ram for weaken
    let wsc = ramMap.filter(x => x[1] >= 1.75 && x[2] >= minCores);
    if (wsc.length == 0) return false;
    let ws = wsc.reduce((a, b) => a[2] > b[2] ? b : a);
    if (!ws) return false;
    let at = Math.min(Math.ceil(threads), Math.floor(ws[1] / 1.75));
    if (pids) {
      let pid = ns.exec('weaken-once.js', ws[0], { threads: at, temporary: true }, target);
      if (pid) {
        pids.push(pid);
      } else {
        return false;
      }
    }
    ws[1] -= 1.75 * at;
    threads -= at;
  }
  return threads <= 0;
}

/**
 * Launches a WGW batch (or as much of it as possible) to prep the server.
 * @param {NS} ns
 * @param {string} target The target server
 * @param {[string, number, number][]} ramMap
 * @returns {boolean} Whether the server will be fully prepped after the scheduled jobs land.
 */
function prepBatch(ns, target, ramMap) {
  let server = ns.getServer(target);
  let w1t = Math.ceil((server.hackDifficulty - server.minDifficulty) / ns.weakenAnalyze(1));
  if (w1t) {
    ns.print(`${w1t} weaken threads needed for min security`);
    if (!launchWeaken(ns, target, w1t, ramMap, 1, [])) {
      return false;
    }
  }
  if (server.moneyAvailable >= server.moneyMax) return true;

  server.hackDifficulty = server.minDifficulty;
  let gt = ns.formulas.hacking.growThreads(server, ns.getPlayer(), server.moneyMax);
  let ogt = gt;
  ns.print(`${gt} grow threads needed for max money`);

  let secIncrease = 0;
  while (gt > 0) {
    let availableThreads = ramMap.reduce((a, b) => a + Math.floor(b[1] / 1.75), 0);
    availableThreads -= Math.floor(secIncrease / ns.weakenAnalyze(1));
    let agt = Math.min(Math.ceil(gt),
      Math.floor(availableThreads * ns.weakenAnalyze(1) / (0.004 + ns.weakenAnalyze(1))));
    if (agt < 1) break;
    // Find the biggest server with most cores
    let gs = ramMap.filter(x => x[1] >= 1.75).reduce((a, b) => {
      if (a[2] > b[2]) return a;
      if (b[2] > a[2]) return b;
      return a[1] > b[1] ? a : b;
    });
    if (!gs) break;
    agt = Math.min(Math.ceil(agt / ((15 + gs[2]) / 16)), Math.floor(gs[1] / 1.75));
    let pid = ns.exec('grow-once.js', gs[0], { threads: agt, temporary: true }, target, ns.getWeakenTime(target) - ns.getGrowTime(target));
    if (!pid) {
      ns.print('WARNING: Failed to launch grow threads; is another script using ram?');
      return false;
    }
    gs[1] -= agt * 1.75;
    gt -= agt * ((15 + gs[2]) / 16);
    secIncrease += 0.004 * agt;

    // Allowing split grows is more efficient for small servers than launching a separate
    // weaken for each grow
    let wt = Math.floor((secIncrease) / ns.weakenAnalyze(1));
    if (!launchWeaken(ns, target, wt, ramMap, 1, [])) {
      ns.print(`WARNING: Failed to launch ${wt} weaken threads`);
      return false;
    }
    secIncrease -= ns.weakenAnalyze(wt);
  }
  if (secIncrease > 0) {
    let wt = Math.ceil((secIncrease) / ns.weakenAnalyze(1));
    if (!launchWeaken(ns, target, wt, ramMap, 1, [])) {
      ns.print(`WARNING: Failed to launch ${wt} weaken threads`);
      return false;
    }
  }
  ns.print(`Launched ${ogt - gt} grow threads`);
  return gt <= 0;
}

/**
 * Preps the target server.
 * @param {NS} ns
 * @returns {Promise<Player>} A player object updated with expected hacking xp and level after
 * any remaining jobs land
 */
async function prep(ns, target) {
  let bnhackingmult = bnHackingMultiplier(ns);
  let server = ns.getServer(target);
  while (server.hackDifficulty > server.minDifficulty ||
    server.moneyAvailable < server.moneyMax) {
    ns.print(`Prepping ${target}`);
    ns.print(`Security: ${server.hackDifficulty} / ${server.minDifficulty}`);
    ns.print(`Money: ${server.moneyAvailable} / ${server.moneyMax}`);
    let po = ns.getPlayer();
    let ramMap = getRamMap(ns);
    let availableThreads = ramMap.reduce((a, b) => a + Math.floor(b[1] / 1.75), 0);
    if (prepBatch(ns, target, ramMap)) {
      let threadsLeft = ramMap.reduce((a, b) => a + Math.floor(b[1] / 1.75), 0);
      po.exp.hacking += ns.formulas.hacking.hackExp(server, po) * (availableThreads - threadsLeft);
      po.skills.hacking = ns.formulas.skills.calculateSkill(po.exp.hacking, po.mults.hacking * bnhackingmult);
      return po;
    }
    await 0; await 0; await ns.asleep(ns.getWeakenTime(target));
    server = ns.getServer(target);
  }
  return ns.getPlayer();
}

/** @param {NS} ns */
export async function main(ns) {
  ns.disableLog('ALL');
  ns.write('hack-once.js',
    'export let main = (n,a=n.args) => (n.disableLog("ALL"), (a[0] && n.hack(a[0], {additionalMsec: a[1], threads: a[2]})))', 'w');
  ns.write('grow-once.js',
    'export let main = (n,a=n.args) => (n.disableLog("ALL"), (a[0] && n.grow(a[0], {additionalMsec: a[1]})))', 'w');
  ns.write('weaken-once.js',
    'export let main = (n,a=n.args[0]) => (n.disableLog("ALL"), (a && n.weaken(a)))', 'w');
  const scripts = ['hack-once.js', 'hack-half.js', 'grow-once.js', 'weaken-once.js']
  // Force module compilation
  let pids = [ns.exec(scripts[0],ns.hostname),
              ns.exec(scripts[1],ns.hostname),
              ns.exec(scripts[2],ns.hostname),
              ns.exec(scripts[3],ns.hostname)];
  for (let pid of pids) {
    while (ns.isRunning(pid)) await ns.sleep(0);
  }

  // Main loop
  while (true) {
    let allServers = [...(a => (a.forEach(x => ns.scan(x).map(s => a.add(s))), a))(new Set(['.']))];
    allServers.forEach(x => ns.scp(scripts, x));

    let target = pickTarget(ns);
    if (!target) {
      ns.print('ERROR: Failed to pick target (did you forget to nuke servers?)');
      ns.tprint('ERROR: Failed to pick target (did you forget to nuke servers?)');
      ns.exit();
    }
    let po = await prep(ns, target);
    let server = ns.getServer(target);

    ns.print(`Batching ${target}`);
    let ramMap = getRamMap(ns);
    let maxCores = Math.max(...ramMap.map(s => s[2]));
    let minCores = Math.min(...ramMap.map(s => s[2]));

    let [ht, _, gt, wt] = calcHGWThreads(ns, po, target, ramMap, BATCH_CAP, maxCores, minCores);
    while (ht == 0) {
      if (maxCores == minCores) break;
      maxCores = Math.max(...ramMap.map(s => s[2]).filter(x => x < maxCores));
      [ht, _, gt, wt] = calcHGWThreads(ns, po, target, ramMap, BATCH_CAP, maxCores, minCores);
    }
    if (ht == 0) {
      ns.print('Could not schedule any batches')
      await 0; await 0;
      await ns.asleep(ns.getWeakenTime(target));
      continue;
    }
    let bnhackingmult = bnHackingMultiplier(ns);
    let so = ns.getServer(target);
    so.hackDifficulty = so.minDifficulty;
    let xp_per_batch = (gt + wt + ht * ns.formulas.hacking.hackChance(so, po))
      * ns.formulas.hacking.hackExp(so, po)
      + (ht * (1 - ns.formulas.hacking.hackChance(so, po)) * ns.formulas.hacking.hackExp(so, po) / 4);
    let money_per_batch = so.moneyMax * ht * ns.formulas.hacking.hackPercent(so, po)
      * ns.formulas.hacking.hackChance(so, po);
    let expected_profit = 0;

    let batches_launched = 0;
    let w = ns.asleep(0);
    let cycleTime = ns.getWeakenTime(target);
    let cycleStartTime = Date.now();
    schedule_loop: while (batches_launched < BATCH_CAP) {
      let b = 0;
      let growServers = ramMap.filter(s => s[2] == maxCores);
      if (growServers.length == 0 && maxCores == minCores) {
        break;
      }
      for (let growServer of growServers) {
        while (growServer[1] >= 1.75 * gt) {
          let pids = [];
          let fail = false;
          if (!launchHack(ns, target, ht, ramMap, pids)) {
            fail = true;
          }
          let gpid = ns.exec('grow-once.js', growServer[0], { threads: gt, temporary: true }, target, ns.getWeakenTime(target) - ns.getGrowTime(target));
          if (!gpid) {
            fail = true;
          }
          pids.push(gpid);
          growServer[1] -= 1.75 * gt;
          if (!launchWeaken(ns, target, wt, ramMap, minCores, pids)) {
            fail = true;
          }
          if (fail) {
            pids.map(ns.kill);
            ns.kill(gpid);
            // ns.print(`Launched ${b} HGW batches with ${ht}/${gt}/${wt} threads`);
            // Recalc and continue scheduling
            {
              [ht, _, gt, wt] = calcHGWThreads(ns, po, target, ramMap, BATCH_CAP - batches_launched, maxCores, minCores);
              if (ht == 0) break schedule_loop;
              xp_per_batch = (gt + wt + ht * ns.formulas.hacking.hackChance(so, po))
                * ns.formulas.hacking.hackExp(so, po)
                + (ht * (1 - ns.formulas.hacking.hackChance(so, po)) * ns.formulas.hacking.hackExp(so, po) / 4);
              money_per_batch = so.moneyMax * ht * ns.formulas.hacking.hackPercent(so, po)
                * ns.formulas.hacking.hackChance(so, po)
            }
            continue schedule_loop;
          } else {
            expected_profit += money_per_batch;

            b++;
            batches_launched++;
          }
          if (batches_launched % 1000 == 0) {
            await w;
            w = ns.asleep(0);
            if (ns.getWeakenTime(target) != cycleTime) {
              // > could work, but then you need additionalMsec on weaken
              ns.print('stopped scheduling due to desync')
              break schedule_loop;
            }
          }
          po.exp.hacking += xp_per_batch;
          let recalc = false;
          if (ns.formulas.skills.calculateSkill(po.exp.hacking,
            po.mults.hacking * bnhackingmult) != po.skills.hacking) {
            po.skills.hacking = ns.formulas.skills.calculateSkill(po.exp.hacking, po.mults.hacking * bnhackingmult);
            // Only recalculate batch size if it would desync; this is theoretically not optimal, but who cares?
            let nhp = ns.formulas.hacking.hackPercent(so, po);
            so.hackDifficulty = so.minDifficulty + 0.002 * ht;
            let ngp = ns.formulas.hacking.growPercent(so, 1, po, maxCores);
            let ngt = Math.log(1 - ht * nhp) / -Math.log(ngp);
            if ((ngt > gt) || (nhp >= 1)) {
              ns.print(`Predicted desync after ${batches_launched} batches; recalculating batch size`);
              recalc = true;
            } else {
              // Update xp_per_batch anyway in case hackChance changed
              xp_per_batch = (gt + wt + ht * ns.formulas.hacking.hackChance(so, po))
                * ns.formulas.hacking.hackExp(so, po)
                + (ht * (1 - ns.formulas.hacking.hackChance(so, po)) * ns.formulas.hacking.hackExp(so, po) / 4);
              money_per_batch = so.moneyMax * ht * ns.formulas.hacking.hackPercent(so, po)
                * ns.formulas.hacking.hackChance(so, po);
            }
            so.hackDifficulty = so.minDifficulty;
          }
          if (batches_launched >= BATCH_CAP) {
            // ns.print(`Launched ${b} HGW batches with ${ht}/${gt}/${wt} threads`);
            ns.print(`Stopping due to script limit`);
            break schedule_loop;
          }
          // Check whether any servers have run out of ram; if so, also recalculate min and max cores; and if either
          // of those changed, trigger a recalc
          if (ramMap.some(s => s[1] < 1.75)) {
            ramMap = ramMap.filter(s => s[1] >= 1.75);
            if (ramMap.length == 0) break;
            recalc = true;
          }
          if (recalc) {
            // ns.print(`Launched ${b} HGW batches with ${ht}/${gt}/${wt} threads`);
            maxCores = Math.max(...ramMap.map(s => s[2]));
            minCores = Math.min(...ramMap.map(s => s[2]));
            [ht, _, gt, wt] = calcHGWThreads(ns, po, target, ramMap, BATCH_CAP - batches_launched, maxCores, minCores);
            while (ht == 0) {
              if (maxCores == minCores) break;
              maxCores = Math.max(...ramMap.map(s => s[2]).filter(x => x < maxCores));
              [ht, _, gt, wt] = calcHGWThreads(ns, po, target, ramMap, BATCH_CAP, maxCores, minCores);
            }
            if (ht == 0) break schedule_loop;
            xp_per_batch = (gt + wt + ht * ns.formulas.hacking.hackChance(so, po))
              * ns.formulas.hacking.hackExp(so, po)
              + (ht * (1 - ns.formulas.hacking.hackChance(so, po)) * ns.formulas.hacking.hackExp(so, po) / 4);
            money_per_batch = so.moneyMax * ht * ns.formulas.hacking.hackPercent(so, po)
              * ns.formulas.hacking.hackChance(so, po)
            continue schedule_loop;
          }
        }
      }
      if (b == 0 && maxCores == minCores) {
        ns.print(`Batch launching stalled with batch size ${[ht, gt, wt]}`);
        let totalRam = ramMap.reduce((a, b) => a + b[1], 0);
        ns.print(`Ram remaining: ${totalRam}`)
        break;
      }
      // ns.print(`Launched ${b} HGW batches with ${ht}/${gt}/${wt} threads`);
      ramMap = ramMap.filter(s => s[1] >= 1.75);
      if (ramMap.length == 0) break;
      maxCores = Math.max(...ramMap.map(s => s[2]));
      minCores = Math.min(...ramMap.map(s => s[2]));
      [ht, _, gt, wt] = calcHGWThreads(ns, po, target, ramMap, BATCH_CAP - batches_launched, maxCores, minCores);
      while (ht == 0) {
        if (maxCores == minCores) break;
        maxCores = Math.max(...ramMap.map(s => s[2]).filter(x => x < maxCores));
        [ht, _, gt, wt] = calcHGWThreads(ns, po, target, ramMap, BATCH_CAP, maxCores, minCores);
      }
      if (ht == 0) break;
      xp_per_batch = (gt + wt + ht * ns.formulas.hacking.hackChance(so, po))
        * ns.formulas.hacking.hackExp(so, po)
        + (ht * (1 - ns.formulas.hacking.hackChance(so, po)) * ns.formulas.hacking.hackExp(so, po) / 4);
    }
    ns.print(`Expected profit: \$${ns.formatNumber(expected_profit)}`);
    let sm = ns.getRunningScript().onlineMoneyMade;
    await w; await ns.asleep(ns.getWeakenTime(target));
    let em = ns.getRunningScript().onlineMoneyMade;
    let cycleEndTime = Date.now();
    ns.print(`Actual profit: \$${ns.formatNumber(em - sm)}`);
    ns.print(`Money rate: \$${ns.formatNumber(1000 * (em - sm) / (cycleEndTime - cycleStartTime))}/s`);
    server = ns.getServer(target);
    if (server.hackDifficulty > server.minDifficulty) {
      ns.print(`ERROR: Server above min diff ${server.hackDifficulty} / ${server.minDifficulty}`);
      ns.tprint('ERROR: Server above min diff');
    }
    if (server.moneyAvailable < server.moneyMax) {
      ns.print(`WARNING: Desync detected; money left ${server.moneyAvailable}/${server.moneyMax}`);
      ns.tprint(`WARNING: Desync detected; money left ${server.moneyAvailable}/${server.moneyMax}`);
    }
    po = ns.getPlayer();
  }
} 
