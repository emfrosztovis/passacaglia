import { CounterpointContext, CounterpointScoreBuilder, FirstSpecies, FourthSpecies, parseNotes, Rules, SecondSpecies, ThirdSpecies, VoiceData } from 'species-counterpoint';
import { Debug, LogLevel, Rational, setLogger, type Serialized } from 'common';
import { StandardHeptatonic } from 'core';
import { Clef, toMxl } from 'musicxml';

const ctx = new CounterpointContext(
    15, // targetMeasures
    {
        measureLength: new Rational(4)
    }
);

ctx.localRules = [
    Rules.limitConsecutiveLeaps,
    Rules.forbidPerfectsBySimilarMotion,
    // Rules.forbidNearbyPerfects,
    Rules.forbidVoiceOverlapping,
    Rules.prioritizeVoiceMotion,
];

ctx.candidateRules = [
    Rules.enforceScaleTones(
        StandardHeptatonic.Scales.C.major),
    Rules.enforceDirectionalDegreeMatrix(
        StandardHeptatonic.Scales.C.major,
        Rules.DegreeMatrixPreset.major),
    // Rules.enforceMinor(StandardHeptatonic.PitchClasses.c),
    Rules.enforcePassingTones,
    Rules.enforceNeighborTones,
    Rules.enforceSuspension,
    Rules.enforceMelodyIntervals,
    Rules.enforceLeapPreparationBefore,
    Rules.enforceLeapPreparationAfter,
];

ctx.harmonicToneRules = [
    Rules.enforceVerticalConsonanceStrict
];

ctx.nonHarmonicToneRules = {
    'neighbor': [
        Rules.makeNeighborTone,
        Rules.enforceVerticalConsonanceWithMoving
    ],
    'passing_tone': [
        Rules.makePassingTone,
        Rules.enforceVerticalConsonanceWithMoving
    ],
    'suspension': [
        Rules.makeSuspension
    ],
};

ctx.advanceReward = 500;
// ctx.allowUnison = true;
// ctx.stochastic = true;

const score = new CounterpointScoreBuilder(ctx)
    .soprano(ThirdSpecies)
    // .alto(FourthSpecies)
    .tenor(ThirdSpecies)
    .cantus(Clef.Bass, [
        parseNotes(['c3', ctx.parameters.measureLength]),
        parseNotes(['d3', ctx.parameters.measureLength]),
        parseNotes(['e3', ctx.parameters.measureLength]),
        parseNotes(['g3', ctx.parameters.measureLength]),
        parseNotes(['f3', ctx.parameters.measureLength]),
        parseNotes(['d3', ctx.parameters.measureLength]),
        parseNotes(['b2', ctx.parameters.measureLength]),
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
//     // .cantus(Clef.Treble, [
//     //     parseNotes(['c5', ctx.parameters.measureLength]),
//     //     parseNotes(['d5', ctx.parameters.measureLength]),
//     //     parseNotes(['ef5', ctx.parameters.measureLength]),
//     //     parseNotes(['g5', ctx.parameters.measureLength]),
//     //     parseNotes(['f5', ctx.parameters.measureLength]),
//     //     parseNotes(['d5', ctx.parameters.measureLength]),
//     //     parseNotes(['b4', ctx.parameters.measureLength]),
//     //     parseNotes(['c5', ctx.parameters.measureLength]),
//     //     parseNotes(['d5', ctx.parameters.measureLength]),
//     //     parseNotes(['ef5', ctx.parameters.measureLength]),
//     //     parseNotes(['g5', ctx.parameters.measureLength]),
//     //     parseNotes(['f5', ctx.parameters.measureLength]),
//     //     parseNotes(['d5', ctx.parameters.measureLength]),
//     //     parseNotes(['b4', ctx.parameters.measureLength]),
//     // ])
//     // .soprano(SecondSpecies)
//     .soprano(FirstSpecies)
//     .alto(ThirdSpecies)
//     .bass(SecondSpecies)
//     .build();

Debug.level = LogLevel.Trace;
setLogger((level, message) => {
    postMessage({
        type: 'log',
        level, message
    } satisfies MainMessage);
});

const astar = ctx.solve(score);
let progress = 0;
astar.onProgress = (p) => {
    if (p.current.measureIndex != progress) {
        progress = p.current.measureIndex;
        postMessage({
            type: 'progress',
            progress,
            total: ctx.targetMeasures
        } satisfies MainMessage);
    }
}

const result = astar.search()?.result.score;
console.log(result?.toString());

if (result) {
    postMessage({
        type: 'ok',
        data: result.voices.map((x) => VoiceData.from(x).serialize()),
        source: toMxl.score(result.voices)
    } satisfies MainMessage);
} else {
    postMessage({
        type: 'no-solution'
    } satisfies MainMessage);
}

export type MainMessage = {
    type: 'ok',
    data: Serialized<VoiceData>[],
    source: string,
} | {
    type: 'no-solution',
} | {
    type: 'log',
    level: LogLevel,
    message: unknown[]
} | {
    type: 'progress',
    progress: number,
    total: number
};
