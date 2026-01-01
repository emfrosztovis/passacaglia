import { Debug } from "common";
import { Score, Note } from "./Common";
import { CounterpointContext } from "./Context";
import { CounterpointMeasure, CounterpointMeasureCursor, CounterpointVoice, emptyMelodicContext, MelodicContext } from "./Basic";
import { enforceVerticalConsonanceStrict } from "./rules/VerticalConsonance";
import { makePassingTone } from "./rules/PassingTone";
import { makeNeighborTone } from "./rules";
import { H } from "./Internal";

class SecondSpeciesMeasure extends CounterpointMeasure {
    get writable() {
        return this.p1 === null;
    };

    constructor(
        ctx: CounterpointContext,
        mc: MelodicContext,
        public readonly p0: H.Pitch | null = null,
        public readonly p1: H.Pitch | null = null,
        isPassingTone = false
    ) {
        Debug.assert(ctx.parameters.measureLength.modulo(2).num == 0);
        const len = ctx.parameters.measureLength.div(2);
        super([
            new Note(len, p0),
            new Note(len, p1, isPassingTone ? 'passing_tone' : undefined)
        ], ctx, mc);
    }

    hash(): string {
        return `sp2:${this.hashNotes()}`;
    }

    getNextSteps(
        s: Score, c: CounterpointMeasureCursor
    ): { measure: CounterpointMeasure; cost: number }[] {
        if (this.p0 == null) {
            if (c.index == 0) {
                // start first measure from the upbeat
                return this.ctx.fillIn(
                    [enforceVerticalConsonanceStrict], s, this.atWithParent(1, c), undefined,
                    (p) => new SecondSpeciesMeasure(this.ctx,
                        this.ctx.updateMelodicContext(this.melodicContext, p),
                        null, p));
            } else {
                return this.ctx.fillIn(
                    [enforceVerticalConsonanceStrict], s, this.atWithParent(0, c), undefined,
                    (p) => new SecondSpeciesMeasure(this.ctx,
                        this.ctx.updateMelodicContext(this.melodicContext, p),
                        p, null));
            }
        }

        if (this.p1 == null) {
            const next: { measure: CounterpointMeasure; cost: number }[] = [];

            // non-harmonic tones
            next.push(...this.ctx.fillIn(
                [makeNeighborTone], s,
                this.atWithParent(1, c), 'neighbor',
                (p) => new SecondSpeciesMeasure(this.ctx,
                    this.ctx.updateMelodicContext(this.melodicContext, p),
                    this.p0, p, true)));

            next.push(...this.ctx.fillIn(
                [makePassingTone], s,
                this.atWithParent(1, c), 'passing_tone',
                (p) => new SecondSpeciesMeasure(this.ctx,
                    this.ctx.updateMelodicContext(this.melodicContext, p),
                    this.p0, p, true)));

            // non-passing tones
            next.push(...this.ctx.fillIn(
                [enforceVerticalConsonanceStrict], s,
                this.atWithParent(1, c), undefined,
                (p) => new SecondSpeciesMeasure(this.ctx,
                    this.ctx.updateMelodicContext(this.melodicContext, p),
                    this.p0, p)));

            return next;
        }
        Debug.never();
    }
}

export class SecondSpecies extends CounterpointVoice {
    readonly melodySettings = {
        forbidRepeatedNotes: true,
        maxConsecutiveLeaps: 2,
        maxIgnorable3rdLeaps: 1,
        maxUnidirectionalConsecutiveLeaps: 1,
        maxUnidirectionalIgnorable3rdLeaps: 0,
    };

    clone() {
        return new SecondSpecies(this.index, this.ctx,
            [...this.elements], this.lowerRange, this.higherRange, this.name, this.clef) as this;
    }

    replaceMeasure(i: number, m: CounterpointMeasure): this {
        const e = [...this.elements];
        e.splice(i, 1, m);
        return new SecondSpecies(this.index, this.ctx, e,
            this.lowerRange, this.higherRange, this.name, this.clef) as this;
    }

    makeNewMeasure = (_s: Score, c: CounterpointMeasureCursor) => {
        const last = c.prevGlobal()?.value.melodicContext;
        return [{
            measure: new SecondSpeciesMeasure(this.ctx, last ?? emptyMelodicContext()),
            cost: 0,
        }];
    };
}
