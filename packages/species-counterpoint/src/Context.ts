import { Debug, Rational } from "common";
import { aStar, AStarNode } from "./AStar";
import { Score, H, Parameters } from "./Common";
import { CounterpointMeasure, CounterpointVoice } from "./Basic";

export type LocalRule = (
    ctx: CounterpointContext, s: Score, iv: number, t: Rational
) => string | null;

export type GlobalRule = (
    ctx: CounterpointContext, s: Score
) => string | null;

export abstract class CounterpointContext {
    localRules: LocalRule[] = [];
    globalRules: GlobalRule[] = [];
    advanceReward = 1;

    abstract makeNewMeasure(s: Score, iv: number, i: number): {
        measure: CounterpointMeasure,
        cost: number
    }[];

    // abstract chooseNextVoice(s: Score, im: number): number;

    constructor(
        public readonly scale: H.Scale,
        public readonly targetMeasures: number,
        public readonly parameters: Parameters,
    ) {}

    solve(s: Score) {
        const ctx = this;
        let i = 0;
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

                if (i % 100 == 0)
                    Debug.info(`node #${i}, at im ${measureIndex}`);
                i++;

                this.isGoal = false;
                while (this.measureIndex <= ctx.targetMeasures) {
                    this.#findWritable();
                    if (this.#writables.length > 0) return;
                    this.measureIndex++;
                }
                this.isGoal = true;
            }

            getNeighbors(): { node: AStarNode; cost: number; }[] {
                return this.#writables.flatMap((x) => {
                    const nexts = x.getNextSteps(ctx, this.score);
                    return nexts.flatMap(({ measure, cost, heuristic = 0 }) => {
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
