import { Debug, Rational } from "common";
import { H, Measure, Note, PC, Score } from "./Common";
import { CounterpointContext } from "./Context";
import { CounterpointMeasure, CounterpointVoice } from "./Basic";

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
    ): { measure: CounterpointMeasure; cost: number; heuristic?: number; }[] {
        Debug.assert(this.p0 === null);

        const voice = s.voices[this.voiceIndex];
        if (!(voice instanceof CounterpointVoice)) return [];

        const candidates = cxt.scale.getDegreesInRange(voice.lowerRange, voice.higherRange);
        const t = new Rational(s.parameters.measureLength * this.index);
        const previous = s.noteBefore(t, this.voiceIndex)?.pitch;

        const otherPitches: H.Pitch[] = [];
        for (let i = 0; i < s.voices.length; i++) {
            if (i == this.voiceIndex) continue;
            const n = s.noteAt(t, i);
            if (!n?.pitch) continue;
            otherPitches.push(n.pitch);
        }

        return candidates.flatMap((x) => {
            const p = x.toPitch();
            if (previous && p.equals(previous)) return [];

            if (otherPitches.find((x) => !['P1', 'm3', 'M3', 'P5', 'm6', 'M6']
                .includes(x.intervalTo(p).toSimple().toAbbreviation()))) return [];

            const m = new WholeNoteMeasure(this.voiceIndex, this.index, this.ctx, p);
            const newScore = s.replaceMeasure(this.voiceIndex, this.index, m);
            if (cxt.localRules.find((x) => x(this.ctx, newScore, this.voiceIndex, t) !== null))
                return [];
            return {
                measure: m,
                cost: 1,
                heuristic: 0 //p.absoluteIntervalTo(cxt.scale.root as H.Pitch).steps
            };
        });
    }
}

export class FirstSpecies extends CounterpointContext {
    makeNewMeasure(
        s: Score, iv: number, i: number
    ): { measure: CounterpointMeasure; cost: number; }[] {
        return [{
            measure: new WholeNoteMeasure(iv, i, this),
            cost: 0,
        }]
    }
}
