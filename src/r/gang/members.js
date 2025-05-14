/** @param {NS} ns */
export async function main(ns) {
	try {
		UpdateMembers(ns);
	}
	catch {
		ns.write('/r/gang/members.txt', JSON.stringify([]), 'w');
	}
}

export function GetMembers(ns) {
	return JSON.parse(ns.read('/r/gang/members.txt'));
}

export function UpdateMembers(ns) {
	const output = [];
	const members = ns.gang.getMemberNames();
	for (let member of members) output.push(ns.gang.getMemberInformation(member));
	ns.write('/r/gang/members.txt', JSON.stringify(output), 'w');
}