const WORKTYPE_SHORTHANDS = {
    "~": "_ceremonies",
    "!": "_corruptions",
    "@": "_necronomicon"
}

/**
 * Reference to a work order
 *
 * @remarks RAM cost: 0kB
 */
export class WorkRef {

    /**
     * Reference to a work order from a script path
     *
     * @remarks RAM cost: 0kB
     * @returns {WorkRef} the corresponding reference
     */
    static FromPath(path: string): WorkRef {
        if (!path.startsWith("/")) path = "/" + path
        if (!path.endsWith(".js")) path += ".js"

        // Path to: a /_..../... script
        if (path.match(/^[/]?_[a-z]/)) {
            const workType = path.split("/")[1]
            const shorthand = _.invert(WORKTYPE_SHORTHANDS)[workType] ?? `?${workType.substring(1)}/`
            const id = shorthand + path.split("/").slice(2).join(":").split(".js")[0]

            return new WorkRef(id, path)
        }

        // Path to: a root directory script
        if (path.match(/^[/]?[a-z.]+$/)) {
            const id = path.substring(1).split(".js")[0]
            const hostname = "home"

            return new WorkRef(id, path, hostname)
        }

        // Error
        throw new TypeError(`WorkRef: '${path}' does not match a work path.`)
    }


    // The reference MUST be constant, so we shadow the property behind getters
    private _ref: { path: string, id: string, hostname?: string }
    private constructor(id: string, path: string, hostname?: string) {
        this._ref = { id, path, hostname }
    }

    public get id(): string { return this._ref.id }
    public get path(): string { return this._ref.path }
    public get hostname(): string | undefined { return this._ref.hostname }
}
