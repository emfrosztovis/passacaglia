import { Debug, HashMap, LogLevel } from "common";
import { CounterpointScoreBuilder } from "./Basic";
import { H, parseNotes, PC, Scales } from "./Common";
import { forbidPerfectsBySimilarMotion, forbidVoiceOverlapping, prioritizeVoiceMotion } from "./rules/VerticalRules";
import { DegreeMatrix, DegreeMatrixPreset, enforceDirectionalDegreeMatrix, enforceMelodyIntervals, enforceMinor, enforcePassingTones, enforceScaleTones, enforceScaleTonesDirectional, parsePreferred } from "./rules/CandidateRules";
import { SecondSpecies } from "./Species2";
import { CounterpointContext } from "./Context";
import { FirstSpecies } from "./Species1";
import { play } from "./Play";
import { ThirdSpecies } from "./Species3";

export const ctx = new CounterpointContext(
    14, // targetMeasures
    {
        measureLength: 4
    }
);

// ctx.harmonyIntervals = parsePreferred(
//     // ['A1', 0],
//     // ['m2', 0],    // very strong dissonance
//     // ['M2', 0],

//     // ['A4', 5],    // tritone
//     // ['d5', 5],

//     // ['m7', 10],
//     // ['M7', 10],

//     // ['P4', 25],   // weak consonance / contextual dissonance

//     // ['m3', 60],
//     // ['M3', 60],

//     // ['m6', 70],
//     // ['M6', 70],

//     ['m3', 0], ['M3', 0], ['m6', 0], ['M6', 0], ['P4', 10], ['P5', 20], ['P1', 50]
// );

ctx.localRules = [
    forbidVoiceOverlapping,
    forbidPerfectsBySimilarMotion,
    prioritizeVoiceMotion,
];

ctx.candidateRules = [
    enforceMinor(H.Pitch.parse('c')!),
    enforcePassingTones,
    enforceMelodyIntervals,
];

ctx.advanceReward = 20;

const score = new CounterpointScoreBuilder(ctx)
    .soprano(ThirdSpecies)
    // .alto(SecondSpecies)
    // .tenor(SecondSpecies)
    // .tenor(FirstSpecies)
    .cantus([
        parseNotes(['c3', ctx.parameters.measureLength]),
        parseNotes(['d3', ctx.parameters.measureLength]),
        parseNotes(['ef3', ctx.parameters.measureLength]),
        parseNotes(['g3', ctx.parameters.measureLength]),
        parseNotes(['f3', ctx.parameters.measureLength]),
        parseNotes(['d3', ctx.parameters.measureLength]),
        parseNotes(['b2', ctx.parameters.measureLength]),
        parseNotes(['c3', ctx.parameters.measureLength]),
        parseNotes(['d3', ctx.parameters.measureLength]),
        parseNotes(['ef3', ctx.parameters.measureLength]),
        parseNotes(['g3', ctx.parameters.measureLength]),
        parseNotes(['f3', ctx.parameters.measureLength]),
        parseNotes(['d3', ctx.parameters.measureLength]),
        parseNotes(['b2', ctx.parameters.measureLength]),
    ])
    .build();

ctx.allowUnison = false;

// const score = new CounterpointScoreBuilder(ctx)
//     .cantus([
//         parseNotes(['c5', ctx.parameters.measureLength]),
//         parseNotes(['d5', ctx.parameters.measureLength]),
//         parseNotes(['e5', ctx.parameters.measureLength]),
//         parseNotes(['g5', ctx.parameters.measureLength]),
//         parseNotes(['f5', ctx.parameters.measureLength]),
//         parseNotes(['d5', ctx.parameters.measureLength]),
//         parseNotes(['b4', ctx.parameters.measureLength]),
//         parseNotes(['c5', ctx.parameters.measureLength]),
//         parseNotes(['d5', ctx.parameters.measureLength]),
//         parseNotes(['e5', ctx.parameters.measureLength]),
//         parseNotes(['g5', ctx.parameters.measureLength]),
//         parseNotes(['f5', ctx.parameters.measureLength]),
//         parseNotes(['d5', ctx.parameters.measureLength]),
//         parseNotes(['b4', ctx.parameters.measureLength]),
//     ])
//     // .soprano(SecondSpecies)
//     .alto(SecondSpecies)
//     .tenor(SecondSpecies)
//     .bass(FirstSpecies)
//     .build();

Debug.level = LogLevel.Trace;
const result = ctx.solve(score);
console.log(result?.toString());
if (result)
    await play(result, [72, 72, 72, 72], 82);
