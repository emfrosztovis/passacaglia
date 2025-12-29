import { AsRational, Debug, Rational } from "common";
import { DurationalElement, InstantaneousElement, TemporalElement } from "./Elements";

export interface WithCursor<T, This extends WithCursor<T, any> = any> {
    /**
     * @returns a cursor to the first element of the container.
     */
    first(): Cursor<T, This, never> | undefined;

    /**
     * @returns a cursor to the last element of the container.
     */
    last(): Cursor<T, This, never> | undefined;
}

/**
 * Represents a cursor (or iterator) in a possibly nested musical structure.
 */
export abstract class Cursor<
    T,
    C extends WithCursor<T, C>,
    P extends Cursor<C, WithCursor<C, any>, any> | never
> {
    /**
     * The gloal time-position of the element under the cursor. This is equal to its local time plus the global time of the parent cursor.
     */
    public readonly globalTime: Rational;

    protected constructor(
        /**
         * The local time-position of the element under the cursor.
         */
        public readonly time: Rational,
        /**
         * The container of the cursor.
         */
        public readonly container: C,
        /**
         * The parent of the cursor, which is also a cursor if it exists, pointing to the container of the element under this cursor.
         */
        public readonly parent: P
    ) {
        this.globalTime = parent ? parent.globalTime.add(time) : time;
    }

    /**
     * Retrieve the index of the element under the cursor.
     */
    abstract readonly index: number;

    /**
     * Retrieve the element under the cursor.
     */
    abstract readonly value: T;

    /**
     * Get the cursor to the previous element, if any.
     */
    abstract prev(): this | undefined;

    /**
     * Get the cursor to the next element, if any.
     */
    abstract next(): this | undefined;

    /**
     * Return a copy of this cursor with the parent replaced as `p`.
     */
    abstract withParent<P2 extends Cursor<C, WithCursor<C>, any> | never>(p: P2): Cursor<T, C, P2>;

    /**
     * Get the cursor to the previous element globally, if any. This is equal to `prev()` if it's not `undefined`, or the last cursor of the parent's `prevGlobal()`.
     */
    prevGlobal(): this | undefined {
        const prev = this.prev();
        if (prev || !this.parent) return prev;

        const prevParent = this.parent.prevGlobal();
        if (!prevParent) return undefined;
        return prevParent.value.last()?.withParent(prevParent as P) as this;
    }

    /**
     * Get the cursor to the next element globally, if any. This is equal to `next()` if it's not `undefined`, or the first cursor of the parent's `nextGlobal()`.
     */
    nextGlobal(): this | undefined {
        const next = this.next();
        if (next || !this.parent) return next;

        const prevParent = this.parent.nextGlobal();
        if (!prevParent) return undefined;
        return prevParent.value.first()?.withParent(prevParent as P) as this;
    }
}

export class SequentialCursor<
    T extends DurationalElement,
    C extends SequentialContainer<T>,
    P extends Cursor<C, WithCursor<C>, any> | never
> extends Cursor<T, C, P> {
    readonly value: T;

    get duration() {
        return this.value.duration;
    }

    get endTime() {
        return this.time.add(this.value.duration);
    }

    get globalEndTime() {
        return this.globalTime.add(this.value.duration);
    }

    constructor(container: C, public index: number, t: Rational, p: P) {
        super(t, container, p);
        this.value = container.elements[index];
    }

    prev() {
        if (this.index == 0) return undefined;
        return new SequentialCursor(this.container, this.index - 1,
            this.time.sub(this.container.elements[this.index - 1].duration), this.parent) as this;
    }

    next() {
        if (this.index == this.container.size - 1) return undefined;
        return new SequentialCursor(this.container, this.index + 1,
            this.time.add(this.value.duration), this.parent) as this;
    }

    withParent<P2 extends Cursor<C, WithCursor<C>, any> | never>(p: P2): SequentialCursor<T, C, P2> {
        return new SequentialCursor(this.container, this.index, this.time, p);
    }
}

/**
 * Base class for musical containers of durational elements.
 */
export abstract class SequentialContainer<T extends DurationalElement>
implements WithCursor<T> {
    /**
     * Get the elements in the container.
     */
    public readonly elements: readonly T[];

    protected constructor(elements: readonly T[]) {
        this.elements = elements;
    }

    first(): SequentialCursor<T, this, never> | undefined {
        return this.elements.length == 0
            ? undefined
            : new SequentialCursor(this, 0, new Rational(0), undefined as never);
    }

    last(): SequentialCursor<T, this, never> | undefined {
        return this.at(this.elements.length - 1);
    }

    at(i: number): SequentialCursor<T, this, never> | undefined {
        if (i >= this.elements.length || i < 0) return undefined;

        const t = this.elements.slice(0, i).reduce(
            (acc, el) => acc.add(el.duration),
            new Rational(0)
        );
        return new SequentialCursor(this, i, t, undefined as never);
    }

    find(pred: (c: SequentialCursor<T, this, never>) => boolean) {
        for (let c = this.first(); c; c = c.next())
            if (pred(c)) return c;
        return undefined;
    }

    cursorAtTime(time: AsRational): SequentialCursor<T, this, never> | undefined {
        const t = Rational.from(time).value();
        for (const c of this.entries()) {
            if (c.time.value() <= t && c.time.value() + c.value.duration.value() > t)
                return c;
        }
        return undefined;
    }

    cursorBeforeTime(time: AsRational): SequentialCursor<T, this, never> | undefined {
        const t = Rational.from(time).value();
        let last: SequentialCursor<T, this, never> | undefined;
        for (const c of this.entries()) {
            if (c.time.value() >= t)
                return last;
            last = c;
        }
        return last;
    }

    get size(): number {
        return this.elements.length;
    }

    *entries() {
        for (let c = this.first(); c; c = c.next())
            yield c;
    }
}

export interface Located<T extends InstantaneousElement> {
    readonly offset: Rational;
    readonly element: T;
}

export class EventCursor<
    T extends InstantaneousElement,
    C extends EventContainer<T>,
    P extends Cursor<C, WithCursor<C>, any> | never
> extends Cursor<T, C, P> {
    readonly value: T;

    constructor(container: C, public index: number, p: P) {
        const value = container.elements[index];
        super(value.offset, container, p);
        this.value = value.element;
    }

    prev(): this | undefined {
        if (this.index == 0) return undefined;
        return new EventCursor(this.container, this.index - 1, this.parent) as this;
    }

    next(): this | undefined {
        if (this.index == this.container.size - 1) return undefined;
        return new EventCursor(this.container, this.index + 1, this.parent) as this;
    }

    withParent<P2 extends Cursor<C, WithCursor<C>, any>>(p: P2): Cursor<T, C, P2> {
        return new EventCursor(this.container, this.index, p);
    }
}

/**
 * Base class for musical containers of zero-length events.
 */
export abstract class EventContainer<T extends InstantaneousElement>
implements WithCursor<T> {
    public readonly elements: readonly Located<T>[];

    protected constructor(events: readonly Located<T>[]) {
        this.elements = events;
        this.validate();
    }

    first(): EventCursor<T, this, never> | undefined {
        return this.elements.length == 0
            ? undefined
            : new EventCursor(this, 0, undefined as never);
    }

    last(): EventCursor<T, this, never> | undefined {
        return this.elements.length == 0
            ? undefined
            : new EventCursor(this, this.elements.length - 1, undefined as never);
    }

    protected validate(): void {
        // offsets sorted; duplicates allowed
    }

    get size(): number {
        return this.elements.length;
    }

    *entries() {
        for (let c = this.first(); c; c = c.next())
            yield c;
    }
}
