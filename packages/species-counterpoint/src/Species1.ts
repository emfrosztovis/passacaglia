import { Debug, Rational } from "common";
import { H, Note, Score } from "./Common";
import { CounterpointContext } from "./Context";
import { CounterpointMeasure, CounterpointVoice } from "./Basic";
import { enforceHarmonyIntervals } from "./rules/CandidateRules";

export class WholeNoteMeasure extends CounterpointMeasure {
    public readonly notes: Note[];
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
            length: new Rational(4),
            position: new Rational(0)
        }];
    }

    hash(): string {
        return `whole${this.hashNotes()}`;
    }

    getNextSteps(
        cxt: CounterpointContext, s: Score
    ): { measure: CounterpointMeasure; cost: number }[] {
        const t = new Rational(s.parameters.measureLength * this.index);
        const rules = [enforceHarmonyIntervals];
        return cxt.fillIn(rules, s, this, t, {},
            (p) => new WholeNoteMeasure(this.voiceIndex, this.index, this.ctx, p));
    }
}

export class FirstSpecies extends CounterpointVoice {
    clone() {
        return new FirstSpecies(this.index, this.ctx,
            [...this.measures], this.lowerRange, this.higherRange, this.name) as this;
    }

    makeNewMeasure = (s: Score, iv: number, i: number) => {
        return [{
            measure: new WholeNoteMeasure(iv, i, this.ctx),
            cost: 0,
        }];
    };
}
