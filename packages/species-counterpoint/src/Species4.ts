import { Debug } from "common";
import { Score, Note } from "./Common";
import { CounterpointContext } from "./Context";
import { CounterpointMeasure, CounterpointMeasureCursor, CounterpointVoice, emptyMelodicContext, MelodicContext } from "./Basic";

class FourthSpeciesMeasure extends CounterpointMeasure {
    get writable() {
        return this.elements[1].pitch === null;
    };

    constructor(
        ctx: CounterpointContext,
        mc: MelodicContext,
        n0?: Note,
        n1?: Note
    ) {
        Debug.assert(ctx.parameters.measureLength.modulo(2).num == 0);
        const len = ctx.parameters.measureLength.div(2);
        super([
            n0 ?? new Note(len),
            n1 ?? new Note(len),
        ], ctx, mc);
    }

    hash(): string {
        return `sp4:${this.hashNotes()}`;
    }

    getNextSteps(
        s: Score, c: CounterpointMeasureCursor
    ): { measure: CounterpointMeasure; cost: number }[] {
        if (this.elements[0].pitch == null) {
            const next: { measure: CounterpointMeasure; cost: number }[] = [];
            if (c.index == 0) {
                next.push(...this.ctx.fillHarmonicTone(s,
                    this.atWithParent(1, c),
                    (n, p) => new FourthSpeciesMeasure(this.ctx,
                        this.ctx.updateMelodicContext(this.melodicContext, p),
                        undefined, n)));
            } else {
                next.push(...this.ctx.fillNonHarmonicTone(['suspension'],
                    s, this.atWithParent(0, c),
                    (n, p) => new FourthSpeciesMeasure(this.ctx,
                        this.ctx.updateMelodicContext(this.melodicContext, p),
                        n, undefined)));

                next.push(...this.ctx.fillHarmonicTone(s,
                    this.atWithParent(0, c),
                    (n, p) => new FourthSpeciesMeasure(this.ctx,
                        this.ctx.updateMelodicContext(this.melodicContext, p),
                        n, undefined), 5000));
            }
            return next;
        }

        if (this.elements[1].pitch == null) {
            const next: { measure: CounterpointMeasure; cost: number }[] = [];
            next.push(...this.ctx.fillHarmonicTone(
                s, this.atWithParent(1, c),
                (n, p) => new FourthSpeciesMeasure(this.ctx,
                    this.ctx.updateMelodicContext(this.melodicContext, p),
                    this.elements[0], n)));
            return next;
        }
        Debug.never();
    }
}

export class FourthSpecies extends CounterpointVoice {
    readonly melodySettings = {
        forbidRepeatedNotes: true,
        maxConsecutiveLeaps: 2,
        maxIgnorable3rdLeaps: 1,
        maxUnidirectionalConsecutiveLeaps: 1,
        maxUnidirectionalIgnorable3rdLeaps: 0,
    };

    clone() {
        return new FourthSpecies(this.index, this.ctx,
            [...this.elements], this.lowerRange, this.higherRange, this.name, this.clef) as this;
    }

    replaceMeasure(i: number, m: CounterpointMeasure): this {
        const e = [...this.elements];
        e.splice(i, 1, m);
        return new FourthSpecies(this.index, this.ctx, e,
            this.lowerRange, this.higherRange, this.name, this.clef) as this;
    }

    makeNewMeasure = (_s: Score, c: CounterpointMeasureCursor) => {
        const last = c.prevGlobal()?.value.melodicContext;
        return [{
            measure: new FourthSpeciesMeasure(this.ctx, last ?? emptyMelodicContext()),
            cost: 0,
        }];
    };
}
