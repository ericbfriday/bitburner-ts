import { NS } from '@ns';
import { WorkRef } from './chamberlain';
import { MINUTE, SECOND } from './forbidden_knowledge';

/**
 * Formatting Helper
 */
export abstract class fmt {
    /**
     * Format a number to k,M,G... notation.
     *
     * @param {number} n
     * @param {number} precision (default: 2)
     * @returns {string} formated number
     */
    public static bigNum(n: number, precision = 2): string {
        if (n < 1e3) return n.toFixed(precision)

        if (n < 1e06) return `${(n / 1e03).toFixed(precision)}k`
        if (n < 1e09) return `${(n / 1e06).toFixed(precision)}M`
        if (n < 1e12) return `${(n / 1e09).toFixed(precision)}G`
        if (n < 1e15) return `${(n / 1e12).toFixed(precision)}T`
        if (n < 1e18) return `${(n / 1e15).toFixed(precision)}P`
        if (n < 1e21) return `${(n / 1e18).toFixed(precision)}E`
        if (n < 1e24) return `${(n / 1e21).toFixed(precision)}Z`
        if (n < 1e27) return `${(n / 1e24).toFixed(precision)}Y`

        return n.toExponential(precision).replace("e+", "e")
    }

    public static primitives = ["string", "number", "bigint", "boolean"]

    /**
     * Format as a compact JSON
     */
    public static compactJSON(obj: unknown): string {
        return JSON.stringify(obj, null, "")
    }

    /**
     * Format as a human readatble JSON
     */
    public static prettyJSON(obj: unknown): string {
        return JSON.stringify(obj, null, 4)
    }
}

export enum WhispererLevel {
    TRACE = -1,
    DEBUG = 0,
    INFO = 1,
    WARNING = 2,
    ERROR = 3,
    CRITICAL = 4,
    FATAL = 5
}


const SILENT_FUNCTIONS_LEVEL: Map<string, WhispererLevel> = new Map([
    // MUST BE THE FIRST
    ["disableLog", WhispererLevel.TRACE],
    // Level.TRACE
    ["sleep", WhispererLevel.TRACE],
    ["scan", WhispererLevel.TRACE],
    ["getServerUsedRam", WhispererLevel.TRACE],
    ["getServerMaxRam", WhispererLevel.TRACE],
    // Level.DEBUG
    ["getHackingLevel", WhispererLevel.DEBUG],
    ["getServerRequiredHackingLevel", WhispererLevel.DEBUG],
    ["getServerMaxMoney", WhispererLevel.DEBUG],
    ["getServerMinSecurityLevel", WhispererLevel.DEBUG],
    ["getServerSecurityLevel", WhispererLevel.DEBUG],
    ["getServerMoneyAvailable", WhispererLevel.DEBUG],
    // Level.ERROR => No NS logs
    ["ALL", WhispererLevel.ERROR],
])

/**
 * The whisperer will keep you informed at your prefered
 * information level.
 */
export class Whisperer {

    /**
     * Whisper Level from verbosity flags
     *
     * @param {boolean} verbose
     * @param {boolean} quiet
     * @returns {WhispererLevel} corresponding level
     */
    public static FromVerbosity(verbose: boolean, quiet = false): WhispererLevel {
        return verbose ? WhispererLevel.DEBUG : (!quiet ? WhispererLevel.INFO : WhispererLevel.WARNING)
    }

    constructor(private ns: NS, private level: WhispererLevel = WhispererLevel.INFO) {
        this.startTimestamp = performance.now()

        this.debug("Silencing the voices")
        SILENT_FUNCTIONS_LEVEL.forEach((level, f) => {
            if (level <= this.level) ns.disableLog(f)
        })
    }

    private readonly startTimestamp: number
    private get timestamp(): string {
        const dt = performance.now() - this.startTimestamp
        const ms = dt % MINUTE, m = (dt - ms) / MINUTE
        return this.ns.sprintf("%04u:%02.3f", m, ms / SECOND)
    }

    /**
     * Get currently running service
     *
     * @remarks RAM cost: 0kB
     */
    private get serviceId(): string {
        return WorkRef.FromPath(this.ns.getScriptName()).id
    }

