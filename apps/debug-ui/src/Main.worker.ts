import { CounterpointContext, CounterpointScoreBuilder, CounterpointSolver, parseNotes, Rules, Species1, Species2, Species3, Species4, Species5, VoiceData } from 'species-counterpoint';
import { Debug, LogLevel, Rational, setLogger, type Serialized } from 'common';
import { StandardHeptatonic } from 'core';
import { Clef, toMxl } from 'musicxml';

const ctx = new CounterpointContext(
    9, // targetMeasures
    {
        measureLength: new Rational(4)
    }
);

ctx.harmonyRules = [
    Rules.enforceValidChords
];

ctx.localRules = [
    // Rules.forbidVoiceOverlapping,
    // Rules.limitConsecutiveLeaps,
    // Rules.forbidPerfectsBySimilarMotion,
    // Rules.forbidNearbyPerfects,
    Rules.prioritizeVoiceMotion,
    // Rules.enforceVerticalConsonanceWithMovingLocal,
];

ctx.candidateRulesBefore = [
    Rules.enforceScaleTones,
    // Rules.enforceDirectionalDegreeMatrix(Rules.DegreeMatrixPreset.major),
    // Rules.enforceMinor(StandardHeptatonic.PitchClasses.c),
    // Rules.enforceStepwiseAroundShortNotes,
    // Rules.enforcePassingTones,
    Rules.enforceNeighborTones,
    // Rules.enforceSuspension,
    // Rules.forbidVoiceOverlapping2,
];

ctx.candidateRulesAfter = [
    Rules.enforceMelodyIntervals,
    // Rules.enforceLeapPreparationBefore,
    // Rules.enforceLeapPreparationAfter,
];

ctx.harmonicToneRules = [
    Rules.enforceChordTone,
    // Rules.enforceVerticalConsonanceStrict
];

ctx.nonHarmonicToneRules = {
    // 'neighbor': [
    //     Rules.makeNeighborTone,
    // ],
    // 'passing_tone': [
    //     Rules.makePassingTone,
    // ],
    // 'suspension': [
    //     Rules.makeSuspension
    // ],
};

// ctx.allowUnison = true;

const score = new CounterpointScoreBuilder(ctx)
    // .cantus(Clef.Treble, [
    //     parseNotes(['c5', ctx.parameters.measureLength]),
    //     parseNotes(['d5', ctx.parameters.measureLength]),
    //     parseNotes(['e5', ctx.parameters.measureLength]),
    //     parseNotes(['d5', ctx.parameters.measureLength]),
    //     parseNotes(['c5', ctx.parameters.measureLength]),
    //     parseNotes(['a4', ctx.parameters.measureLength]),
    //     parseNotes(['b4', ctx.parameters.measureLength]),
    //     parseNotes(['g4', ctx.parameters.measureLength]),
    //     parseNotes(['e4', ctx.parameters.measureLength]),
    //     parseNotes(['a4', ctx.parameters.measureLength]),
    //     parseNotes(['b4', ctx.parameters.measureLength]),
    //     parseNotes(['c5', ctx.parameters.measureLength]),
    // ])
    .soprano(Species3)
    .alto(Species3)
    .tenor(Species3)
    // .bass(Species1)
    .cantus(Clef.Bass, [
        parseNotes(['c3', ctx.parameters.measureLength]),
        parseNotes(['d3', ctx.parameters.measureLength]),
        parseNotes(['e3', ctx.parameters.measureLength]),
        parseNotes(['g3', ctx.parameters.measureLength]),
        parseNotes(['a3', ctx.parameters.measureLength]),
        parseNotes(['f3', ctx.parameters.measureLength]),
        parseNotes(['e3', ctx.parameters.measureLength]),
        parseNotes(['d3', ctx.parameters.measureLength]),
        parseNotes(['c3', ctx.parameters.measureLength]),
    ])
    // .cantus(Clef.Bass, [
    //     parseNotes(['c4', ctx.parameters.measureLength]),
    //     parseNotes(['a3', ctx.parameters.measureLength]),
    //     parseNotes(['g3', ctx.parameters.measureLength]),
    //     parseNotes(['e3', ctx.parameters.measureLength]),
    //     parseNotes(['f3', ctx.parameters.measureLength]),
    //     parseNotes(['a3', ctx.parameters.measureLength]),
    //     parseNotes(['g3', ctx.parameters.measureLength]),
    //     parseNotes(['e3', ctx.parameters.measureLength]),
    //     parseNotes(['d3', ctx.parameters.measureLength]),
    //     parseNotes(['c3', ctx.parameters.measureLength]),
    //     parseNotes(['a3', ctx.parameters.measureLength]),
    //     parseNotes(['g3', ctx.parameters.measureLength]),
    //     parseNotes(['e3', ctx.parameters.measureLength]),
    //     parseNotes(['f3', ctx.parameters.measureLength]),
    //     parseNotes(['a3', ctx.parameters.measureLength]),
    //     parseNotes(['g3', ctx.parameters.measureLength]),
    //     parseNotes(['e3', ctx.parameters.measureLength]),
    //     parseNotes(['d3', ctx.parameters.measureLength]),
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

solver.onProgress = (p) => {
    postMessage({
        type: 'progress',
        progress: p.measureIndex,
        furthest: p.furthest,
        total: p.totalMeasures,
        iteration: p.iteration
    } satisfies MainMessage);
}

solver.removeOld = 10;
solver.batch = 1;
solver.reportInterval = 1000;

const result = solver.aStar(score, {
    type: 'constant',
    value: 100,
});
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
    furthest: number,
    total: number,
    iteration: number
};
