import { Rational } from "common";
import { H, Measure, Note, Score, Voice } from "./Common";
import { CounterpointContext } from "./Context";
import { Cursor, SequentialCursor } from "core";

export type CounterpointMeasureCursor = SequentialCursor<CounterpointMeasure, CounterpointVoice, never>;
// @ts-expect-error typechecker bug?
export type CounterpointNoteCursor = SequentialCursor<Note, CounterpointMeasure, CounterpointMeasureCursor>;

export abstract class CounterpointMeasure extends Measure {
    constructor(
        notes: Note[],
        protected ctx: CounterpointContext,
    ) {
        super(notes, ctx.parameters.measureLength);
    }

    atWithParent(i: number, c: CounterpointMeasureCursor): CounterpointNoteCursor {
        // @ts-expect-error
        return this.at(i)!.withParent(c);
    }

    abstract getNextSteps(s: Score, c: CounterpointMeasureCursor): {
        measure: CounterpointMeasure,
        cost: number
    }[];
}

export class BlankMeasure extends CounterpointMeasure {
    readonly writable = true;

    constructor(ctx: CounterpointContext) {
        super([new Note(ctx.parameters.measureLength, undefined)], ctx);
    }

    getNextSteps(s: Score, c: CounterpointMeasureCursor) {
        return c.container.makeNewMeasure(s);
    }

    hash(): string {
        return 'blank';
    }
}

export class FixedMeasure extends Measure {
    readonly writable = false;

    constructor(
        notes: Note[],
        protected ctx: CounterpointContext,
    ) {
        super(notes, ctx.parameters.measureLength);
    }

    hash(): string {
        return 'fixed';
    }
}

export class FixedVoice extends Voice {
    constructor(
        i: number,
        public readonly measures: FixedMeasure[],
        public readonly name = 'Cantus'
    ) {
        super(measures, i);
    }

    clone(): this {
        return this;
    }
}

export type VoiceConstructor = new (
    i: number,
    ctx: CounterpointContext,
    measures: CounterpointMeasure[],
    lowerRange: H.Pitch,
    higherRange: H.Pitch,
    name: string
) => CounterpointVoice;

export abstract class CounterpointVoice extends Voice<CounterpointMeasure> {
    constructor(
        i: number,
        protected readonly ctx: CounterpointContext,
        measures: CounterpointMeasure[],
        public readonly lowerRange: H.Pitch,
        public readonly higherRange: H.Pitch,
        public readonly name: string
    ) {
        super(measures, i);
    }

    abstract clone(): this;

    abstract makeNewMeasure: (s: Score) => {
        measure: CounterpointMeasure,
        cost: number
    }[];

    abstract replaceMeasure(i: number, m: CounterpointMeasure): this;
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
        const ms: BlankMeasure[] = [];
        for (let i = 0; i < this.ctx.targetMeasures; i++)
            ms.push(new BlankMeasure(this.ctx));

        this.#voices.push(new v(this.#voices.length, this.ctx, ms, l, h, name));
        return this;
    }

    cantus(measures: Note[][]): this {
        const ms = measures.map((x) => new FixedMeasure(x, this.ctx));
        this.#voices.push(new FixedVoice(this.#voices.length, ms));
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
