import { Debug, HashMap, LogLevel } from "common";
import { CounterpointScoreBuilder } from "./Basic";
import { H, parseNotes, PC, Scales } from "./Common";
import { forbidPerfectsBySimilarMotion, forbidVoiceOverlapping } from "./rules/VerticalRules";
import { DegreeMatrix, enforceDirectionalDegreeMatrix, enforceMelodyIntervals, enforcePassingTones, enforceScaleTones, parsePreferred } from "./rules/CandidateRules";
import { SecondSpecies } from "./Species2";
import { CounterpointContext } from "./Context";
import { FirstSpecies } from "./Species1";
import { play } from "./Play";

const ctx = new CounterpointContext(
    H.Scales.major(PC.c),
    // H.Scale.fromPitches(
    //     ['c', 'd', 'ef', 'f', 'g', 'af', 'a', 'bf', 'b'].map((x) => H.Pitch.parse(x)!)),
    // Scales.C.chromatic,
    14, // targetMeasures
    {
        measureLength: 4
    }
);

ctx.harmonyIntervals = parsePreferred(
    // ['A1', 0],
    // ['m2', 0],    // very strong dissonance
    // ['M2', 0],

    // ['A4', 5],    // tritone
    // ['d5', 5],

    // ['m7', 10],
    // ['M7', 10],

    // ['P4', 25],   // weak consonance / contextual dissonance

    // ['m3', 60],
    // ['M3', 60],

    // ['m6', 70],
    // ['M6', 70],

    ['m3', 0], ['M3', 0], ['m6', 0], ['M6', 0], ['P4', 10], ['P5', 20], ['P1', 50]
);

ctx.melodicIntervals = parsePreferred(
    ['m2',    0], ['M2',    0], ['-m2',  30], ['-M2',  30],
    ['m3',   30], ['M3',   30], ['-m3',  30], ['-M3',  30],
    ['P4',   40],               ['-P4',  40],
    ['P5',   40],               ['-P5',  40],
    ['m6',   50], ['M6',   50], ['-m6',  50], ['-M6',  50],
    ['P8',   60],               ['-P8',  60],
    ['P1',  100],
);

ctx.localRules = [
    forbidVoiceOverlapping,
    forbidPerfectsBySimilarMotion,
];

const matrix: DegreeMatrix = {
    upward: new HashMap([
        [
            ctx.scale.at(6), {
                next: parsePreferred(['m2', -100]),
                forbidOther: true,
            }
        ],
    ]),
    downward: new HashMap([
        [
            ctx.scale.at(6), {
                next: parsePreferred(['m2', -100]),
                // forbidOther: true,
            }
        ], [
            ctx.scale.at(5), {
                next: parsePreferred(['-M2', -50]),
                forbidOther: true,
            }
        ], [
            ctx.scale.at(3), {
                next: parsePreferred(['-m2', -30]),
                // forbidOther: true,
            }
        ]
    ]),
};

ctx.candidateRules = [
    enforceScaleTones,
    enforcePassingTones,
    enforceMelodyIntervals,
    // enforceDirectionalDegreeMatrix(matrix),
];

// const score = new CounterpointScoreBuilder(ctx)
//     .soprano(SecondSpecies)
//     .alto(SecondSpecies)
//     .tenor(FirstSpecies)
//     .cantus([
//         parseNotes(['c3', 4]),
//         parseNotes(['d3', 4]),
//         parseNotes(['ef3', 4]),
//         parseNotes(['g3', 4]),
//         parseNotes(['f3', 4]),
//         parseNotes(['d3', 4]),
//         parseNotes(['b2', 4]),
//         parseNotes(['c3', 4]),
//         parseNotes(['d3', 4]),
//         parseNotes(['ef3', 4]),
//         parseNotes(['g3', 4]),
//         parseNotes(['f3', 4]),
//         parseNotes(['d3', 4]),
//         parseNotes(['b2', 4]),
//     ])
//     .build();


const score = new CounterpointScoreBuilder(ctx)
    .cantus([
        parseNotes(['c5', 4]),
        parseNotes(['d5', 4]),
        parseNotes(['e5', 4]),
        parseNotes(['g5', 4]),
        parseNotes(['f5', 4]),
        parseNotes(['d5', 4]),
        parseNotes(['b4', 4]),
        parseNotes(['c5', 4]),
        parseNotes(['d5', 4]),
        parseNotes(['e5', 4]),
        parseNotes(['g5', 4]),
        parseNotes(['f5', 4]),
        parseNotes(['d5', 4]),
        parseNotes(['b4', 4]),
    ])
    .alto(SecondSpecies)
    .tenor(FirstSpecies)
    .bass(FirstSpecies)
    .build();

Debug.level = LogLevel.Trace;
const result = ctx.solve(score);
console.log(result?.toString());
if (result)
    await play(result,
        // [72, 91],
        [72, 72, 72, 72]
        // [65, 69, 72, 71]
    );
