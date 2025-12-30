import { H, Measure, Note, Score, Voice } from "./Common";
import { CounterpointContext } from "./Context";
import { SequentialCursor } from "core";

export type CounterpointMeasureCursor = SequentialCursor<CounterpointMeasure, CounterpointVoice, never>;
// FIXME: typechecker bug?
// @ts-expect-error
export type CounterpointNoteCursor = SequentialCursor<Note, CounterpointMeasure, CounterpointMeasureCursor>;

export type MelodicContext = {
    lastPitch?: H.Pitch;
    leapDirection: number;
    nConsecutiveLeaps: number;
    n3rdLeaps: number;
    nUnidirectionalConsecutiveLeaps: number;
    nUnidirectional3rdLeaps: number;


};

export function emptyMelodicContext(): MelodicContext {
    return {
        leapDirection: 0,
        nConsecutiveLeaps: 0,
        n3rdLeaps: 0,
        nUnidirectionalConsecutiveLeaps: 0,
        nUnidirectional3rdLeaps: 0
    };
}

export abstract class CounterpointMeasure extends Measure {
    constructor(
        notes: Note[],
        protected ctx: CounterpointContext,
        public readonly melodicContext: MelodicContext,
    ) {
        super(notes, ctx.parameters.measureLength);
    }

    atWithParent(i: number, c: CounterpointMeasureCursor): CounterpointNoteCursor {
        // FIXME: withParent
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
        super([new Note(ctx.parameters.measureLength, undefined)], ctx, emptyMelodicContext());
    }

    getNextSteps(s: Score, c: CounterpointMeasureCursor) {
        return c.container.makeNewMeasure(s, c);
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

export type MelodicSettings = {
    maxConsecutiveLeaps: number;
    maxIgnorable3rdLeaps: number;
    maxUnidirectionalConsecutiveLeaps: number;
    maxUnidirectionalIgnorable3rdLeaps: number;
};

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

    abstract readonly melodySettings?: MelodicSettings;

    abstract clone(): this;

    abstract makeNewMeasure: (s: Score, cur: CounterpointMeasureCursor) => {
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
    // https://artinfuser.com/exercise/md/pdf/Artinfuser_Counterpoint_rules.pdf

    soprano(v: VoiceConstructor) {
        return this.voice(v, 'Soprano', H.Pitch.parse('c4')!, H.Pitch.parse('a5')!);
    }

    alto(v: VoiceConstructor) {
        return this.voice(v, 'Alto', H.Pitch.parse('f3')!, H.Pitch.parse('d5')!);
    }

    tenor(v: VoiceConstructor) {
        return this.voice(v, 'Tenor', H.Pitch.parse('c3')!, H.Pitch.parse('a4')!);
    }

    bass(v: VoiceConstructor) {
        return this.voice(v, 'Bass', H.Pitch.parse('f2')!, H.Pitch.parse('d4')!);
    }
}
