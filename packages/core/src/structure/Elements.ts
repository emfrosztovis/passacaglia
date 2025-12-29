import { Rational } from "common";

/**
 * Base for durational and non-durational elements in musical structures.
 */
export interface TemporalElement {}

/**
 * Base for durational elements in musical structures, such as notes and chords (not like a note collection, but like elements in a progression).
 */
export interface DurationalElement extends TemporalElement {
    /**
     * The duration of the element. Must be positive.
     */
    readonly duration: Rational;
}

/**
 * Base for zero-length elements (or "events") in musical structures, used for example in modern music representations.
 */
export interface InstantaneousElement extends TemporalElement {
    // no intrinsic temporal extent
}
