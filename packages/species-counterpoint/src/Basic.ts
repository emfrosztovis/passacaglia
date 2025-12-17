import { Rational } from "common";
import { H, Measure, TimedNote, Score, Voice } from "./Common";
import { CounterpointContext } from "./Context";

export abstract class CounterpointMeasure extends Measure {
    constructor(
        voiceIndex: number, index: number,
        protected ctx: CounterpointContext,
    ) {
        super(voiceIndex, index);
    }

    abstract getNextSteps(ctx: CounterpointContext, s: Score): {
        measure: CounterpointMeasure,
        cost: number
    }[];
}

export class BlankMeasure extends CounterpointMeasure {
    readonly notes: TimedNote[];
    readonly writable = true;

    constructor(voiceIndex: number, index: number, ctx: CounterpointContext) {
        super(voiceIndex, index, ctx);
        this.notes = [{
            pitch: null,
            length: Rational.from(ctx.parameters.measureLength),
            position: new Rational(0)
        }];
    }

    getNextSteps(_cxt: CounterpointContext, s: Score) {
        return (s.voices[this.voiceIndex] as CounterpointVoice)
            .makeNewMeasure(s, this.voiceIndex, this.index);
    }

    hash(): string {
        return 'blank';
    }
}

export class FixedMeasure extends Measure {
    readonly writable = false;

    constructor(
        voiceIndex: number, index: number,
        public readonly notes: TimedNote[]
    ) {
        super(voiceIndex, index);
    }

    hash(): string {
        return 'fixed';
    }
}

export class FixedVoice extends Voice {
    constructor(
        index: number,
        public readonly measures: FixedMeasure[],
        public readonly name = 'Cantus'
    ) {
        super(index);
    }

    clone(): this {
        return this;
    }
}

export type VoiceConstructor = new (
    index: number,
    ctx: CounterpointContext,
    measures: CounterpointMeasure[],
    lowerRange: H.Pitch,
    higherRange: H.Pitch,
    name: string
) => CounterpointVoice;

export abstract class CounterpointVoice extends Voice {
    constructor(
        index: number,
        protected readonly ctx: CounterpointContext,
        public readonly measures: CounterpointMeasure[],
        public readonly lowerRange: H.Pitch,
        public readonly higherRange: H.Pitch,
        public readonly name: string
    ) {
        super(index);
    }

    abstract clone(): this;

    abstract makeNewMeasure: (s: Score, iv: number, i: number) => {
        measure: CounterpointMeasure,
        cost: number
    }[];
}

export class CounterpointScoreBuilder {
    #voices: (CounterpointVoice | FixedVoice)[] = [];

    constructor(
        private ctx: CounterpointContext
    ) { }

    build(): Score {
        return new Score(this.ctx.parameters, this.#voices);
    }

    voice(v: VoiceConstructor, name: string, l: H.Pitch, h: H.Pitch): this {
        const vi = this.#voices.length;
        const ms: BlankMeasure[] = [];
        for (let i = 0; i < this.ctx.targetMeasures; i++)
            ms.push(new BlankMeasure(vi, i, this.ctx));

        this.#voices.push(new v(vi, this.ctx, ms, l, h, name));
        return this;
    }

    cantus(measures: TimedNote[][]): this {
        const vi = this.#voices.length;
        const ms = measures.map((x, i) => new FixedMeasure(vi, i, x));
        this.#voices.push(new FixedVoice(vi, ms));
        return this;
    }

    // voice ranges taken from:
    // https://musictheory.pugetsound.edu/mt21c/VoiceRanges.html

    soprano(v: VoiceConstructor) {
        return this.voice(v, 'Soprano', H.Pitch.parse('d4')!, H.Pitch.parse('fs5')!);
    }

    alto(v: VoiceConstructor) {
        return this.voice(v, 'Alto', H.Pitch.parse('g3')!, H.Pitch.parse('cs5')!);
    }

    tenor(v: VoiceConstructor) {
        return this.voice(v, 'Tenor', H.Pitch.parse('ef3')!, H.Pitch.parse('fs4')!);
    }

    bass(v: VoiceConstructor) {
        return this.voice(v, 'Tenor', H.Pitch.parse('e2')!, H.Pitch.parse('c4')!);
    }
}
