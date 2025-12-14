import { test } from "vitest";
import { CounterpointScoreBuilder } from "../src/Basic";
import { parseNotes, PC, Scales } from "../src/Common";
import { FirstSpecies } from "../src/Species1";
import { CounterpointContext } from "../src/Context";
import { forbidPerfectsBySimilarMotion, forbidVoiceOverlapping } from "../src/rules/VerticalRules";
import { enforceScaleTones, enforceMelodyIntervals } from "../src/rules/CandidateRules";

const ctx = new CounterpointContext(
    Scales.major(PC.c),
    8, // targetMeasures
    {
        measureLength: 4
    }
);

ctx.advanceReward = 20;

ctx.localRules = [
    forbidVoiceOverlapping,
    forbidPerfectsBySimilarMotion,
];

ctx.candidateRules = [
    enforceScaleTones,
    enforceMelodyIntervals,
];

test('first species', () => {
    const score = new CounterpointScoreBuilder(ctx)
        .soprano(FirstSpecies)
        .alto(FirstSpecies)
        // .tenor(FirstSpecies)
        .cantus([
            parseNotes(['c3', 4]),
            parseNotes(['d3', 4]),
            parseNotes(['e3', 4]),
            parseNotes(['g3', 4]),
            parseNotes(['f3', 4]),
            parseNotes(['d3', 4]),
            parseNotes(['b2', 4]),
            parseNotes(['c3', 4]),
        ])
        .build();

    const result = ctx.solve(score);
    console.log(result?.toString());
});
