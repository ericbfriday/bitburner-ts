import { NS } from "@ns";

export interface Conditioning<T> {
    title?: string | ((ns: NS, ctx: T) => Promise<string>)
    description?: string | ((ns: NS, ctx: T) => Promise<string>)

    eval(ns: NS, ctx: T): Promise<boolean | undefined>
}

export const Conditionings = {
    Chain: <T>(...conditionings: Conditioning<T>[]) => ({
        eval: async (ns: NS, ctx: T) => {
            for (const c of conditionings) {
                const result = await c.eval(ns, ctx)
                if (result !== undefined) return result
            }

            return undefined
        }
    }),

}