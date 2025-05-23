import * as bitburner from "@ns";

export { };

declare global {
    // const _: typeof _

    interface NS extends bitburner.NS { }

    type AutocompleteConfig = [string, string | number | boolean | string[]][];

    interface AutocompleteData {
        servers: string[],
        txts: string[],
        scripts: string[],
        flags: (config: AutocompleteConfig) => any
    }
}
