import { Debug, Rational } from "common";
import { H, TimedNote, Score } from "./Common";
import { CounterpointContext } from "./Context";
import { CounterpointMeasure, CounterpointVoice } from "./Basic";
import { enforceVerticalConsonanceStrict } from "./rules/CandidateRules";

export class FirstSpeciesMeasure extends CounterpointMeasure {
    public readonly notes: TimedNote[];
    get writable() {
        return this.p0 === null;
    };

    constructor(
        voiceIndex: number, index: number,
        ctx: CounterpointContext,
        public readonly p0: H.Pitch | null = null
    ) {
        super(voiceIndex, index, ctx);
        this.notes = [{
            pitch: p0,
            length: new Rational(ctx.parameters.measureLength),
            position: new Rational(0)
        }];
    }

    hash(): string {
        return `sp1${this.hashNotes()}`;
    }

    getNextSteps(
        ctx: CounterpointContext, s: Score
    ): { measure: CounterpointMeasure; cost: number }[] {
        const t = new Rational(s.parameters.measureLength * this.index);
        const rules = [enforceVerticalConsonanceStrict];
        return ctx.fillIn(rules, s, this, t, {},
            (p) => new FirstSpeciesMeasure(this.voiceIndex, this.index, this.ctx, p));
    }
}

export class FirstSpecies extends CounterpointVoice {
    clone() {
        return new FirstSpecies(this.index, this.ctx,
            [...this.measures], this.lowerRange, this.higherRange, this.name) as this;
    }

    makeNewMeasure = (s: Score, iv: number, i: number) => {
        return [{
            measure: new FirstSpeciesMeasure(iv, i, this.ctx),
            cost: 0,
        }];
    };
}
