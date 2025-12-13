import { Debug, LogLevel } from "common";
import { CounterpointScoreBuilder } from "./Basic";
import { H, parseNotes, PC, Scales } from "./Common";
import { FirstSpecies } from "./Species1";
import { forbidPerfectsBySimilarMotion, forbidVoiceOverlapping } from "./Rules";

const ctx = new FirstSpecies(
    Scales.major(PC.c),
    7, // targetMeasures
    {
        measureLength: 4
    }
);

ctx.localRules.push(
    forbidVoiceOverlapping,
    forbidPerfectsBySimilarMotion,
);

const score = new CounterpointScoreBuilder(ctx)
    .soprano()
    .alto()
    .tenor()
    .cantus([
        parseNotes(['c3', 4]),
        parseNotes(['d3', 4]),
        parseNotes(['e3', 4]),
        parseNotes(['g3', 4]),
        parseNotes(['f3', 4]),
        parseNotes(['d3', 4]),
        parseNotes(['c3', 4]),
    ])
    .build();

Debug.level = LogLevel.Trace;
const result = ctx.solve(score);
console.log(result?.toString());
