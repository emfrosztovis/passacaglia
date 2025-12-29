import { Rational } from "common";
import { EventContainer, Located, InstantaneousElement } from "../src";
import { describe, expect, test } from 'vitest';

type Event = InstantaneousElement & { name: string };

class EContainer extends EventContainer<Event> {
    constructor(events: Located<Event>[]) {
        super(events);
    }
}

describe("EventContainer", () => {
    const events: Located<Event>[] = [
        { offset: new Rational(0), element: { name: "E1" } },
        { offset: new Rational(1, 2), element: { name: "E2" } },
        { offset: new Rational(1, 2), element: { name: "E3" } }
    ];
    const container = new EContainer(events);

    test("iteration", () => {
        let c = container.first();
        expect(c).toBeDefined();
        expect(c!.value.name).toBe("E1");
        expect(c!.time.value()).toBe(0);

        c = c!.next();
        expect(c).toBeDefined();
        expect(c!.value.name).toBe("E2");
        expect(c!.time.value()).toBe(0.5);

        c = c!.next();
        expect(c).toBeDefined();
        expect(c!.value.name).toBe("E3");
        expect(c!.time.value()).toBe(0.5);

        c = c!.next();
        expect(c).toBeUndefined();
    });

    test("backward iteration", () => {
        let c = container.last();
        expect(c!.value.name).toBe("E3");

        c = c!.prev();
        expect(c!.value.name).toBe("E2");

        c = c!.prev();
        expect(c!.value.name).toBe("E1");

        expect(c!.prev()).toBeUndefined();
    });
});
