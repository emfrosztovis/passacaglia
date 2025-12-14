import { Debug, LogLevel } from "common";
import { CounterpointScoreBuilder } from "./Basic";
import { H, parseNotes, PC, Scales } from "./Common";
import { forbidPerfectsBySimilarMotion, forbidVoiceOverlapping } from "./rules/VerticalRules";
import { enforceHarmonyIntervals, enforceMelodyIntervals, enforcePassingTones, enforceScaleTones, parsePreferred } from "./rules/CandidateRules";
import { SecondSpecies } from "./Species2";
import { CounterpointContext } from "./Context";
import { FirstSpecies } from "./Species1";

const ctx = new CounterpointContext(
    H.Scale.fromPitches(
        ['c', 'd', 'ef', 'f', 'g', 'af', 'a', 'bf', 'b'].map((x) => H.Pitch.parse(x)!)),
    // Scales.C.chromatic,
    8, // targetMeasures
    {
        measureLength: 4
    }
);

ctx.advanceReward = 10;

ctx.harmonyIntervals = parsePreferred(
    ['m3', 0], ['M3', 0], ['m6', 0], ['M6', 0], ['P4', 1], ['P5', 2], ['P1', 3],
    // ['d5', 6],
);

ctx.localRules = [
    forbidVoiceOverlapping,
    forbidPerfectsBySimilarMotion,
];

ctx.candidateRules = [
    enforceScaleTones,
    enforcePassingTones,
    enforceMelodyIntervals,
];

const score = new CounterpointScoreBuilder(ctx)
    .soprano(SecondSpecies)
    .alto(FirstSpecies)
    .tenor(FirstSpecies)
    .cantus([
        parseNotes(['c3', 4]),
        parseNotes(['d3', 4]),
        parseNotes(['ef3', 4]),
        parseNotes(['g3', 4]),
        parseNotes(['f3', 4]),
        parseNotes(['d3', 4]),
        parseNotes(['b2', 4]),
        parseNotes(['c3', 4]),
    ])
    .build();

Debug.level = LogLevel.Trace;
const result = ctx.solve(score);
console.log(result?.toString());
