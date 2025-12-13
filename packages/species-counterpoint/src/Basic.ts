import { Rational } from "common";
import { H, Measure, Note, Score, Voice } from "./Common";
import { CounterpointContext } from "./Context";

export abstract class CounterpointMeasure extends Measure {
    constructor(
        voiceIndex: number, index: number,
        protected ctx: CounterpointContext,
    ) {
        super(voiceIndex, index);
    }

    abstract getNextSteps(cxt: CounterpointContext, s: Score): {
        measure: CounterpointMeasure,
        cost: number,
        heuristic?: number
    }[];
}

export class BlankMeasure extends CounterpointMeasure {
    readonly notes: Note[];
    readonly writable = true;

    constructor(voiceIndex: number, index: number, ctx: CounterpointContext) {
        super(voiceIndex, index, ctx);
        this.notes = [{
            pitch: null,
            length: Rational.from(ctx.parameters.measureLength),
            position: new Rational(0)
        }];
    }

    getNextSteps(cxt: CounterpointContext, s: Score) {
        return cxt.makeNewMeasure(s, this.voiceIndex, this.index);
    }

    hash(): string {
        return 'blank';
    }
}

export class FixedMeasure extends Measure {
    readonly writable = false;

    constructor(
        voiceIndex: number, index: number,
        public readonly notes: Note[]
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

export class CounterpointVoice extends Voice {
    constructor(
        index: number,
        public readonly measures: CounterpointMeasure[],
        public readonly lowerRange: H.Pitch,
        public readonly higherRange: H.Pitch,
        public readonly name = 'Cantus'
    ) {
        super(index);
    }

    clone(): this {
        return new CounterpointVoice(
            this.index, [...this.measures], this.lowerRange, this.higherRange, this.name) as this;
    }
}

export class CounterpointScoreBuilder {
    #voices: (CounterpointVoice | FixedVoice)[] = [];

    constructor(
        private ctx: CounterpointContext
    ) { }

    build(): Score {
        return new Score(this.ctx.parameters, this.#voices);
    }

    voice(name: string, l: H.Pitch, h: H.Pitch): this {
        const vi = this.#voices.length;
        const ms: BlankMeasure[] = [];
        for (let i = 0; i < this.ctx.targetMeasures; i++)
            ms.push(new BlankMeasure(vi, i, this.ctx));

        this.#voices.push(new CounterpointVoice(vi, ms, l, h, name));
        return this;
    }

    cantus(measures: Note[][]): this {
        const vi = this.#voices.length;
        const ms = measures.map((x, i) => new FixedMeasure(vi, i, x));
        this.#voices.push(new FixedVoice(vi, ms));
        return this;
    }

    // voice ranges taken from:
    // https://musictheory.pugetsound.edu/mt21c/VoiceRanges.html

    soprano() {
        return this.voice('Soprano', H.Pitch.parse('d4')!, H.Pitch.parse('fs5')!);
    }

    alto() {
        return this.voice('Alto', H.Pitch.parse('g3')!, H.Pitch.parse('cs5')!);
    }

    tenor() {
        return this.voice('Tenor', H.Pitch.parse('ef3')!, H.Pitch.parse('fs4')!);
    }

    bass() {
        return this.voice('Tenor', H.Pitch.parse('e2')!, H.Pitch.parse('c4')!);
    }
}
