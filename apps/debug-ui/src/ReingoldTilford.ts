import type { DirectedGraph } from "graphology";
import { topologicalGenerations, topologicalSort } from "graphology-dag";

export type ReingoldTilfordOptions = {
    horizontalScale?: number;
    verticalScale?: number;
};

export function reingoldTilford(g: DirectedGraph, opts?: ReingoldTilfordOptions) {
    const sorted = topologicalSort(g);
    const sortedReverse = [...sorted].reverse();

    topologicalGenerations(g)
        .forEach((ns, i) =>
            ns.forEach((n) =>
                g.setNodeAttribute(n, 'y', - i * (opts?.horizontalScale ?? 30))));

    const xs = new Map<string, number>();
    const mods = new Map<string, number>();
    const siblingIndex = new Map<string, number>();
    const data: Record<string, {
        isLeaf: boolean,
        children: number,
        nonLeafChildren: number,
    }> = {};

    g.forEachNode((n) => {
        mods.set(n, 0);

        const parent = g.inNeighbors(n);
        if (parent.length == 0) {
            xs.set(n, 0);
        }

        let children = 0;
        let nonLeafChildren = 0;
        g.forEachOutNeighbor(n, (x) => {
            if (!g.outNeighborEntries(x).next().done || g.getNodeAttribute(x, 'color') == 'blue') {
                xs.set(x, nonLeafChildren);
                nonLeafChildren++;
            }
            siblingIndex.set(x, children);
            children++;
        });
        data[n] = {
            isLeaf: children == 0 && g.getNodeAttribute(n, 'color') !== 'blue',
            children,
            nonLeafChildren,
        };
    });

    function contour(n: string, right: boolean) {
        const result = new Map<number, number>();

        function work(n: string, sum: number, depth: number) {
            if (data[n]?.isLeaf) return;

            const old = result.get(depth);
            const newValue = xs.get(n)! + sum;
            if (old === undefined || (right ? newValue > old : newValue < old))
                result.set(depth, newValue);

            sum += mods.get(n)!;
            g.forEachOutNeighbor(n, (x) => work(x, sum, depth + 1));
        }
        work(n, 0, 0);
        return result;
    }

    function processConflicts(x: string, i: number, siblings: string[]) {
        // check for conflicts
        let shift = 0;
        const leftContour = contour(x, false);
        for (let j = 0; j < i; j++) {
            const sibling = siblings[j]!;
            const rightContour = contour(sibling, true);
            const minSize = Math.min(leftContour.size, rightContour.size);
            for (let k = 1; k < minSize; k++) {
                const distance = leftContour.get(k)! - rightContour.get(k)!;
                shift = Math.max(shift, 1 - distance);
            }
        }
        if (shift > 0) {
            xs.set(x, xs.get(x)! + shift);
            mods.set(x, mods.get(x)! + shift);

            // // center nodes between j and i
            // const desiredDistance = (xs.get(x)! - xs.get(sibling)!) / (i - j + 1);
            // for (let k = j + 1; k < i; k++) {
            //     const middle = sibling[k]!;
            //     const desired = xs.get(sibling)! + desiredDistance * (k - j);
            //     const offset = desired - xs.get(middle)!;
            //     xs.set(middle, xs.get(middle)! + offset);
            //     mods.set(middle, mods.get(middle)! + offset);
            // }

            // processConflicts(sibling, j, siblings);

            shift = 0;
        }
    }

    for (const n of sortedReverse) {
        if (data[n]?.isLeaf)
            continue;
        g.outNeighbors(n).forEach((x, i, siblings) => {
            const children = g
                .outNeighbors(x)
                .filter((x) => !data[x]?.isLeaf);
            if (children.length == 0) {
                xs.set(x, i == 0 ? 0 : xs.get(siblings[i-1]!)! + 1);
            } else {
                const desired = (xs.get(children.last()!)! + xs.get(children[0]!)!) / 2;
                if (i == 0)
                    xs.set(x, desired);
                else {
                    const new_x = xs.get(siblings[i-1]!)! + 1;
                    xs.set(x, new_x);
                    mods.set(x, new_x - desired);

                    processConflicts(x, i, siblings);
                }
            }
        });
    }

    const modsum = new Map<string, number>();
    sorted.forEach((n) => {
        const mod = mods.get(n)!;
        const sum = modsum.get(n) ?? 0;
        xs.set(n, xs.get(n)! + sum);
        g.forEachOutNeighbor(n, (x) =>
            modsum.set(x, sum + mod));
    });

    g.forEachNode((n) => {
        g.setNodeAttribute(n, 'x', xs.get(n)! * (opts?.verticalScale ?? 10));
    });


    g.forEachNode((n) => {
        if (data[n]?.isLeaf) {
            // leaf
            const parent = g.inNeighbors(n)[0]!;
            const px = g.getNodeAttribute(parent, 'y') as number;
            const py = g.getNodeAttribute(parent, 'x') as number;

            const total = data[parent]!.children;
            const angleOne = total <= 1 ? 0 : Math.PI * 0.75 / (total - 1);
            const angle = angleOne * siblingIndex.get(n)! - angleOne * ((total - 1) / 2);

            g.setNodeAttribute(n, 'y', px - Math.cos(angle) * 5);
            g.setNodeAttribute(n, 'x', py - Math.sin(angle) * 5);
            g.setNodeAttribute(n, 'size', 0.1);
        }
    });
}
