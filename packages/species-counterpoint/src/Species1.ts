import { H, Score, Note } from "./Common";
import { CounterpointContext } from "./Context";
import { CounterpointMeasure, CounterpointMeasureCursor, CounterpointVoice, emptyMelodicContext, MelodicContext } from "./Basic";
import { enforceVerticalConsonanceStrict } from "./rules/VerticalConsonance";

class FirstSpeciesMeasure extends CounterpointMeasure {
    get writable() {
        return this.elements[0].pitch === null;
    };

    constructor(
        ctx: CounterpointContext,
        mc: MelodicContext,
        p0: H.Pitch | null = null
    ) {
        super([new Note(ctx.parameters.measureLength, p0)], ctx, mc);
    }

    hash(): string {
        return `sp1:${this.hashNotes()}`;
    }

    getNextSteps(
        s: Score, c: CounterpointMeasureCursor
    ): { measure: CounterpointMeasure; cost: number }[] {
        const rules = [enforceVerticalConsonanceStrict];
        return this.ctx.fillIn(rules, s, this.atWithParent(0, c), undefined,
            (p) => new FirstSpeciesMeasure(this.ctx,
                this.ctx.updateMelodicContext(this.melodicContext, p), p));
    }
}

export class FirstSpecies extends CounterpointVoice {
    readonly melodySettings = {
        forbidRepeatedNotes: false,
        maxConsecutiveLeaps: 2,
        maxIgnorable3rdLeaps: 2,
        maxUnidirectionalConsecutiveLeaps: 1,
        maxUnidirectionalIgnorable3rdLeaps: 1,
    };

    clone() {
        return new FirstSpecies(this.index, this.ctx, [...this.elements],
            this.lowerRange, this.higherRange, this.name, this.clef) as this;
    }

    replaceMeasure(i: number, m: CounterpointMeasure): this {
        const e = [...this.elements];
        e.splice(i, 1, m);
        return new FirstSpecies(this.index, this.ctx, e,
            this.lowerRange, this.higherRange, this.name, this.clef) as this;
    }

    makeNewMeasure = (_s: Score, c: CounterpointMeasureCursor) => {
        const last = c.prevGlobal()?.value.melodicContext;
        return [{
            measure: new FirstSpeciesMeasure(this.ctx, last ?? emptyMelodicContext()),
            cost: 0,
        }];
    };
}
