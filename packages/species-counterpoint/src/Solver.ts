import { PriorityQueue } from "@js-sdsl/priority-queue";
import { Score } from "./Score";
import { CounterpointContext } from "./Context";
import { Debug, HashMap, shuffle } from "common";
import { CounterpointMeasureCursor, CounterpointVoice } from "./Basic";
import { ChordCursor } from "./Chord";

export type CounterpointSolverRewardStrategy = {
    type: 'lexicographical'
} | {
    type: 'constant',
    value: number
}
// | {
//     type: 'adaptive',
//     factor: number,
//     power: number
// };

export type CounterpointSolverProgress = {
    measureIndex: number,
    totalMeasures: number,
    iteration: number,
    // ...
}

class Node {
    readonly isGoal: boolean;
    #hash: string;
    #target: {
        chord: ChordCursor
    } | {
        measures: CounterpointMeasureCursor[]
    } | undefined;

    #findWritable() {
        const ch = this.score.harmony.at(this.measureIndex);
        Debug.assert(ch !== undefined);
        if (!ch.value.chord && this.ctx.harmonyRules.length > 0)
            this.#target = { chord: ch };
        else {
            const measures: CounterpointMeasureCursor[] = [];
            for (let i = 0; i < this.score.voices.length; i++) {
                const v = this.score.voices[i];
                if (!(v instanceof CounterpointVoice)) continue;
                const m = v.at(this.measureIndex);
                if (!m || !m.value.writable) continue;
                measures.push(m);
            }
            if (measures.length > 0)
                this.#target = { measures };
        }
    }

    constructor(
        public score: Score,
        private ctx: CounterpointContext,
        readonly measureIndex: number,
        readonly nStep: number,
        readonly cost: number,
    ) {
        this.#hash = score.hash();

        this.isGoal = false;
        while (this.measureIndex < ctx.targetMeasures) {
            this.#findWritable();
            if (this.#target) return;
            this.measureIndex++;
        }
        this.isGoal = true;
    }

    getNeighbors(): Node[] {
        Debug.assert(this.#target !== undefined);

        if ('chord' in this.#target) {
            // find harmony
            const candidates = this.ctx.getChordCandidates(
                this.score, this.#target.chord);
            return [...candidates.entries()].map(([chord, cost]) => {
                const newHarmony = this.score.harmony.replaceChord(this.measureIndex, chord);
                const newScore = this.score.replaceHarmony(newHarmony);
                // Debug.trace(`${this.measureIndex} -> ${chord.toString()}`);
                return new Node(newScore, this.ctx,
                    this.measureIndex,
                    this.nStep + 1,
                    this.cost + cost);
            });
        }

        return this.#target.measures.flatMap((x) => {
            const voice = x.container;
            const nexts = x.value.getNextSteps(this.score, x);

            const result = nexts.flatMap(({ measure, advanced, cost }) => {
                const newVoice = voice.replaceMeasure(x.index, measure);
                const newScore = this.score.replaceVoice(voice.index, newVoice);

                if (this.ctx.globalRules.find((x) => x(this.ctx, newScore) !== null))
                    return [];
                else {
                    return new Node(newScore, this.ctx,
                        this.measureIndex,
                        this.nStep + advanced.value(),
                        this.cost + cost);
                }
            });
            return result;
        });
    }

    hash(): string {
        return this.#hash;
    }
}

export class CounterpointSolver {
    stochastic = false;
    reportInterval = 100;
    onProgress?: (p: CounterpointSolverProgress) => void;

    #open?: PriorityQueue<Node>;
    #closed?: HashMap<Node>;

    constructor(private ctx: CounterpointContext) {}

    beamSearch(s: Score, size: number) {
        this.#open = new PriorityQueue<Node>([], (a, b) => a.cost - b.cost);
        this.#closed = new HashMap<Node>();

        this.#open.push(new Node(s, this.ctx, 0, 0, 0));

        let counter = 0;
        let measureIndex = 0;
        while (!this.#open.empty()) {
            const nexts = new PriorityQueue<Node>([], (a, b) => a.cost - b.cost);
            while (nexts.size() < size) {
                const current = this.#open.pop();
                if (!current) break;

                if (current.isGoal)
                    return current.score;

                if (current.measureIndex != measureIndex) {
                    measureIndex = current.measureIndex;
                    this.onProgress?.({
                        measureIndex,
                        totalMeasures: this.ctx.targetMeasures,
                        iteration: counter,
                    });
                }

                const neighbors = this.stochastic
                    ? shuffle(current.getNeighbors())
                    : current.getNeighbors();

                for (const neighbor of neighbors)
                    nexts.push(neighbor);
            }
            this.#open = nexts;
        }
        return null;
    }

    aStar(s: Score, strategy: CounterpointSolverRewardStrategy = { type: 'lexicographical' }) {
        let cmp: (a: Node, b: Node) => number;
        switch (strategy.type) {
            case "lexicographical":
                cmp = (a, b) => (b.measureIndex - a.measureIndex) || (a.cost - b.cost);
                break;
            case "constant": {
                const f = strategy.value;
                cmp = (a, b) => (a.cost - f * a.nStep) - (b.cost - f * b.nStep);
                break;
            }
            default:
                Debug.never(strategy);
        }

        this.#open = new PriorityQueue<Node>([], cmp);
        this.#closed = new HashMap<Node>();

        this.#open.push(new Node(s, this.ctx, 0, 0, 0));

        let counter = 0;
        let measureIndex = 0;

        while (this.#open.length > 0) {
            const current = this.#open.pop()!;
            if (current.isGoal)
                return current.score;

            this.#closed.set(current);

            const neighbors = this.stochastic
                ? shuffle(current.getNeighbors())
                : current.getNeighbors();

            for (const neighbor of neighbors) {
                // skip if we already finalized this node
                if (this.#closed.has(neighbor)) continue;
                this.#open.push(neighbor);
            }

            if (current.measureIndex != measureIndex) {
                measureIndex = current.measureIndex;
                this.onProgress?.({
                    measureIndex,
                    totalMeasures: this.ctx.targetMeasures,
                    iteration: counter,
                });
            }
            counter++;
        }

        return null; // No path found
    }
}
