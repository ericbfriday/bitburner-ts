import type { NS } from "../NetscriptDefinitions";

declare const webpackChunkbitburner: any;
declare const webpack_require: any;

/** @param {NS} ns */
export async function main(ns: NS) {
    globalThis.webpack_require ?? webpackChunkbitburner.push([[-1], {}, w => globalThis.webpack_require = w]);
    Object.keys(webpack_require.m).forEach(k =>
        Object.values(webpack_require(k)).forEach(p => {
            if (typeof p === 'object' && p !== null && 'toPage' in p && typeof p.toPage === 'function') {
                p.toPage('Dev');
            }
        })
    );
}