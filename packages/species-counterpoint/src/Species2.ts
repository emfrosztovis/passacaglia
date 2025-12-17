import { Debug, Rational } from "common";
import { H, TimedNote, Score } from "./Common";
import { CounterpointContext } from "./Context";
import { CounterpointMeasure, CounterpointVoice } from "./Basic";
import { enforceVerticalConsonanceStrict, enforceVerticalConsonanceWithMoving, makePassingTone } from "./rules/CandidateRules";

export class SecondSpeciesMeasure extends CounterpointMeasure {
    public readonly notes: TimedNote[];
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
        Debug.assert(ctx.parameters.measureLength % 2 == 0);
    }

    hash(): string {
        return `sp2${this.hashNotes()}`;
    }

    getNextSteps(
        ctx: CounterpointContext, s: Score
    ): { measure: CounterpointMeasure; cost: number }[] {
        const t0 = new Rational(s.parameters.measureLength * this.index);
        const t1 = t0.add(ctx.parameters.measureLength / 2);

        if (this.p0 == null) {
            if (this.index == 0) // start first measure from the second beat
                return ctx.fillIn([enforceVerticalConsonanceStrict], s, this, t1, {},
                    (p) => new SecondSpeciesMeasure(this.voiceIndex, this.index, this.ctx, null, p));
            else
                return ctx.fillIn([enforceVerticalConsonanceStrict], s, this, t0, {},
                (p) => new SecondSpeciesMeasure(this.voiceIndex, this.index, this.ctx, p, null));
        }

        if (this.p1 == null) {
            const next: { measure: CounterpointMeasure; cost: number }[] = [];

            // passing tones
            next.push(...ctx.fillIn(
                [makePassingTone, enforceVerticalConsonanceWithMoving], s,
                this, t1, { isPassingTone: true },
                (p) => new SecondSpeciesMeasure(
                        this.voiceIndex, this.index, this.ctx, this.p0, p, true)));

            // non-passing tones
            next.push(...ctx.fillIn(
                [enforceVerticalConsonanceStrict], s,
                this, t1, {},
                (p) => new SecondSpeciesMeasure(
                    this.voiceIndex, this.index, this.ctx, this.p0, p)));

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
            measure: new SecondSpeciesMeasure(iv, i, this.ctx),
            cost: 0,
        }];
    };
}
