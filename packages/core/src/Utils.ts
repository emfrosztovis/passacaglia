import { Debug } from "common";

/**
 * Standard mathematical modulo (handles negative numbers correctly).
 * e.g., posMod(-1, 7) -> 6
 */
export function modulo(n: number, m: number): number {
    return ((n % m) + m) % m;
}

/**
 * Rotates an array by `n` steps. Positive `n` means left-shift, negative right-shift.
 */
export function rotateArray<T>(list: readonly T[], n: number): T[] {
    if (n == 0) return [...list];
    if (list.length === 0) return [];
    const shift = n % list.length;
    return [...list.slice(shift), ...list.slice(0, shift)];
}

export function randomChoice<T>(list: T[]): T {
    if (list.length === 0) throw new Error('no list');
    return list[Math.floor(Math.random() * list.length)];
}

export function shuffle<T>(list: T[]): T[] {
    const result = [...list];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * @param list Map or Record of items to weights
 */
export function randomWeighted(list: Record<string, number>): string {
    let sum = 0;
    for (const v of Object.values(list)) sum += v;

    const rnd = Math.random() * sum;
    let s2 = 0;
    for (const [k, v] of Object.entries(list)) {
        if (rnd >= s2 && rnd < s2 + v) return k;
        s2 += v;
    }
    Debug.never(rnd as never);
}
