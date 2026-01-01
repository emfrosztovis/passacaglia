import { Debug, Rational } from "common";
import { Score, Note } from "./Common";
import { CounterpointContext } from "./Context";
import { CounterpointMeasure, CounterpointMeasureCursor, CounterpointNoteCursor, CounterpointVoice, emptyMelodicContext, MelodicContext } from "./Basic";
import { enforceVerticalConsonanceStrict, enforceVerticalConsonanceWithMoving } from "./rules/VerticalConsonance";
import { makePassingTone } from "./rules/PassingTone";
import { makeNeighborTone } from "./rules";

class ThirdSpeciesMeasure extends CounterpointMeasure {
    get writable() {
        return !this.elements.at(-1)?.pitch;
    };

    constructor(
        ctx: CounterpointContext,
        mc: MelodicContext,
        notes: Note[],
    ) {
        super(notes, ctx, mc);
        Debug.assert(notes.length == ctx.parameters.measureLength.value());
    }

    hash(): string {
        return `sp3:${this.hashNotes()}`;
    }

    getNextSteps(
        s: Score, c: CounterpointMeasureCursor
    ): { measure: CounterpointMeasure; cost: number }[] {
        // FIXME: withParent
        // @ts-expect-error
        const ci: CounterpointNoteCursor = this.find((x) => x.value.pitch === null && (c.index == 0 ? x.index > 0 : true))?.withParent(c);
        const next: { measure: CounterpointMeasure; cost: number }[] = [];
        Debug.assert(ci !== undefined);

        // non-harmonic tone (not on the first beat)
        if (ci.index !== 0 && !(c.index == 0 && ci.index == 1)) {
            next.push(...this.ctx.fillIn(
                [makeNeighborTone, enforceVerticalConsonanceWithMoving], s,
                ci, 'neighbor',
                (p) => {
                    const e = [...this.elements];
                    e.splice(ci.index, 1, new Note(new Rational(1), p, 'neighbor'));
                    return new ThirdSpeciesMeasure(this.ctx,
                        this.ctx.updateMelodicContext(this.melodicContext, p), e);
                }));

            next.push(...this.ctx.fillIn(
                [makePassingTone, enforceVerticalConsonanceWithMoving], s,
                ci, 'passing_tone',
                (p) => {
                    const e = [...this.elements];
                    e.splice(ci.index, 1, new Note(new Rational(1), p, 'passing_tone'));
                    return new ThirdSpeciesMeasure(this.ctx,
                        this.ctx.updateMelodicContext(this.melodicContext, p), e);
                }));
        }

        // non-passing tone
        next.push(...this.ctx.fillIn(
            [enforceVerticalConsonanceStrict], s, ci, undefined,
            (p) => {
                    const e = [...this.elements];
                    e.splice(ci.index, 1, new Note(new Rational(1), p));
                    return new ThirdSpeciesMeasure(this.ctx,
                        this.ctx.updateMelodicContext(this.melodicContext, p), e);
            }));

        return next;
    }
}

export class ThirdSpecies extends CounterpointVoice {
    readonly melodySettings = {
        forbidRepeatedNotes: true,
        maxConsecutiveLeaps: 2,
        maxIgnorable3rdLeaps: 1,
        maxUnidirectionalConsecutiveLeaps: 1,
        maxUnidirectionalIgnorable3rdLeaps: 0,
    };

    clone() {
        return new ThirdSpecies(this.index, this.ctx,
            [...this.elements], this.lowerRange, this.higherRange, this.name, this.clef) as this;
    }

    replaceMeasure(i: number, m: CounterpointMeasure): this {
        const e = [...this.elements];
        e.splice(i, 1, m);
        return new ThirdSpecies(this.index, this.ctx, e,
            this.lowerRange, this.higherRange, this.name, this.clef) as this;
    }

    makeNewMeasure = (_s: Score, c: CounterpointMeasureCursor) => {
        const last = c.prevGlobal()?.value.melodicContext;
        const notes: Note[] = [];
        const len = this.ctx.parameters.measureLength.value();
        for (let i = 0; i < len; i++)
            notes.push(new Note(new Rational(1)));

        return [{
            measure: new ThirdSpeciesMeasure(this.ctx, last ?? emptyMelodicContext(), notes),
            cost: 0,
        }];
    };
}
