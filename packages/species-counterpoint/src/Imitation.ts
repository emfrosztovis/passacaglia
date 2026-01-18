import { Debug, Rational } from "common";
import { CounterpointMeasure, CounterpointMeasureCursor, CounterpointNoteCursor, CounterpointVoice, emptyMelodicContext, MelodicContext, MelodicSettings, Step, VoiceConstructor } from "./Basic";
import { Score } from "./Score";
import { CandidateRule, CounterpointContext } from "./Context";
import { Measure, NonHarmonicType, Note } from "./Voice";
import { H } from "./Internal";

export class EmptyImitationMeasure extends CounterpointMeasure {
    readonly writablePosition = null;

    constructor(
        ctx: CounterpointContext,
        mc: MelodicContext,
        private targetVoice: number,
        private targetMeasure: number,
    ) {
        super([new Note(ctx.parameters.measureLength)], ctx, mc);
    }

    getNextSteps(): Step[] {
        Debug.assert(false);
    }

    hash(): string {
        return `imit:${this.targetVoice}-${this.targetMeasure}`;
    }
}

const fixed: (p: H.Pitch[]) => CandidateRule = (p) => (_ctx, _s, _cur, c) => {
    Debug.assert(c !== null);
    return c.filter((x) => !!p.find((y) => y.equals(x)));
};

export class ImitationMeasure extends CounterpointMeasure {
    readonly writablePosition: Rational | null;

    constructor(
        ctx: CounterpointContext,
        mc: MelodicContext,
        private targetVoice: number,
        private targetMeasure: number,
        private target: readonly Note[],
        private filled: Note[] = [],
        private transform: (p: H.Pitch) => H.Pitch[]
    ) {
        super(
            target.map((x, i) =>
                i < filled.length ? filled[i] : new Note(x.duration)),
            ctx, mc
        );

        this.writablePosition = filled.length < target.length
            ? filled.reduce((p, c) => c.duration.add(p), Rational.from(0))
            : null;
    }

    #fill(n: Note) {
        return new ImitationMeasure(this.ctx,
            this.ctx.updateMelodicContext(this.melodicContext, n.pitch),
            this.targetVoice, this.targetMeasure,
            this.target, [...this.filled, n], this.transform
        )
    }

    getNextSteps(s: Score, c: CounterpointMeasureCursor): Step[] {
        // @ts-expect-error
        const cThis: CounterpointNoteCursor =
            this.at(this.filled.length)
            // @ts-expect-error
            ?.withParent(c);
        Debug.assert(cThis !== undefined);

        const note = this.target.at(this.filled.length);
        Debug.assert(note !== undefined);

        if (note.pitch === null) {
            return [{
                measure: this.#fill(note),
                advanced: note.duration,
                cost: 0
            }];
        }

        const next: Step[] = [];
        const pitches = this.transform(note.pitch);

        if (note.type == 'suspension') {
            // must use suspension too
            next.push(...this.ctx.fillIn(
                [fixed(pitches), ...this.ctx.nonHarmonicToneRules['suspension']!],
                s, cThis, 'suspension', (n) => this.#fill(n)));
            return next;
        }

        // try nonharmonic
        if (this.filled.length > 0) {
            for (const [t, r] of Object.entries(this.ctx.nonHarmonicToneRules)) {
                // if (t == 'suspension') continue;s
                next.push(...this.ctx.fillIn(
                    [fixed(pitches), ...r], s, cThis, t as NonHarmonicType,
                    (n) => this.#fill(n)));
            }
        }

        // try harmonic
        next.push(...this.ctx.fillIn(
            [fixed(pitches), ...this.ctx.harmonicToneRules], s, cThis, undefined,
            (n) => this.#fill(n)));

        return next;
    }

    hash(): string {
        return `imit:${this.targetVoice}-${this.targetMeasure}:${this.hashNotes}`;
    }
}

export function defineImitation(
    m: MelodicSettings,
    targetVoice: number,
    delay: number,
    transform: (p: H.Pitch) => H.Pitch[]
): VoiceConstructor {
    return class Imitation extends CounterpointVoice {
        get melodySettings() {
            return m;
        }

        clone(): this {
            return new Imitation(this.index, this.ctx, [...this.elements],
                this.lowerRange, this.higherRange, this.name, this.clef) as this;
        }

        makeNewMeasure = (score: Score, c: CounterpointMeasureCursor) => {
            const mc = c.prevGlobal()?.value.melodicContext ?? emptyMelodicContext();

            const targetMeasure = c.index - delay;
            let measure: Measure | undefined;
            if (targetMeasure >= 0)
                measure = score.voices[targetVoice].at(targetMeasure)?.value;

            let newMeasure: CounterpointMeasure;
            if (!measure)
                newMeasure = new EmptyImitationMeasure(this.ctx, mc, targetVoice, targetMeasure);
            else
                newMeasure = new ImitationMeasure(this.ctx, mc,
                    targetVoice, targetMeasure,
                    measure.elements, [], transform);

            return [{ measure: newMeasure, cost: 0 }];
        }

        replaceMeasure(i: number, m: CounterpointMeasure): this {
            const e = [...this.elements];
            e.splice(i, 1, m);
            return new Imitation(this.index, this.ctx, e,
                this.lowerRange, this.higherRange, this.name, this.clef) as this;
        }
    }
}
