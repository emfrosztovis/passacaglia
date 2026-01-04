import { Rational, Debug } from "common";
import { CounterpointMeasure, CounterpointMeasureCursor, CounterpointNoteCursor, CounterpointVoice, emptyMelodicContext, MelodicContext, MelodicSettings, Step, VoiceConstructor } from "./Basic";
import { CounterpointContext } from "./Context";
import { Score } from "./Score";
import { MeasureCursor, NonHarmonicType, Note } from "./Voice";

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
        return this.schema.name;
    }

    get writable() {
        return !this.elements.at(-1)?.pitch;
    };

    constructor(
        ctx: CounterpointContext,
        mc: MelodicContext,
        private schema: MeasureSchema,
        notes?: Note[],
    ) {
        if (!notes) {
            notes = [];
            for (const n of schema.notes(ctx))
                notes.push(new Note(n.duration));
        }
        super(notes, ctx, mc);
    }

    #replace(i: number, n: Note) {
        const e = [...this.elements];
        e.splice(i, 1, n);
        return new SpeciesMeasure(this.ctx,
            this.ctx.updateMelodicContext(this.melodicContext, n.pitch), this.schema, e);
    }

    getNextSteps(s: Score, c: CounterpointMeasureCursor): Step[] {
        const notes = this.schema.notes(this.ctx);

        // @ts-expect-error
        const ci: CounterpointNoteCursor = this.find(
            (x) => x.value.pitch === null
                && ('harmonic' in notes[x.index])
        // @ts-expect-error
        )!.withParent(c);

        const schema = notes[ci.index];
        Debug.assert('harmonic' in schema);
        const next: Step[] = [];
        if (schema.harmonic)
            next.push(...this.ctx.fillHarmonicTone(
                s, ci, (n) => this.#replace(ci.index, n)));
        if (schema.types)
            next.push(...this.ctx.fillNonHarmonicTone(schema.types,
                s, ci, (n) => this.#replace(ci.index, n)));
        return next;
    }

    hash(): string {
        return `${this.schema.name}=${this.hashNotes()}`;
    }
}

export function defineSpecies(m: MelodicSettings, schema: MeasureSchema[]): VoiceConstructor {
    return class Species extends CounterpointVoice {
        get melodySettings() {
            return m;
        }

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
            return schema.flatMap((s) => {
                if (!s.condition || s.condition(cur, score))
                    return { measure: new SpeciesMeasure(this.ctx, mc, s), cost: s.cost ?? 0 };
                return [];
            });
        };
    }
}
