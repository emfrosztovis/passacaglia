import { Debug } from "common";
import type Graph from "graphology";
import { forEachNodeInTopologicalOrder } from "graphology-dag";

export function sugiyama(g: Graph, iterations: number) {
    const layers = new Map<string, number>();

    forEachNodeInTopologicalOrder(g, (n) => {
        const parents = g.inNeighbors(n);
        if (parents.length == 0)
            layers.set(n, 0);
        else {
            layers.set(n, Math.max(...parents.map((x) => {
                Debug.assert(layers.has(x));
                return layers.get(x)!;
            })) + 1);
        }
    })

    const oldEdges = g.edges();
    let counter = 0;
    for (const e of oldEdges) {
        const u = g.source(e);
        const v = g.target(e);
        Debug.assert(layers.has(u));
        Debug.assert(layers.has(v));
        const span = layers.get(v)! - layers.get(u)!;
        if (span <= 1) break;

        let prev = u;
        for (let k = 1; k <= span; k++) {
            const name = `_sugiyama_dummy${counter}`;
            g.addNode(name);
            layers.set(name, layers.get(u)! + k);
            g.addEdge(prev, name);
            prev = name;
        }
        g.addEdge(prev, v);
    }

    const grouped: string[][] = [];
    const nLayer = Math.max(...layers.values());
    const barycenter = new Map<string, number>();

    for (const [n, l] of layers)
        if (grouped[l])
            grouped[l].push(n);
        else
            grouped[l] = [n];

    for (let it = 0; it < iterations; it++) {
        for (let i = nLayer - 1; i >= 0; i--) {
            const layer = grouped[i];
            Debug.assert(layer !== undefined);
            for (const n of layer) {
                const children = g.outNeighbors(n).map((x) =>{
                    const n = grouped[i+1]!.indexOf(x);
                    Debug.assert(n >= 0);
                    return n;
                });
                if (children.length > 0)
                    barycenter.set(n, children.reduce((a, b) => a + b, 0) / children.length);
            }
            layer.sort((a, b) => barycenter.get(a)! - barycenter.get(b)!);
        }
        for (let i = 1; i <= nLayer; i++) {
            const layer = grouped[i];
            Debug.assert(layer !== undefined);
            for (const n of layer) {
                const parents = g.inNeighbors(n).map((x) => {
                    const n = grouped[i-1]!.indexOf(x);
                    Debug.assert(n >= 0);
                    return n;
                });
                Debug.assert(parents.length > 0);
                barycenter.set(n, parents.reduce((a, b) => a + b, 0) / parents.length);
            }
            layer.sort((a, b) => barycenter.get(a)! - barycenter.get(b)!);
        }
    }

    for (let i = 0; i <= nLayer; i++) {
        const layer = grouped[i]!;
        const children = layer.map((n) => g.outNeighbors(n).length);

        let p = '';
        let y = 0, dy = 0;
        let branchHeight = 10;
        layer.forEach((n, j) => {
            g.setNodeAttribute(n, 'x', i * 30);
            const parent = g.inNeighbors(n)[0];
            if (parent && parent !== p) {
                if (p) g.setNodeAttribute(p, 'bh', branchHeight);
                branchHeight = 0;

                y = g.getNodeAttribute(parent, 'y');
                p = parent;
            } else {
                branchHeight += dy;
            }
            g.setNodeAttribute(n, 'y', y);

            dy = 10;
            if (children[j+1])
                dy += children[j+1]! * 5;
            if (children[j])
                dy += children[j]! * 5;

            y += dy;
        });
        if (p) g.setNodeAttribute(p, 'bh', branchHeight);
    }

    for (let i = 0; i <= nLayer; i++) {
        const layer = grouped[i]!;

        layer.forEach((n) => {
            const parent = g.inNeighbors(n)[0];
            if (parent) {
                const dy = (g.getNodeAttribute(parent, 'bh') ?? 0) / 2;
                g.updateNodeAttribute(n, 'y', (y) => y - dy);
                g.updateNodeAttribute(n, 'bh', (y) => y + dy * 2);
            }
        });
    }
}
