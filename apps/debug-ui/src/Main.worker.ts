import { CounterpointContext, CounterpointScoreBuilder, CounterpointSolver, parseNotes, Rules, Species1, Species2, Species3, Species4, Species5, VoiceData, type INode } from 'species-counterpoint';
import { Debug, LogLevel, Rational, setLogger, type Serialized } from 'common';
import { StandardHeptatonic } from 'core';
import { Clef, toMxl } from 'musicxml';
import Graph, { DirectedGraph } from 'graphology';

const ctx = new CounterpointContext(
    3, // targetMeasures
    {
        measureLength: new Rational(4)
    }
);

ctx.harmonyRules = [
    Rules.enforceValidChords
];

ctx.localRules = [
    // Rules.forbidVoiceOverlapping,
    Rules.limitConsecutiveLeaps,
    Rules.forbidPerfectsBySimilarMotion,
    Rules.forbidNearbyPerfects,
    Rules.prioritizeVoiceMotion,
    Rules.enforceVerticalConsonanceWithMovingLocal,
];

ctx.candidateRulesBefore = [
    Rules.enforceScaleTones,
    Rules.enforceDirectionalDegreeMatrix(Rules.DegreeMatrixPreset.major),
    // Rules.enforceMinor(StandardHeptatonic.PitchClasses.c),
    Rules.enforceStepwiseAroundShortNotes,
    Rules.enforcePassingTones,
    Rules.enforceNeighborTones,
    Rules.enforceSuspension,
    Rules.forbidVoiceOverlapping2,
];

ctx.candidateRulesAfter = [
    Rules.enforceMelodyIntervals,
    Rules.enforceLeapPreparationBefore,
    Rules.enforceLeapPreparationAfter,
];

ctx.harmonicToneRules = [
    Rules.enforceChordTone,
    // Rules.enforceVerticalConsonanceStrict
];

ctx.nonHarmonicToneRules = {
    'neighbor': [
        Rules.makeNeighborTone,
    ],
    'passing_tone': [
        Rules.makePassingTone,
    ],
    'suspension': [
        Rules.makeSuspension
    ],
};

ctx.allowUnison = false;

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
    .soprano(Species5)
    .alto(Species5)
    // .tenor(Species5)
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

solver.limitSteps = 5000;
solver.removeOld = 100;
solver.batch = 3;
solver.reportInterval = 1000;

const result = solver.aStar(score, {
    type: 'constant',
    value: 500,
});
// const result = solver.beamSearch(score, 200);

console.log(result?.toString());

const nodes = new Map<string, INode>();

if (result) {
    const graph = new DirectedGraph();
    // graph.addNode(solver.startNode?.id, { x: 0, y: 0, color: 'green', size: 4, });
    // nodes.set(`${solver.startNode!.id}`, solver.startNode!);
    for (const [n, p] of solver.parents!.entries()) {
        graph.addNode(n.id, {
            // x: n.nStep * 20, y: Math.random(),
            color: n.isGoal ? 'blue'
                : n.nExpanded == 0 ? 'red'
                : n.nExpanded !== undefined ? 'black'
                : 'gray',
            size: n.isGoal ? 3 : 2,
            label: `${n.measureIndex}/${n.voiceIndex};${n.thisCost.toFixed(1)}`,
            // type: n.type == 'harmony' ? 'square' : 'circle',
        });
        nodes.set(`${n.id}`, n);

        if (!p) continue;
        graph.addEdge(p.id, n.id, {
            size: n.thisCost / 100 * 0 + 0.2, type: 'line',
            color: n.isGoal ? 'blue'
                : n.nExpanded == 0 ? 'red'
                : 'lightgray',
        });
    }

    postMessage({
        type: 'ok',
        data: result.voices.map((x) => VoiceData.from(x).serialize()),
        source: toMxl.score(result),
        graph: graph.export()
    } satisfies MainMessage);
} else {
    postMessage({
        type: 'no-solution'
    } satisfies MainMessage);
}

self.onmessage = (x: MessageEvent<MainMessageIn>) => {
    if (x.data.type == 'query-score')
        postMessage({
            type: 'query-score-result',
            source: toMxl.score(nodes.get(x.data.node)?.score!)
        });
};

export type MainMessageIn = {
    type: 'query-score',
    node: string
}

export type MainMessage = {
    type: 'ok',
    data: Serialized<VoiceData>[],
    source: string,
    graph: object
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
} | {
    type: 'query-score-result',
    source: string
};
