import { PriorityQueue } from '@js-sdsl/priority-queue';

export interface AStarNode {
    readonly isGoal: boolean;

    getNeighbors(): {
        node: AStarNode,
        cost: number
    }[];

    getHeuristicCost(): number

    hash(): string;
};

export type AStarResult<N extends AStarNode> = {
    path: N[],
    result: N,
    cost: number;
};

export type AStarProgress<N extends AStarNode> = {
    current: N,
    iteration: number
};

export class AStar<N extends AStarNode> {
    onProgress?: (p: AStarProgress<N>) => void;

    #open = new PriorityQueue<{ node: N, f: number }>([], (a, b) => a.f - b.f);
    #closed = new Set<string>();
    #gScore = new Map<string, number>();

    constructor(start: N) {
        const startHash = start.hash();
        this.#gScore.set(startHash, 0);
        this.#open.push({ node: start, f: start.getHeuristicCost() });
    }

    search(): AStarResult<N> | null {
        const cameFrom = new Map<string, N>();
        let counter = 0;

        while (this.#open.length > 0) {
            const current = this.#open.pop()!.node;
            const currentHash = current.hash();
            const currentG = this.#gScore.get(currentHash)!;

            if (current.isGoal)
                return {
                    path: this.reconstructPath(cameFrom, current),
                    result: current,
                    cost: currentG
                };

            this.#closed.add(currentHash);

            for (const { node: neighbor, cost } of current.getNeighbors()) {
                const neighborHash = neighbor.hash();

                if (this.#closed.has(neighborHash)) {
                    // We already finalized this node
                    continue;
                }

                const knownG = this.#gScore.get(neighborHash);
                const tentativeG = currentG + cost;

                if (knownG === undefined || tentativeG < knownG) {
                    this.#gScore.set(neighborHash, tentativeG);
                    cameFrom.set(neighborHash, current);

                    const f = tentativeG + neighbor.getHeuristicCost();
                    this.#open.push({ node: neighbor as N, f });
                }
            }

            this.onProgress?.({
                current, iteration: counter
            });
            counter++;
        }

        return null; // No path found
    }

    private reconstructPath(
        cameFrom: Map<string, N>,
        goal: N
    ): N[] {
        const path: N[] = [goal];
        let cur = goal;

        while (true) {
            const parent = cameFrom.get(cur.hash());
            if (!parent) break;
            path.push(parent);
            cur = parent;
        }

        return path.reverse();
    }
}
