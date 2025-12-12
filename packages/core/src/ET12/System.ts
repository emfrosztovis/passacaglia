import { Rational } from "common";
import { PitchSystem } from "../PitchSystem";

/**
 * Base class for all 12-TET pitch systems with the octave as period.
 */
export abstract class ET12System extends PitchSystem {
    readonly periodRatio = new Rational(2);
    readonly nPitchClasses = 12;
};
