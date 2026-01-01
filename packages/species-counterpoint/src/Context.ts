import { Debug, shuffle } from "common";
import { AStar, AStarNode } from "./AStar";
import { Score, Parameters, NonHarmonicType, Note } from "./Common";
import { CounterpointMeasure, CounterpointMeasureCursor, CounterpointNoteCursor, CounterpointVoice, MelodicContext } from "./Basic";
import { HashMap } from "common";
import { parsePreferred } from "./rules/Scales";
import { H } from "./Internal";

export type LocalRule = (
    ctx: CounterpointContext, s: Score, current: CounterpointNoteCursor
) => number;

export type GlobalRule = (
    ctx: CounterpointContext, s: Score
) => string | null;

export type CandidateRule = (
    ctx: CounterpointContext, s: Score, current: CounterpointNoteCursor,
    candidates: HashMap<H.Pitch, number> | null, type?: NonHarmonicType
) => HashMap<H.Pitch, number>;

export class CounterpointContext {
    localRules: LocalRule[] = [];
    globalRules: GlobalRule[] = [];
    candidateRules: CandidateRule[] = [];

    nonHarmonicToneRules: Partial<Record<NonHarmonicType, CandidateRule[]>> = {};
    harmonicToneRules: CandidateRule[] = [];

    advanceReward = 20;
    similarMotionCost = 10;
    obliqueMotionCost = 0;
    contraryMotionCost = -10;

    harmonyIntervals = parsePreferred(
        ['m3', 0], ['M3', 0], ['m6', 0], ['M6', 0], ['P4', 10], ['P5', 20], ['P8', 50], ['P1', 100]);

    melodicIntervals = parsePreferred(
        ['m2',    0], ['M2',    0], ['-m2',  30], ['-M2',  30],
        ['m3',   50], ['M3',   50], ['-m3',  50], ['-M3',  50],
        ['P4',   60],               ['-P4',  60],
        ['P5',   60],               ['-P5',  60],
        ['m6',   70], ['M6',   70], ['-m6',  70], ['-M6',  70],
        ['P8',   80],               ['-P8',  80],
        ['P1', 100],
    );

    forbidWithBass = [H.Interval.parse('P4')!];
    allowUnison = false;

    stochastic = false;

    updateMelodicContext(old: MelodicContext, p: H.Pitch): MelodicContext {
        if (old.lastPitch === undefined) return {
            ...old,
            lastPitch: p
        };
        const int = old.lastPitch.intervalTo(p);
        if (int.steps <= 1) {
            // clear leaps
            return {
                lastPitch: p,
                leapDirection: 0,
                nConsecutiveLeaps: 0,
                n3rdLeaps: 0,
                nUnidirectionalConsecutiveLeaps: 0,
                nUnidirectional3rdLeaps: 0
            };
        }
        const isThird = int.steps == 2;
        const isUnidirectional = int.sign == old.leapDirection;
        return {
            lastPitch: p,
            leapDirection: int.sign,
            nConsecutiveLeaps: old.nConsecutiveLeaps + 1,
            n3rdLeaps: old.n3rdLeaps + (isThird ? 1 : 0),
            nUnidirectionalConsecutiveLeaps: isUnidirectional
                ? old.nUnidirectionalConsecutiveLeaps + 1
                : 0,
            nUnidirectional3rdLeaps: isUnidirectional
                ? old.nUnidirectional3rdLeaps + (isThird ? 1 : 0)
                : 0,
        };
    }

    getCandidates(
        rules: CandidateRule[], s: Score, current: CounterpointNoteCursor,
        type?: NonHarmonicType
    ) {
        let candidates: HashMap<H.Pitch, number> | null = null;
        for (const rule of [...this.candidateRules, ...rules]) {
            candidates = rule(this, s, current, candidates, type);
            if (candidates.size == 0) return candidates;
        }
        Debug.assert(candidates !== null);
        return candidates;
    }

    fillNonHarmonicTone(
        types: NonHarmonicType[],
        s: Score, note: CounterpointNoteCursor,
        create: (n: Note, p: H.Pitch) => CounterpointMeasure,
        costOffset = 0
    ){
        const results: {
            measure: CounterpointMeasure;
            cost: number;
        }[] = [];

        for (const type of types) {
            const rules = this.nonHarmonicToneRules[type];
            if (!rules) {
                Debug.info('no rules for', type);
                continue;
            }
            results.push(...this.fillIn(rules, s, note, type, create, costOffset));
        }

        return results;
    }

    fillHarmonicTone(
        s: Score, note: CounterpointNoteCursor,
        create: (n: Note, p: H.Pitch) => CounterpointMeasure,
        costOffset = 0
    ){
        return this.fillIn(this.harmonicToneRules, s, note, undefined, create, costOffset);
    }

    private fillIn(
        rules: CandidateRule[],
        s: Score, note: CounterpointNoteCursor,
        type: NonHarmonicType | undefined,
        create: (n: Note, p: H.Pitch) => CounterpointMeasure,
        costOffset = 0,
    ) {
        const measure = note.parent;
        const voice = measure.container;
        const candidates = [...this.getCandidates(rules, s, note, type).entries()];

        return candidates.flatMap(([p, cost]) => {
            const m = create(new Note(note.duration, p, type), p);
            const newVoice = voice.replaceMeasure(measure.index, m);
            const newScore = s.replaceVoice(voice.index, newVoice);
            const newCursor = newVoice.noteAt(note.globalTime) as CounterpointNoteCursor;
            Debug.assert(newCursor !== undefined);
            for (const rule of this.localRules) {
                const c = rule(this, newScore, newCursor);
                if (c == Infinity) return [];
                cost += c;
            }
            return { measure: m, cost: cost + costOffset };
        });
    }

    constructor(
        public readonly targetMeasures: number,
        public readonly parameters: Parameters,
    ) {}

    solve(s: Score) {
        const ctx = this;
        let progress = 0;
        let stochastic = this.stochastic;

        class Node implements AStarNode {
            readonly isGoal: boolean;
            #hash: string;
            #writables: CounterpointMeasureCursor[];

            #findWritable() {
                for (let i = 0; i < this.score.voices.length; i++) {
                    const v = this.score.voices[i];
                    if (!(v instanceof CounterpointVoice)) continue;
                    const m = v.at(this.measureIndex);
                    if (!m || !m.value.writable) continue;
                    this.#writables.push(m);
                }
            }

            constructor(
                public score: Score,
                readonly measureIndex: number,
                readonly hCost: number,
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
                    const voice = x.container;
                    const nexts = x.value.getNextSteps(this.score, x);

                    const debug: [number, string][] = [];
                    const result = nexts.flatMap(({ measure, cost }) => {
                        const newVoice = voice.replaceMeasure(x.index, measure);
                        const newScore = this.score.replaceVoice(voice.index, newVoice);

                        if (ctx.globalRules.find((x) => x(ctx, newScore) !== null))
                            return [];
                        else {
                            debug.push([cost, measure.hash()]);
                            return {
                                node: new Node(newScore,
                                    this.measureIndex, this.hCost - ctx.advanceReward),
                                cost
                            };
                        }
                    });
                    // Debug.trace(voice.name, '[', x.index, ']:', x.value.hash(), '->',
                    //     debug.sort((a, b) => a[0] - b[0]).join(' / '));
                    return stochastic ? shuffle(result) : result;
                });
            }

            hash(): string {
                return this.#hash;
            }

            getHeuristicCost(): number {
                return this.hCost;
            }
        }
        return new AStar(new Node(s, 0, 0));
    }
}
