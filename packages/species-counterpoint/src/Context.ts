import { Debug, Rational } from "common";
import { aStar, AStarNode } from "./AStar";
import { Score, H, Parameters, NoteAttributes } from "./Common";
import { CounterpointMeasure, CounterpointVoice } from "./Basic";
import { HashMap } from "common";
import { enforceScaleTones, parsePreferred } from "./rules/CandidateRules";

export type LocalRule = (
    ctx: CounterpointContext, s: Score, v: CounterpointVoice, t: Rational
) => string | null;

export type GlobalRule = (
    ctx: CounterpointContext, s: Score
) => string | null;

export type CandidateRule = (
    ctx: CounterpointContext, s: Score, v: CounterpointVoice, t: Rational,
    candidates: HashMap<H.Pitch, number> | null, attr: NoteAttributes
) => HashMap<H.Pitch, number>;

export class CounterpointContext {
    localRules: LocalRule[] = [];
    globalRules: GlobalRule[] = [];
    candidateRules: CandidateRule[] = [enforceScaleTones];
    advanceReward = 20;

    harmonyIntervals = parsePreferred(
        ['m3', 0], ['M3', 0], ['m6', 0], ['M6', 0], ['P4', 10], ['P5', 20], ['P1', 50]);

    melodicIntervals = parsePreferred(
        ['m2',    0], ['M2',    0], ['-m2',  30], ['-M2',  30],
        ['m3',   30], ['M3',   30], ['-m3',  30], ['-M3',  30],
        ['P4',   40],               ['-P4',  40],
        ['P5',   40],               ['-P5',  40],
        ['m6',   50], ['M6',   50], ['-m6',  50], ['-M6',  50],
        ['P8',   60],               ['-P8',  60],
        ['P1',  100],
    );

    forbidWithBass = [H.Interval.parse('P4')!];

    allowChromaticPassingTones = false;

    allowUnison = false;

    getCandidates(
        rules: CandidateRule[], s: Score, v: CounterpointVoice, t: Rational,
        attr: NoteAttributes
    ) {
        let candidates: HashMap<H.Pitch, number> | null = null;
        for (const r of [...this.candidateRules, ...rules]) {
            candidates = r(this, s, v, t, candidates, attr);
            if (candidates.size == 0) return candidates;
        }
        Debug.assert(candidates !== null);
        return candidates;
    }

    fillIn(
        rules: CandidateRule[],
        s: Score, m: CounterpointMeasure, t: Rational,
        attr: NoteAttributes,
        create: (p: H.Pitch) => CounterpointMeasure,
        costOffset = 0,
    ) {
        const voice = s.voices[m.voiceIndex];
        Debug.assert(voice instanceof CounterpointVoice);
        const candidates = [...this.getCandidates(rules, s, voice, t, attr).entries()];

        return candidates.flatMap(([p, cost]) => {
            const m = create(p);
            const newScore = s.replaceMeasure(m.voiceIndex, m.index, m);
            if (this.localRules.find(
                (x) => x(this, newScore, voice, t) !== null)) return [];
            return { measure: m, cost: cost + costOffset };
        });
    }

    constructor(
        public readonly scale: H.Scale,
        public readonly targetMeasures: number,
        public readonly parameters: Parameters,
    ) {}

    solve(s: Score) {
        const ctx = this;
        let progress = 0;

        class Node implements AStarNode {
            readonly isGoal: boolean;
            #hash: string;
            #writables: CounterpointMeasure[];

            #findWritable() {
                for (let i = 0; i < this.score.voices.length; i++) {
                    const v = this.score.voices[i];
                    if (!(v instanceof CounterpointVoice)) continue;
                    const m = v.measures[this.measureIndex];
                    if (!m || !m.writable) continue;
                    this.#writables.push(m);
                }
            }

            constructor(
                public score: Score,
                private measureIndex: number,
                private hCost: number,
            ) {
                this.#hash = score.hash();
                this.#writables = [];

                this.isGoal = false;
                while (this.measureIndex <= ctx.targetMeasures) {
                    this.#findWritable();
                    if (this.#writables.length > 0) return;
                    this.measureIndex++;
                    if (measureIndex > progress) {
                        progress = measureIndex;
                        Debug.info('progress ->', progress);
                    }
                }
                this.isGoal = true;
            }

            getNeighbors(): { node: AStarNode; cost: number; }[] {
                return this.#writables.flatMap((x) => {
                    const nexts = x.getNextSteps(ctx, this.score);
                    return nexts.flatMap(({ measure, cost }) => {
                        const newScore = this.score.replaceMeasure(
                            x.voiceIndex, this.measureIndex, measure);

                        if (ctx.globalRules.find((x) => x(ctx, newScore) !== null))
                            return [];
                        else return {
                            node: new Node(newScore,
                                this.measureIndex, this.hCost - ctx.advanceReward),
                            cost
                        };
                    })
                });
            }

            hash(): string {
                return this.#hash;
            }

            getHeuristicCost(): number {
                return this.hCost;
            }
        }
        const result = aStar(new Node(s, 0, 0));
        if (!result) return null;
        return result.path.at(-1)!.score;
    }
}
