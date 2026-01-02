/**
 * Represents a hashable type. We use a lot of immutable data types; implementing `Hashable` enables them to be used in `HashMap`s.
 */
export interface Hashable {
    hash(): string;
}

/**
 * Represents a serializable type, useful for persistent storage or messaging between web workers.
 */
export interface Serializable {
    serialize(): any;
}

export type Serialized<T extends Serializable> = ReturnType<T['serialize']>;

/**
 * A generic hash map, or a hash set if `V` is `void`.
 */
export class HashMap<P extends Hashable, V = void> {
    #map = new Map<string, [P, V]>();

    constructor(it?: Iterable<[...[P, V]]>) {
        if (it) for (const p of it)
            this.set(...p);
    }

    /**
     * @returns the number of elements in the hash map.
     */
    get size() {
        return this.#map.size;
    }

    get(k: P) {
        return this.#map.get(k.hash())?.[1];
    }

    clone(): HashMap<P, V> {
        return new HashMap(this.entries());
    }

    /**
     * Filter the items based on a predicate. Will modify the hash map and return a reference to the same object.
     */
    filter(pred: (p: P, v: V) => boolean): this {
        for (const [k, [p, v]] of this.#map.entries()) {
            if (!pred(p, v)) this.#map.delete(k);
        }
        return this;
    }

    /**
     * Filter the items and update the values based on a predicate. Will modify the hash map and return a reference to the same object.
     */
    filterMap(pred: (p: P, v: V) => V | undefined): this {
        for (const [k, [p, v]] of this.#map.entries()) {
            const nv = pred(p, v);
            if (nv === undefined) this.#map.delete(k);
            else this.#map.set(k, [p, nv]);
        }
        return this;
    }

    /**
     * Intersect the entries with another hash map, keeping only keys that appear in both. Will modify the hash map and return a reference to the same object.
     * @param combine A function to merge the values from both maps to form a value in the result.
     */
    intersectWith(s: HashMap<P, V>, combine?: (a: V, b: V) => V): this {
        for (const [k, [p, v]] of this.#map.entries()) {
            if (!s.#map.has(k)) this.#map.delete(k);
            else if (combine)
                this.#map.set(k, [p, combine(v, s.#map.get(k)![1])]);
        }
        return this;
    }

    /**
     * Union the entries with another hash map, adding any new keys and optionally combining values for existing keys. Will modify the hash map and return a reference to the same object.
     * @param combine A function to merge the values from both maps to form a value in the result.
     */
    unionWith(s: HashMap<P, V>, combine?: (a: V, b: V) => V): this {
        for (const [k, [p, v]] of s.#map) {
            if (combine && this.#map.has(k))
                this.#map.set(k, [p, combine(this.#map.get(k)![1], v)]);
            else
                this.#map.set(k, [p, v]);
        }
        return this;
    }

    /**
     * Return a new HashMap containing elements that are present in either this map or the other map, but not in both. This operation returns a new map.
     */
    difference(s: HashMap<P, V>) {
        const diff = new HashMap<P, V>();
        for (const [k, v] of this.#map)
            if (!s.#map.has(k)) diff.#map.set(k, v);
        for (const [k, v] of s.#map)
            if (!this.#map.has(k)) diff.#map.set(k, v);
        return diff;
    }

    /**
     * Adds a new element with a specified key and value to the hash map. If an element with the same key already exists, the element will be updated.
     */
    set(p: P, v: V) {
        this.#map.set(p.hash(), [p, v]);
    }

    /**
     * @returns `true` if an element in the hash map existed and has been removed, or `false` if the element does not exist.
     */
    delete(p: P) {
        return this.#map.delete(p.hash());
    }

    /**
     * @returns boolean indicating whether an element with the specified key exists or not.
     */
    has(p: P) {
        return this.#map.has(p.hash());
    }

    /**
     * Returns an iterable of key-value pairs in the map.
     */
    entries() {
        return this.#map.values();
    }
}
