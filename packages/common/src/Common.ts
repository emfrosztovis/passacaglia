export interface Hashable {
    hash(): string;
}

export class HashMap<P extends Hashable, V = void> {
    #map = new Map<string, [P, V]>();

    constructor(it?: Iterable<[P, V]>) {
        if (it) for (const p of it)
            this.add(...p);
    }

    get size() {
        return this.#map.size;
    }

    get(k: P) {
        return this.#map.get(k.hash())?.[1];
    }

    clone(): HashMap<P, V> {
        return new HashMap(this.entries());
    }

    filter(pred: (p: P, v: V) => boolean): this {
        for (const [k, [p, v]] of this.#map.entries()) {
            if (!pred(p, v)) this.#map.delete(k);
        }
        return this;
    }

    intersectWith(s: HashMap<P, V>, combine?: (a: V, b: V) => V): this {
        for (const [k, [p, v]] of this.#map.entries()) {
            if (!s.#map.has(k)) this.#map.delete(k);
            else if (combine)
                this.#map.set(k, [p, combine(v, s.#map.get(k)![1])]);
        }
        return this;
    }

    unionWith(s: HashMap<P, V>, combine?: (a: V, b: V) => V): this {
        for (const [k, [p, v]] of s.#map) {
            if (combine && this.#map.has(k))
                this.#map.set(k, [p, combine(this.#map.get(k)![1], v)]);
            else
                this.#map.set(k, [p, v]);
        }
        return this;
    }

    difference(s: HashMap<P, V>) {
        const diff = new HashMap<P, V>();
        for (const [k, v] of this.#map)
            if (!s.#map.has(k)) diff.#map.set(k, v);
        for (const [k, v] of s.#map)
            if (!this.#map.has(k)) diff.#map.set(k, v);
        return diff;
    }

    add(p: P, v: V) {
        this.#map.set(p.hash(), [p, v]);
    }

    delete(p: P) {
        return this.#map.delete(p.hash());
    }

    has(p: P) {
        return this.#map.has(p.hash());
    }

    entries() {
        return this.#map.values();
    }
}
