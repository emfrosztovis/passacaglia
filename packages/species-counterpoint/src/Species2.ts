import { Debug } from "common";
import { H, Score, Note } from "./Common";
import { CounterpointContext } from "./Context";
import { CounterpointMeasure, CounterpointMeasureCursor, CounterpointVoice } from "./Basic";
import { enforceVerticalConsonanceStrict, enforceVerticalConsonanceWithMoving, makePassingTone } from "./rules/CandidateRules";

class SecondSpeciesMeasure extends CounterpointMeasure {
    get writable() {
        return this.p1 === null;
    };

    constructor(
        ctx: CounterpointContext,
        public readonly p0: H.Pitch | null = null,
        public readonly p1: H.Pitch | null = null,
        isPassingTone = false
    ) {
        Debug.assert(ctx.parameters.measureLength.modulo(2).num == 0);
        const len = ctx.parameters.measureLength.div(2);
        super([
            new Note(len, p0),
            new Note(len, p1, { isPassingTone })
        ], ctx);
    }

    hash(): string {
        return `sp2:${this.hashNotes()}`;
    }

    getNextSteps(
        s: Score, c: CounterpointMeasureCursor
    ): { measure: CounterpointMeasure; cost: number }[] {
        if (this.p0 == null) {
            if (c.index == 0) {
                // start first measure from the second beat
                return this.ctx.fillIn(
                    [enforceVerticalConsonanceStrict], s, this.atWithParent(0, c), {},
                    (p) => new SecondSpeciesMeasure(this.ctx, null, p));
            } else {
                return this.ctx.fillIn(
                    [enforceVerticalConsonanceStrict], s, this.atWithParent(0, c), {},
                    (p) => new SecondSpeciesMeasure(this.ctx, p, null));
            }
        }

        if (this.p1 == null) {
            const next: { measure: CounterpointMeasure; cost: number }[] = [];

            // passing tones
            next.push(...this.ctx.fillIn(
                [makePassingTone, enforceVerticalConsonanceWithMoving], s,
                this.atWithParent(1, c), { isPassingTone: true },
                (p) => new SecondSpeciesMeasure(this.ctx, this.p0, p, true)));

            // non-passing tones
            next.push(...this.ctx.fillIn(
                [enforceVerticalConsonanceStrict], s,
                this.atWithParent(1, c), {},
                (p) => new SecondSpeciesMeasure(this.ctx, this.p0, p)));

            return next;
        }
        Debug.never();
    }
}

export class SecondSpecies extends CounterpointVoice {
    clone() {
        return new SecondSpecies(this.index, this.ctx,
            [...this.elements], this.lowerRange, this.higherRange, this.name) as this;
    }

    replaceMeasure(i: number, m: CounterpointMeasure): this {
        const e = [...this.elements];
        e.splice(i, 1, m);
        return new SecondSpecies(this.index, this.ctx, e,
            this.lowerRange, this.higherRange, this.name) as this;
    }

    makeNewMeasure = (s: Score) => {
        return [{
            measure: new SecondSpeciesMeasure(this.ctx),
            cost: 0,
        }];
    };
}
