import { Rational } from "common";
import { ET12System } from "../ET12/System";

/**
 * The standard, common-practice heptatonic pitch system.
 * ```
 *  C     D     E  F     G     A     B
 *  0  1  2  3  4  5  6  7  8  9 10 11
 * ```
 */
export const _System = new class StandardHeptatonicSystem extends ET12System {
    readonly nDegrees = 7;
    readonly degreeOffsets = Rational.array([0, 2, 4, 5, 7, 9, 11]);
}();

export type StandardHeptatonicSystem = typeof _System;
