import { CounterpointContext, CounterpointScoreBuilder, FirstSpecies, parseNotes, Rules, Score, SecondSpecies, ThirdSpecies } from 'species-counterpoint';
import { Debug, LogLevel, Rational, setLogger } from 'common';
import { StandardHeptatonic } from 'core';
import { Clef, toMxl } from 'musicxml';

const ctx = new CounterpointContext(
    8, // targetMeasures
    {
        measureLength: new Rational(4)
    }
);

ctx.localRules = [
    Rules.limitConsecutiveLeaps,
    Rules.forbidPerfectsBySimilarMotion,
    Rules.forbidNearbyPerfects,
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
    Rules.enforceMelodyIntervals,
    Rules.enforceLeapPreparationBefore,
    Rules.enforceLeapPreparationAfter,
];

ctx.advanceReward = 100;

ctx.allowUnison = false;

const score = new CounterpointScoreBuilder(ctx)
    .soprano(ThirdSpecies)
    // .alto(SecondSpecies)
    .tenor(FirstSpecies)
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

const result = ctx.solve(score);
console.log(result?.toString());

if (result) {
    postMessage({
        type: 'ok',
        // result,
        source: toMxl.score(result.voices)
    } satisfies MainMessage);
} else {
    postMessage({
        type: 'no-solution'
    } satisfies MainMessage);
}

export type MainMessage = {
    type: 'ok',
    // result: Score,
    source: string,
} | {
    type: 'no-solution',
} | {
    type: 'log',
    level: LogLevel,
    message: unknown[]
};
