import { Debug } from "common";
import { Note } from "./Voice";
import { CounterpointContext } from "./Context";
import { CounterpointMeasure, CounterpointMeasureCursor, CounterpointVoice, emptyMelodicContext, MelodicContext, Step } from "./Basic";
import { Score } from "./Score";
import { FourthSpeciesMeasure } from "./Species4";
import { ThirdSpeciesMeasure } from "./Species3";
import { SecondSpeciesMeasure } from "./Species2";


export class FifthSpecies extends CounterpointVoice {
    readonly melodySettings = {
        forbidRepeatedNotes: true,
        maxConsecutiveLeaps: 3,
        maxIgnorable3rdLeaps: 1,
        maxUnidirectionalConsecutiveLeaps: 1,
        maxUnidirectionalIgnorable3rdLeaps: 0,
    };

    clone() {
        return new FifthSpecies(this.index, this.ctx,
            [...this.elements], this.lowerRange, this.higherRange, this.name, this.clef) as this;
    }

    replaceMeasure(i: number, m: CounterpointMeasure): this {
        const e = [...this.elements];
        e.splice(i, 1, m);
        return new FifthSpecies(this.index, this.ctx, e,
            this.lowerRange, this.higherRange, this.name, this.clef) as this;
    }

    makeNewMeasure = (_s: Score, c: CounterpointMeasureCursor) => {
        const lastMeasure = c.prevGlobal()?.value;
        const mctx = lastMeasure?.melodicContext ?? emptyMelodicContext();
        const measures: {
            measure: CounterpointMeasure,
            cost: number
        }[] = [];
        if (!(lastMeasure instanceof FourthSpeciesMeasure)) measures.push({
            measure: new FourthSpeciesMeasure(this.ctx, mctx),
            cost: -20,
        });
        if (!(lastMeasure instanceof ThirdSpeciesMeasure)) measures.push({
            measure: new ThirdSpeciesMeasure(this.ctx, mctx),
            cost: 20,
        });
        if (!(lastMeasure instanceof SecondSpeciesMeasure)) measures.push({
            measure: new SecondSpeciesMeasure(this.ctx, mctx),
            cost: 100,
        });
        return measures;
    };
}
