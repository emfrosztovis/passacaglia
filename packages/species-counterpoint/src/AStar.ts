import { PriorityQueue } from '@js-sdsl/priority-queue';
import { Debug } from 'common';

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
    cost: number;
};

export function aStar<N extends AStarNode>(start: N): AStarResult<N> | null {
    const open = new PriorityQueue<{ node: N, f: number }>([], (a, b) => a.f - b.f);
    const closed = new Set<string>();

    const gScore = new Map<string, number>();
    const cameFrom = new Map<string, N>();

    const startHash = start.hash();
    gScore.set(startHash, 0);
    open.push({ node: start, f: start.getHeuristicCost() });

    let counter = 0;

    while (open.length > 0) {
        const current = open.pop()!.node;
        const currentHash = current.hash();
        const currentG = gScore.get(currentHash)!;

        if (current.isGoal)
            return { path: reconstructPath(cameFrom, current), cost: currentG };

        closed.add(currentHash);

        for (const { node: neighbor, cost } of current.getNeighbors()) {
            const neighborHash = neighbor.hash();

            if (closed.has(neighborHash)) {
                // We already finalized this node
                continue;
            }

            const knownG = gScore.get(neighborHash);
            const tentativeG = currentG + cost;

            if (knownG === undefined || tentativeG < knownG) {
                gScore.set(neighborHash, tentativeG);
                cameFrom.set(neighborHash, current);

                const f = tentativeG + neighbor.getHeuristicCost();
                open.push({ node: neighbor as N, f });
            }
        }

        if (counter % 500 == 0) {
            Debug.info(`counter=${counter}`);
        }
        counter++;
        // if (counter > 10000) break;
    }

    return null; // No path found
}

function reconstructPath<N extends AStarNode>(
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
