import { Rational, Debug } from "common";
import { CounterpointMeasure, CounterpointMeasureCursor, CounterpointNoteCursor, CounterpointVoice, emptyMelodicContext, MelodicContext, MelodicSettings, Step, VoiceConstructor } from "./Basic";
import { CounterpointContext } from "./Context";
import { Score } from "./Score";
import { MeasureCursor, NonHarmonicType, Note } from "./Voice";
import { H, PC } from "./Internal";

export type NoteSchema = {
    harmonic: boolean,
    types?: NonHarmonicType[],
    duration: Rational,
} | {
    skip: true,
    duration: Rational,
};

export type MeasureSchema = {
    name: string;
    notes: (cxt: CounterpointContext) => NoteSchema[];
    condition?: (cur: MeasureCursor<SpeciesMeasure>, s: Score) => boolean;
    cost?: number;
};

export class SpeciesMeasure extends CounterpointMeasure {
    get schemaName() {
        return this.name;
    }

    readonly writablePosition: Rational | null;

    constructor(
        ctx: CounterpointContext,
        mc: MelodicContext,
        readonly name: string,
        readonly noteSchema: NoteSchema[],
        notes: Note[] = [],
    ) {
        if (notes.length < noteSchema.length) {
            for (const n of noteSchema.slice(notes.length))
                notes.push(new Note(n.duration));
        }
        super(notes, ctx, mc);

        this.writablePosition = this.find(
            (x) => !x.value.pitch && !('skip' in noteSchema[x.index]))?.time ?? null;
    }

    #replace(i: number, n: Note) {
        const e = [...this.elements];
        e.splice(i, 1, n);
        return new SpeciesMeasure(this.ctx,
            this.ctx.updateMelodicContext(this.melodicContext, n.pitch),
            this.name, this.noteSchema, e);
    }

    getNextSteps(s: Score, c: CounterpointMeasureCursor): Step[] {
        // @ts-expect-error
        const ci: CounterpointNoteCursor = this.find(
            (x) => x.value.pitch === null
                && ('harmonic' in this.noteSchema[x.index])
        // @ts-expect-error
        )!.withParent(c);

        const schema = this.noteSchema[ci.index];
        Debug.assert('harmonic' in schema);
        const next: Step[] = [];
        if (schema.types)
            next.push(...this.ctx.fillNonHarmonicTone(schema.types,
                s, ci, (n) => this.#replace(ci.index, n)));
        if (schema.harmonic)
            next.push(...this.ctx.fillHarmonicTone(
                s, ci, (n) => this.#replace(ci.index, n)));
        return next;
    }

    hash(): string {
        return `${this.name}=${this.hashNotes()}`;
    }
}

class FakeMeasure extends CounterpointMeasure {
    readonly writablePosition = Rational.from(0);

    static counter = 0;

    readonly counter: number;

    constructor(
        ctx: CounterpointContext,
        mc: MelodicContext,
        private schemas: (readonly [MeasureSchema, NoteSchema[]])[],
        private p0: H.Pitch,
    ) {
        super([new Note(ctx.parameters.measureLength)], ctx, mc);
        this.counter = FakeMeasure.counter;
        FakeMeasure.counter++;
    }

    hash(): string {
        return `fake${this.counter}:${this.p0.hash}`;
    }

    getNextSteps(s: Score, c: CounterpointMeasureCursor): Step[] {
        const mc = this.melodicContext;
        return this.schemas.map(([s, n]) => ({
            measure: new SpeciesMeasure(this.ctx, mc, s.name, n,
                [new Note(n[0].duration, this.p0)]),
            advanced: Rational.from(1),
            cost: s.cost ?? 0
        }));
    }
}

export function defineSpecies(
    m: MelodicSettings, schema: MeasureSchema[]
): VoiceConstructor & { readonly melodySettings: MelodicSettings } {
    return class Species extends CounterpointVoice {
        get melodySettings() {
            return m;
        }

        static melodySettings = m;

        clone() {
            return new Species(this.index, this.ctx, [...this.elements],
                this.lowerRange, this.higherRange, this.name, this.clef) as this;
        }

        replaceMeasure(i: number, m: CounterpointMeasure): this {
            const e = [...this.elements];
            e.splice(i, 1, m);
            return new Species(this.index, this.ctx, e,
                this.lowerRange, this.higherRange, this.name, this.clef) as this;
        }

        makeNewMeasure = (score: Score, c: CounterpointMeasureCursor) => {
            const mc = c.prevGlobal()?.value.melodicContext ?? emptyMelodicContext();
            const cur = c as unknown as MeasureCursor<SpeciesMeasure>;

            const availableSchemas = schema
                .filter((s) => !s.condition || s.condition(cur, score))
                .map((s) => [s, s.notes(this.ctx)] as const);

            const firstIsHarmonic = availableSchemas
                .filter(([_, n]) => 'harmonic' in n[0] && n[0].harmonic);

            const firstIsNotHarmonic = availableSchemas
                .filter(([_, n]) => !('harmonic' in n[0]) || !n[0].harmonic);

            const results: {
                measure: CounterpointMeasure,
                cost: number
            }[] = [];

            results.push(...firstIsNotHarmonic.map(([s, n]) => ({
                measure: new SpeciesMeasure(this.ctx, mc, s.name, n),
                cost: (s.cost ?? 0)
            })));

            if (firstIsHarmonic.length > 0) {
                // find a harmonic tone
                const fake = new FakeMeasure(this.ctx, mc, firstIsHarmonic, PC.c);
                const voice = c.container;
                const newVoice = voice.replaceMeasure(c.index, fake);
                const newScore = score.replaceVoice(voice.index, newVoice);
                const fakeCursor = newVoice.at(c.index)!;
                const candidates = [...this.ctx.getCandidates(
                    this.ctx.harmonicToneRules, newScore,
                    fake.atWithParent(0, fakeCursor)).entries()];

                results.push(...candidates
                    .map(([p, cost]) => ({
                        measure: new FakeMeasure(this.ctx, mc, firstIsHarmonic, p),
                        cost: cost
                    })));
            }

            return results;
        };
    }
}
