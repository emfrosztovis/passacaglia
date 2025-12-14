import { Debug, Rational } from "common";
import { H, Note, Score } from "./Common";
import { CounterpointContext } from "./Context";
import { CounterpointMeasure, CounterpointVoice } from "./Basic";
import { enforceHarmonyIntervals, makePassingTone } from "./rules/CandidateRules";

export class HalfNoteMeasure extends CounterpointMeasure {
    public readonly notes: Note[];
    get writable() {
        return this.p1 === null;
    };

    constructor(
        voiceIndex: number, index: number,
        ctx: CounterpointContext,
        public readonly p0: H.Pitch | null = null,
        public readonly p1: H.Pitch | null = null,
        isPassingTone = false
    ) {
        super(voiceIndex, index, ctx);
        this.notes = [
            {
                pitch: p0,
                length: new Rational(2),
                position: new Rational(0)
            }, {
                pitch: p1,
                length: new Rational(2),
                position: new Rational(2),
                isPassingTone
            }
        ];
    }

    hash(): string {
        return `2half${this.hashNotes()}`;
    }

    getNextSteps(
        cxt: CounterpointContext, s: Score
    ): { measure: CounterpointMeasure; cost: number }[] {
        const t0 = new Rational(s.parameters.measureLength * this.index);
        const t1 = t0.add(2);

        if (this.p0 == null) {
            if (this.index == 0) // start first measure from the second beat
                return cxt.fillIn([enforceHarmonyIntervals], s, this, t1,
                    (p) => new HalfNoteMeasure(this.voiceIndex, this.index, this.ctx, null, p));
            else
                return cxt.fillIn([enforceHarmonyIntervals], s, this, t0,
                (p) => new HalfNoteMeasure(this.voiceIndex, this.index, this.ctx, p, null));
        }

        if (this.p1 == null) {
            const next: { measure: CounterpointMeasure; cost: number }[] = [];

            // non-passing tones
            next.push(...cxt.fillIn([enforceHarmonyIntervals], s, this, t1,
                (p) => new HalfNoteMeasure(this.voiceIndex, this.index, this.ctx, this.p0, p), 1));

            // passing tones
            next.push(...cxt.fillIn([makePassingTone], s, this, t1,
                (p) => new HalfNoteMeasure(
                        this.voiceIndex, this.index, this.ctx, this.p0, p, true)));

            return next;
        }
        Debug.never();
    }
}

export class SecondSpecies extends CounterpointVoice {
    clone() {
        return new SecondSpecies(this.index, this.ctx,
            [...this.measures], this.lowerRange, this.higherRange, this.name) as this;
    }

    makeNewMeasure = (s: Score, iv: number, i: number) => {
        return [{
            measure: new HalfNoteMeasure(iv, i, this.ctx),
            cost: 0,
        }];
    };
}
