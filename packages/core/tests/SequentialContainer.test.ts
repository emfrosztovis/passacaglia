import { Rational } from "common";
import { SequentialContainer } from "../src";
import { describe, expect, test } from 'vitest';

type Elem = {
    readonly duration: Rational;
    readonly name: string;
};

class Container extends SequentialContainer<Elem> {
    constructor(e: Elem[]) {
        super(e);
    }
}

describe("SequentialContainer", () => {
    const elements: Elem[] = [
        { duration: new Rational(1, 4), name: "A" },
        { duration: new Rational(1, 4), name: "B" },
        { duration: new Rational(1, 2), name: "C" }
    ];
    const container = new Container(elements);

    test("iteration", () => {
        let cursor = container.first();
        expect(cursor).toBeDefined();
        expect(cursor?.value.name).toBe("A");
        expect(cursor?.time.value()).toBe(0);
        expect(cursor?.endTime.value()).toBe(0.25);

        cursor = cursor?.next();
        expect(cursor).toBeDefined();
        expect(cursor?.value.name).toBe("B");
        expect(cursor?.time.value()).toBe(0.25);
        expect(cursor?.endTime.value()).toBe(0.5);

        cursor = cursor?.next();
        expect(cursor).toBeDefined();
        expect(cursor?.value.name).toBe("C");
        expect(cursor?.time.value()).toBe(0.5);
        expect(cursor?.endTime.value()).toBe(1.0);

        expect(cursor?.next()).toBeUndefined();
    });

    test("reverse iteration", () => {
        let cursor = container.last();
        expect(cursor).toBeDefined();
        expect(cursor?.value.name).toBe("C");
        expect(cursor?.time.value()).toBe(0.5);
        expect(cursor?.endTime.value()).toBe(1.0);

        cursor = cursor?.prev();
        expect(cursor).toBeDefined();
        expect(cursor?.value.name).toBe("B");
        expect(cursor?.time.value()).toBe(0.25);
        expect(cursor?.endTime.value()).toBe(0.5);

        cursor = cursor?.prev();
        expect(cursor).toBeDefined();
        expect(cursor?.value.name).toBe("A");
        expect(cursor?.time.value()).toBe(0);
        expect(cursor?.endTime.value()).toBe(0.25);

        expect(cursor?.prev()).toBeUndefined();
    });

    test("at", () => {
        const c = container.at(1);
        expect(c?.value.name).toBe("B");
        expect(c?.time.value()).toBe(0.25);
        expect(container.at(3)).toBeUndefined();
        expect(container.at(-1)).toBeUndefined();
    });

    test("cursorAtTime", () => {
        expect(container.cursorAtTime(new Rational(0))?.value.name).toBe("A");
        expect(container.cursorAtTime(new Rational(1, 10))?.value.name).toBe("A");
        expect(container.cursorAtTime(new Rational(1, 4))?.value.name).toBe("B");
        expect(container.cursorAtTime(new Rational(1, 2))?.value.name).toBe("C");
        expect(container.cursorAtTime(new Rational(99, 100))?.value.name).toBe("C");
        expect(container.cursorAtTime(new Rational(1))).toBeUndefined();
    });

    test("cursorBeforeTime", () => {
        expect(container.cursorBeforeTime(new Rational(0))).toBeUndefined();
        expect(container.cursorBeforeTime(new Rational(1, 10))?.value.name).toBe("A");
        expect(container.cursorBeforeTime(new Rational(1, 4))?.value.name).toBe("A");
        expect(container.cursorBeforeTime(new Rational(13, 50))?.value.name).toBe("B");
        expect(container.cursorBeforeTime(new Rational(3, 2))?.value.name).toBe("C");
    });
});
