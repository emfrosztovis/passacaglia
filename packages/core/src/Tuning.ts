import { Rational } from "common";
import { Pitch } from "./Pitch";
import { PitchSystem } from "./PitchSystem";

export abstract class Tuning<S extends PitchSystem> {
    abstract frequencyOf(p: Pitch<S>): number;

    centBetween(p1: Pitch<S>, p2: Pitch<S>): number {
        return 1200 * Math.log2(this.frequencyOf(p2) / this.frequencyOf(p1));
    }

    ratioBetween(p1: Pitch<S>, p2: Pitch<S>): number {
        return this.frequencyOf(p2) / this.frequencyOf(p1);
    }
}

export class EqualTemperamentTuning<S extends PitchSystem> extends Tuning<S> {
    private readonly referenceOrd: Rational;
    private readonly referenceFreq: number;

    constructor(protected system: S, referenceFreq: number, referencePitch: Pitch<S>) {
        super();
        this.referenceFreq = referenceFreq;
        this.referenceOrd = referencePitch.ord();
    }

    frequencyOf(p: Pitch<S>): number {
        return this.referenceFreq * Math.pow(2,
            p.ord().sub(this.referenceOrd).div(this.system.nPitchClasses).value());
    }
}
