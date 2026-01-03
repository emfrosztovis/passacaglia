import { CounterpointContext, CounterpointScoreBuilder, CounterpointSolver, FirstSpecies, FourthSpecies, parseNotes, Rules, SecondSpecies, ThirdSpecies, VoiceData } from 'species-counterpoint';
import { Debug, LogLevel, Rational, setLogger, type Serialized } from 'common';
import { StandardHeptatonic } from 'core';
import { Clef, toMxl } from 'musicxml';

const ctx = new CounterpointContext(
    12, // targetMeasures
    {
        measureLength: new Rational(6)
    }
);

ctx.harmonyRules = [
    Rules.enforceValidChords
];

ctx.localRules = [
    Rules.limitConsecutiveLeaps,
    Rules.forbidPerfectsBySimilarMotion,
    Rules.forbidNearbyPerfects,
    Rules.forbidVoiceOverlapping,
    Rules.prioritizeVoiceMotion,
];

ctx.candidateRulesBefore = [
    Rules.enforceScaleTones,
    // Rules.enforceDirectionalDegreeMatrix(Rules.DegreeMatrixPreset.major),
    // Rules.enforceMinor(StandardHeptatonic.PitchClasses.c),
    Rules.enforcePassingTones,
    Rules.enforceNeighborTones,
    Rules.enforceSuspension,
];

ctx.candidateRulesAfter = [
    Rules.enforceMelodyIntervals,
    Rules.enforceLeapPreparationBefore,
    Rules.enforceLeapPreparationAfter,
];

ctx.harmonicToneRules = [
    Rules.enforceChordTone,
    Rules.enforceVerticalConsonanceStrict,
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

// ctx.allowUnison = true;
// ctx.stochastic = true;

const score = new CounterpointScoreBuilder(ctx)
    .cantus(Clef.Treble, [
        parseNotes(['c5', ctx.parameters.measureLength]),
        parseNotes(['d5', ctx.parameters.measureLength]),
        parseNotes(['e5', ctx.parameters.measureLength]),
        parseNotes(['d5', ctx.parameters.measureLength]),
        parseNotes(['c5', ctx.parameters.measureLength]),
        parseNotes(['a4', ctx.parameters.measureLength]),
        parseNotes(['b4', ctx.parameters.measureLength]),
        parseNotes(['g4', ctx.parameters.measureLength]),
        parseNotes(['e4', ctx.parameters.measureLength]),
        parseNotes(['a4', ctx.parameters.measureLength]),
        parseNotes(['b4', ctx.parameters.measureLength]),
        parseNotes(['c5', ctx.parameters.measureLength]),
    ])
    // .soprano(FourthSpecies)
    // .soprano(FourthSpecies)
    .alto(ThirdSpecies)
    .tenor(FirstSpecies)
    // .cantus(Clef.Bass, [
    //     parseNotes(['c3', ctx.parameters.measureLength]),
    //     parseNotes(['d3', ctx.parameters.measureLength]),
    //     parseNotes(['e3', ctx.parameters.measureLength]),
    //     parseNotes(['g3', ctx.parameters.measureLength]),
    //     parseNotes(['f3', ctx.parameters.measureLength]),
    //     parseNotes(['d3', ctx.parameters.measureLength]),
    //     parseNotes(['b2', ctx.parameters.measureLength]),
    //     parseNotes(['c3', ctx.parameters.measureLength]),
    //     parseNotes(['d3', ctx.parameters.measureLength]),
    //     parseNotes(['e3', ctx.parameters.measureLength]),
    //     parseNotes(['g3', ctx.parameters.measureLength]),
    //     parseNotes(['f3', ctx.parameters.measureLength]),
    //     parseNotes(['d3', ctx.parameters.measureLength]),
    //     parseNotes(['b2', ctx.parameters.measureLength]),
    //     parseNotes(['c3', ctx.parameters.measureLength]),
    // ])
    .build(StandardHeptatonic.Scales.C.major);

Debug.level = LogLevel.Trace;
setLogger((level, message) => {
    postMessage({
        type: 'log',
        level, message
    } satisfies MainMessage);
});

const solver = new CounterpointSolver(ctx);

let progress = 0;
solver.onProgress = (p) => {
    if (p.measureIndex != progress) {
        progress = p.measureIndex;
        postMessage({
            type: 'progress',
            progress,
            total: p.totalMeasures
        } satisfies MainMessage);
    }
}

const result = solver.aStar(score, {
    type: 'constant',
    value: 50,
});
// const result = solver.aStar(score, {
//     type: 'lexicographical',
// });
// const result = solver.beamSearch(score, 200);

console.log(result?.toString());

if (result) {
    postMessage({
        type: 'ok',
        data: result.voices.map((x) => VoiceData.from(x).serialize()),
        source: toMxl.score(result)
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
