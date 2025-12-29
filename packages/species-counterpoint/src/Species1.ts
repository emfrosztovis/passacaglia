import { Debug, Rational } from "common";
import { H, Score, Note } from "./Common";
import { CounterpointContext } from "./Context";
import { CounterpointMeasure, CounterpointMeasureCursor, CounterpointVoice } from "./Basic";
import { enforceVerticalConsonanceStrict } from "./rules/CandidateRules";

class FirstSpeciesMeasure extends CounterpointMeasure {
    get writable() {
        return this.elements[0].pitch === null;
    };

    constructor(
        ctx: CounterpointContext,
        p0: H.Pitch | null = null
    ) {
        super([new Note(ctx.parameters.measureLength, p0)], ctx);
    }

    hash(): string {
        return `sp1:${this.hashNotes()}`;
    }

    getNextSteps(
        s: Score, c: CounterpointMeasureCursor
    ): { measure: CounterpointMeasure; cost: number }[] {
        const rules = [enforceVerticalConsonanceStrict];
        return this.ctx.fillIn(rules, s, this.atWithParent(0, c), {},
            (p) => new FirstSpeciesMeasure(this.ctx, p));
    }
}

export class FirstSpecies extends CounterpointVoice {
    clone() {
        return new FirstSpecies(this.index, this.ctx, [...this.elements],
            this.lowerRange, this.higherRange, this.name) as this;
    }

    replaceMeasure(i: number, m: CounterpointMeasure): this {
        const e = [...this.elements];
        e.splice(i, 1, m);
        return new FirstSpecies(this.index, this.ctx, e,
            this.lowerRange, this.higherRange, this.name) as this;
    }

    makeNewMeasure = (s: Score) => {
        return [{
            measure: new FirstSpeciesMeasure(this.ctx),
            cost: 0,
        }];
    };
}
