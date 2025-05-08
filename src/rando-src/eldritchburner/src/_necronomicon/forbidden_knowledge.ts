// ANCHOR: Time constants
export const SECOND = 1000
export const MINUTE = 60 * SECOND
export const HOUR = 60 * MINUTE

// ANCHOR: UI Manipulation
export const d = eval(`document`) as Document
export const w = eval(`window`) as Window & typeof globalThis
export const $ = (selector: string): Element | null => d.querySelector(selector)

