import { Rational } from "common";
import { Voice } from "./Voice";
import { HarmonyBackground } from "./Chord";

export type Parameters = {
    measureLength: Rational;
};

export class Score {
    constructor(
        public readonly parameters: Parameters,
        public readonly voices: readonly Voice[],
        public readonly harmony: HarmonyBackground
    ) {}

    hash(): string {
        return this.voices.map((x) => x.hash()).join('|');
    }

    toString() {
        return this.voices.map((x) => x.toString()).join('\n');
    }

    replaceHarmony(h: HarmonyBackground) {
        return new Score(this.parameters, this.voices, h);
    }

    replaceVoice(i: number, v: Voice) {
        const vs = [...this.voices];
        vs.splice(i, 1, v);
        return new Score(this.parameters, vs, this.harmony);
    }

    clone() {
        return new Score(this.parameters, this.voices, this.harmony);
    }
}
