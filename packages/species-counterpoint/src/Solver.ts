import { PriorityQueue } from "@js-sdsl/priority-queue";
import { Score } from "./Score";
import { CounterpointContext } from "./Context";
import { Debug, Hashable, HashMap, shuffle } from "common";
import { CounterpointMeasureCursor, CounterpointVoice } from "./Basic";
import { ChordCursor } from "./Chord";

export type CounterpointSolverRewardStrategy = {
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
    furthest: number,
    totalMeasures: number,
    iteration: number,
    // ...
}

const POWER = 0.9;

export interface INode extends Hashable {
    readonly id: number;
    readonly isGoal: boolean;
    readonly score: Score;
    readonly measureIndex: number,
    readonly voiceIndex?: number,
    readonly nStep: number,
    readonly cost: number,
    readonly thisCost: number,
    readonly nExpanded?: number,
}

export type VisitedData = {
    children: INode[],
};

class Node implements INode {
    static id = 0;

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

    readonly id: number;
    nExpanded?: number;

    constructor(
        public score: Score,
        private ctx: CounterpointContext,
        readonly measureIndex: number,
        readonly voiceIndex: number | undefined,
        readonly nStep: number,
        readonly cost: number,
        readonly thisCost: number,
    ) {
        this.#hash = score.hash();

        this.id = Node.id;
        Node.id++;

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
            const nexts = this.ctx.getChordCandidates(this.score, this.#target.chord);

            return [...nexts.entries()].map(([chord, cost]) => {
                const newHarmony = this.score.harmony.replaceChord(this.measureIndex, chord);
                const newScore = this.score.replaceHarmony(newHarmony);

                return new Node(newScore, this.ctx,
                    this.measureIndex, -1, this.nStep,
                    this.cost * POWER + cost, cost);
            });
        }

        return this.#target.measures.reverse().flatMap((x) => {
            const voice = x.container;
            const nexts = x.value.getNextSteps(this.score, x);

            const result = nexts.flatMap(({ measure, advanced, cost }) => {
                const newVoice = voice.replaceMeasure(x.index, measure);
                const newScore = this.score.replaceVoice(voice.index, newVoice);

                if (this.ctx.globalRules.find((x) => x(this.ctx, newScore) !== null))
                    return [];
                else {
                    return new Node(newScore, this.ctx,
                        this.measureIndex, voice.index, this.nStep + advanced.value(),
                        this.cost * Math.pow(POWER, advanced.value()) + cost, cost);
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
    limitSteps = -1;
    batch = 5;
    removeOld = 2; // remove old nodes that are this many measures away
    reportInterval = 1000;
    onProgress?: (p: CounterpointSolverProgress) => void;

    #open?: PriorityQueue<Node>;
    #parents?: HashMap<Node, Node>;
    #start?: Node;

    get parents(): HashMap<INode, INode> | undefined {
        return this.#parents;
    }

    get startNode(): INode | undefined {
        return this.#start;
    }

    constructor(private ctx: CounterpointContext) {}

    aStar(s: Score, strategy: CounterpointSolverRewardStrategy) {
        let cmp: (a: Node, b: Node) => number;
        switch (strategy.type) {
            case "constant": {
                const f = strategy.value;
                cmp = (a, b) => (a.cost - f * a.nStep) - (b.cost - f * b.nStep);
                break;
            }
            default:
                Debug.never(strategy.type);
        }

        this.#open = new PriorityQueue<Node>([], cmp);
        this.#parents = new HashMap<Node, Node>();

        this.#start = new Node(s, this.ctx, 0, -1, 0, 0, 0);
        this.#open.push(this.#start);

        let progress = 0;
        let furthest = 0;

        let nNeighbor = 0;
        let nNode = 0;
        let nSkipped = 0;

        while (this.#open.length > 0) {
            const newNodes: Node[] = [];
            for (let i = 0; i < this.batch; i++) {
                const current = this.#open.pop();
                if (!current) break;

                if (current.isGoal) {
                    const avgNeighbor = nNeighbor / nNode;
                    Debug.trace(nNode, nNeighbor, nSkipped,
                        avgNeighbor.toFixed(5),
                        (Math.log2(nNode) / Math.log2(avgNeighbor)).toFixed(5));
                    return current.score;
                }

                if (current.measureIndex < furthest - this.removeOld)
                    continue;

                if (current.measureIndex > furthest)
                    furthest = current.measureIndex;

                if (current.measureIndex != progress || nNode % this.reportInterval == 0) {
                    progress = current.measureIndex;
                    this.onProgress?.({
                        measureIndex: progress, furthest,
                        totalMeasures: this.ctx.targetMeasures,
                        iteration: nNode,
                    });
                }

                if (nNode % (this.reportInterval * 10) == 0) {
                    const avgNeighbor = nNeighbor / nNode;
                    Debug.trace(nNode, nNeighbor, nSkipped,
                        avgNeighbor.toFixed(5),
                        (Math.log2(nNode) / Math.log2(avgNeighbor)).toFixed(5));
                }

                const neighbors = current
                    .getNeighbors()
                    .filter((x) => !this.#parents?.has(x));
                newNodes.push(...neighbors);
                neighbors.forEach((x) => this.#parents?.set(x, current));
                current.nExpanded = neighbors.length;

                nNode++;
                nNeighbor += neighbors.length;

                if (this.limitSteps > 0 && nNode > this.limitSteps)
                    return null;
            }
            newNodes.forEach((x) => this.#open!.push(x));
        }

        return null; // No path found
    }
}
