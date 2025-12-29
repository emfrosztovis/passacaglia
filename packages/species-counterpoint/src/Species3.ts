import { Debug, Rational } from "common";
import { Score, Note } from "./Common";
import { CounterpointContext } from "./Context";
import { CounterpointMeasure, CounterpointMeasureCursor, CounterpointNoteCursor, CounterpointVoice } from "./Basic";
import { enforceVerticalConsonanceStrict, enforceVerticalConsonanceWithMoving, makePassingTone } from "./rules/CandidateRules";

class ThirdSpeciesMeasure extends CounterpointMeasure {
    get writable() {
        return this.elements.find((x) => x.pitch === null) !== undefined;
    };

    constructor(
        ctx: CounterpointContext,
        notes: Note[],
    ) {
        super(notes, ctx);
        Debug.assert(notes.length == ctx.parameters.measureLength.value());
    }

    hash(): string {
        return `sp3:${this.hashNotes()}`;
    }

    getNextSteps(
        s: Score, c: CounterpointMeasureCursor
    ): { measure: CounterpointMeasure; cost: number }[] {

        // @ts-expect-error
        const ci: CounterpointNoteCursor = this.find((x) => x.value.pitch === null)?.withParent(c);
        const next: { measure: CounterpointMeasure; cost: number }[] = [];
        Debug.assert(ci !== undefined);

        // passing tone (not on the downbeats)
        if (ci.index !== 0 && ci.index !== this.ctx.parameters.measureLength.value() / 2) {
            next.push(...this.ctx.fillIn(
                [makePassingTone, enforceVerticalConsonanceWithMoving], s,
                ci, { isPassingTone: true },
                (p) => {
                    const e = [...this.elements];
                    e.splice(ci.index, 1, new Note(new Rational(1), p, { isPassingTone: true }));
                    return new ThirdSpeciesMeasure(this.ctx, e);
                }));
        }

        // non-passing tone
        next.push(...this.ctx.fillIn(
            [enforceVerticalConsonanceStrict], s,
            ci, { },
            (p) => {
                    const e = [...this.elements];
                    e.splice(ci.index, 1, new Note(new Rational(1), p));
                    return new ThirdSpeciesMeasure(this.ctx, e);
            }));

        return next;
    }
}

export class ThirdSpecies extends CounterpointVoice {
    clone() {
        return new ThirdSpecies(this.index, this.ctx,
            [...this.elements], this.lowerRange, this.higherRange, this.name) as this;
    }

    replaceMeasure(i: number, m: CounterpointMeasure): this {
        const e = [...this.elements];
        e.splice(i, 1, m);
        return new ThirdSpecies(this.index, this.ctx, e,
            this.lowerRange, this.higherRange, this.name) as this;
    }

    makeNewMeasure = (s: Score) => {
        const notes: Note[] = [];
        const len = this.ctx.parameters.measureLength.value();
        for (let i = 0; i < len; i++)
            notes.push(new Note(new Rational(1)));

        return [{
            measure: new ThirdSpeciesMeasure(this.ctx, notes),
            cost: 0,
        }];
    };
}