    /**
     * Create a toast notification with the given message
     *
     * @note Toasts are always shown even if the log level is supperior to the toast variant
    *
     * @remarks RAM cost: 0kB
     * @param msg msg of the toast
     * @param variant style of the toast
     * @param args values used for sprintf in the msg
     */
    public toast(msg: string, variant: "success" | "info" | "warning" | "error" = "info", ...args: unknown[]): void {
        this.log(variant === "success" ||
            variant === "info" ? WhispererLevel.INFO :
            variant === "error" ? WhispererLevel.ERROR :
                WhispererLevel.WARNING, msg, ...args)

        const fmsg = this.ns.sprintf(msg, ...args)
        this.ns.toast(`${fmsg} << [[ ${this.serviceId.toUpperCase()} ]]`, variant, 3000)
    }

    /**
     * Prints a formatted string to the script’s logs.
     *
     * @remarks RAM cost: 0kB
     * @param level - level of the log to emit
     * @param format - format of the message see: https://github.com/alexei/sprintf.js
     * @param args - Value(s) to be printed
     */
    private log(level: WhispererLevel, format: string, ...args: unknown[]): void {
        if (level < this.level) return
        this.ns.printf(
            `[${WhispererLevel[level].toUpperCase()} ${this.serviceId}@${this.timestamp}] ${format}`,
            ...args.map(v => fmt.primitives.indexOf(typeof v) != -1 ? v : fmt.compactJSON(v))
        )
    }

    /**
     * Prints a formatted string to the script’s logs at TRACE level
     *
     * @remarks RAM cost: 0kB
     * @param format - format of the message see: https://github.com/alexei/sprintf.js
     * @param args - Value(s) to be printed
     */
    trace(format: string, ...args: unknown[]): void {
        return this.log(WhispererLevel.TRACE, format, ...args)
    }

    /**
     * Prints a formatted string to the script’s logs at DEBUG level
     *
     * @remarks RAM cost: 0kB
     * @param format - format of the message see: https://github.com/alexei/sprintf.js
     * @param args - Value(s) to be printed
     */
    debug(format: string, ...args: unknown[]): void {
        return this.log(WhispererLevel.DEBUG, format, ...args)
    }

    /**
     * Prints a formatted string to the script’s logs at INFO level
     *
     * @remarks RAM cost: 0kB
     * @param format - format of the message see: https://github.com/alexei/sprintf.js
     * @param args - Value(s) to be printed
     */
    info(format: string, ...args: unknown[]): void {
        return this.log(WhispererLevel.INFO, format, ...args)
    }

    /**
     * Prints a formatted string to the script’s logs at WARN level
     *
     * @remarks RAM cost: 0kB
     * @param format - format of the message see: https://github.com/alexei/sprintf.js
     * @param args - Value(s) to be printed
     */
    warn(format: string, ...args: unknown[]): void {
        return this.log(WhispererLevel.WARNING, format, ...args)
    }

    /**
     * Prints a formatted string to the script’s logs at ERROR level
     *
     * @remarks RAM cost: 0kB
     * @param format - format of the message see: https://github.com/alexei/sprintf.js
     * @param args - Value(s) to be printed
     */
    error(format: string, ...args: unknown[]): void {
        return this.log(WhispererLevel.ERROR, format, ...args)
    }

    /**
     * Prints a formatted string to the script’s logs at CRITICAL level
     *
     * @remarks RAM cost: 0kB
     * @param format - format of the message see: https://github.com/alexei/sprintf.js
     * @param args - Value(s) to be printed
     */
    critical(format: string, ...args: unknown[]): void {
        return this.log(WhispererLevel.CRITICAL, format, ...args)
    }

    /**
     * Prints a formatted string to the script’s logs at FATAL level
     *
     * @remarks RAM cost: 0kB
     * @param format - format of the message see: https://github.com/alexei/sprintf.js
     * @param args - Value(s) to be printed
     */
    fatal(format: string, ...args: unknown[]): void {
        return this.log(WhispererLevel.FATAL, format, ...args)
    }
}