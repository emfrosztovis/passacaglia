import { Debug, Rational } from "common";
import { Note } from "./Voice";
import { CounterpointContext } from "./Context";
import { CounterpointMeasure, CounterpointMeasureCursor, CounterpointVoice, emptyMelodicContext, MelodicContext } from "./Basic";
import { Score } from "./Score";

export class SecondSpeciesMeasure extends CounterpointMeasure {
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
        return `sp2:${this.hashNotes()}`;
    }

    getNextSteps(
        s: Score, c: CounterpointMeasureCursor
    ) {
        if (this.elements[0].pitch == null) {
            return this.ctx.fillHarmonicTone(s, this.atWithParent(c.index == 0 ? 1 : 0, c),
                (n, p) => new SecondSpeciesMeasure(this.ctx,
                    this.ctx.updateMelodicContext(this.melodicContext, p),
                    c.index == 0 ? undefined : n,
                    c.index == 0 ? n : undefined));
        }

        if (this.elements[1].pitch == null) {
            const next: { measure: CounterpointMeasure, advanced: Rational, cost: number }[] = [];
            next.push(...this.ctx.fillHarmonicTone(
                s, this.atWithParent(1, c),
                (n, p) => new SecondSpeciesMeasure(this.ctx,
                    this.ctx.updateMelodicContext(this.melodicContext, p),
                    this.elements[0], n)));
            next.push(...this.ctx.fillNonHarmonicTone(['passing_tone', 'neighbor',],
                s, this.atWithParent(1, c),
                (n, p) => new SecondSpeciesMeasure(this.ctx,
                    this.ctx.updateMelodicContext(this.melodicContext, p),
                    this.elements[0], n)));
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
