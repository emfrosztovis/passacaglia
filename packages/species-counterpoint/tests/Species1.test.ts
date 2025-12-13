import { test } from "vitest";
import { CounterpointScoreBuilder } from "../src/Basic";
import { parseNotes, PC, Scales } from "../src/Common";
import { FirstSpecies } from "../src/Species1";

const ctx = new FirstSpecies(
    Scales.major(PC.c),
    8, // targetMeasures
    {
        measureLength: 4
    }
);

test('first species', () => {
    const score = new CounterpointScoreBuilder(ctx)
        .soprano()
        .tenor()
        .cantus([
            parseNotes(['c2', 4]),
            parseNotes(['d2', 4]),
            parseNotes(['e2', 4]),
            parseNotes(['g2', 4]),
            parseNotes(['f2', 4]),
            parseNotes(['d2', 4]),
            parseNotes(['c2', 4]),
        ])
        .build();

    const result = ctx.solve(score);
    console.log(result);
});
