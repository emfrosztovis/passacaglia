import { Debug, LogLevel, Rational } from "common";
import { CounterpointScoreBuilder } from "./Basic";
import { H, parseNotes } from "./Common";
import { forbidVoiceOverlapping, prioritizeVoiceMotion } from "./rules/LocalRules";
import { forbidPerfectsBySimilarMotion } from "./rules/ParallelConsonance";
import { DegreeMatrixPreset, enforceDirectionalDegreeMatrix, enforceMinor, enforceScaleTones } from "./rules/Scales";
import { CounterpointContext } from "./Context";
import { play } from "./Play";
import { ThirdSpecies } from "./Species3";
import { FirstSpecies } from "./Species1";
import { SecondSpecies } from "./Species2";
import { enforcePassingTones } from "./rules/PassingTone";
import { enforceLeapPreparationAfter, enforceLeapPreparationBefore, enforceMelodyIntervals, limitConsecutiveLeaps } from "./rules/Melody";
import { Clef } from "musicxml";

const ctx = new CounterpointContext(
    8, // targetMeasures
    {
        measureLength: new Rational(4)
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
    limitConsecutiveLeaps,
    forbidVoiceOverlapping,
    forbidPerfectsBySimilarMotion,
    prioritizeVoiceMotion,
];

ctx.candidateRules = [
    // enforceMinor(H.Pitch.parse('c')!),
    enforceScaleTones(H.Scales.C.major),
    // enforceScaleTones(H.Scales.C.chromatic),
    enforcePassingTones,
    enforceMelodyIntervals,
    enforceDirectionalDegreeMatrix(H.Scales.C.major, DegreeMatrixPreset.major),
    enforceLeapPreparationBefore,
    enforceLeapPreparationAfter,
];

ctx.advanceReward = 100;

ctx.allowUnison = false;

const score = new CounterpointScoreBuilder(ctx)
    // .soprano(FirstSpecies)
    // .alto(SecondSpecies)
    .tenor(ThirdSpecies)
    // .tenor(FirstSpecies)
    .cantus(Clef.Bass, [
        parseNotes(['c3', ctx.parameters.measureLength]),
        parseNotes(['d3', ctx.parameters.measureLength]),
        parseNotes(['e3', ctx.parameters.measureLength]),
        parseNotes(['g3', ctx.parameters.measureLength]),
        parseNotes(['f3', ctx.parameters.measureLength]),
        parseNotes(['d3', ctx.parameters.measureLength]),
        parseNotes(['b2', ctx.parameters.measureLength]),
        parseNotes(['c3', ctx.parameters.measureLength]),
    ])
    .build();

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
const result = ctx.solve(score).search()?.result.score;
console.log(result?.toString());
if (result)
    await play(result.voices, [72, 72, 72, 72]);
