import { Debug, Rational } from "common";
import { H, TimedNote, Score, Note } from "./Common";
import { CounterpointContext } from "./Context";
import { CounterpointMeasure, CounterpointVoice } from "./Basic";
import { enforceVerticalConsonanceStrict, enforceVerticalConsonanceWithMoving, makePassingTone } from "./rules/CandidateRules";

export class ThirdSpeciesMeasure extends CounterpointMeasure {
    public readonly notes: TimedNote[];

    get writable() {
        return this.notes.find((x) => x.pitch === null) !== undefined;
    };

    constructor(
        voiceIndex: number, index: number,
        ctx: CounterpointContext,
        notes: Note[],
    ) {
        super(voiceIndex, index, ctx);
        Debug.assert(notes.length == ctx.parameters.measureLength);
        this.notes = notes.map((x, i) => ({
            ...x,
            position: new Rational(i),
            length: new Rational(1)
        }));
    }

    hash(): string {
        return `sp3${this.hashNotes()}`;
    }

    getNextSteps(
        ctx: CounterpointContext, s: Score
    ): { measure: CounterpointMeasure; cost: number }[] {

        const i = this.notes.findIndex((x) => x.pitch === null);
        const next: { measure: CounterpointMeasure; cost: number }[] = [];

        Debug.assert(i >= 0);
        const t = new Rational(s.parameters.measureLength * this.index + i);

        // passing tone (not on the downbeats)
        if (i !== 0 && i !== ctx.parameters.measureLength / 2) next.push(...ctx.fillIn(
            [makePassingTone, enforceVerticalConsonanceWithMoving], s, this,
            t, { isPassingTone: true },
            (p) => {
                const newNotes: Note[] = [...this.notes];
                newNotes.splice(i, 1, { pitch: p, isPassingTone: true })
                return new ThirdSpeciesMeasure(
                    this.voiceIndex, this.index, this.ctx, newNotes);
            }));

        // non-passing tone
        next.push(...ctx.fillIn(
            [enforceVerticalConsonanceStrict], s, this, t, { },
            (p) => {
                const newNotes: Note[] = [...this.notes];
                newNotes.splice(i, 1, { pitch: p })
                return new ThirdSpeciesMeasure(
                    this.voiceIndex, this.index, this.ctx, newNotes);
            }));

        return next;
    }
}

export class ThirdSpecies extends CounterpointVoice {
    clone() {
        return new ThirdSpecies(this.index, this.ctx,
            [...this.measures], this.lowerRange, this.higherRange, this.name) as this;
    }

    makeNewMeasure = (s: Score, iv: number, i: number) => {
        const notes: Note[] = [];
        for (let i = 0; i < this.ctx.parameters.measureLength; i++)
            notes.push({ pitch: null });

        return [{
            measure: new ThirdSpeciesMeasure(iv, i, this.ctx, notes),
            cost: 0,
        }];
    };
}
