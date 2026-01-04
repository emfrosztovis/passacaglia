import { Rational, Debug } from "common";
import { CounterpointMeasure, CounterpointMeasureCursor, CounterpointNoteCursor, CounterpointVoice, emptyMelodicContext, MelodicContext, MelodicSettings, Step, VoiceConstructor } from "./Basic";
import { CounterpointContext } from "./Context";
import { Score } from "./Score";
import { MeasureCursor, NonHarmonicType, Note } from "./Voice";
import { ThirdSpeciesMeasure } from "./Species3";

type NoteSchema = {
    harmonic: boolean,
    type: NonHarmonicType[],
    duration: Rational,
} | {
    skip: true,
    duration: Rational,
};

type MeasureSchema = {
    name: string;
    notes: NoteSchema[];
    condition?: (cur: MeasureCursor<SpeciesMeasure>) => boolean;
    cost?: number;
};

class SpeciesMeasure extends CounterpointMeasure {
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
            for (const n of schema.notes)
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
        // @ts-expect-error
        const ci: CounterpointNoteCursor = this.find(
            (x) => x.value.pitch === null
                && ('type' in this.schema.notes[x.index])
        // @ts-expect-error
        )!.withParent(c);

        const schema = this.schema.notes[ci.index];
        Debug.assert('type' in schema);
        const next: Step[] = [];
        if (schema.harmonic)
            next.push(...this.ctx.fillHarmonicTone(
                s, ci, (n) => this.#replace(ci.index, n)));
        next.push(...this.ctx.fillNonHarmonicTone(schema.type,
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

        makeNewMeasure = (_s: Score, c: CounterpointMeasureCursor) => {
            const mc = c.prevGlobal()?.value.melodicContext ?? emptyMelodicContext();
            const cur = c as unknown as MeasureCursor<SpeciesMeasure>;
            return schema.flatMap((s) => {
                if (!s.condition || s.condition(cur))
                    return { measure: new SpeciesMeasure(this.ctx, mc, s), cost: s.cost ?? 0 };
                return [];
            });
        };
    }
}
