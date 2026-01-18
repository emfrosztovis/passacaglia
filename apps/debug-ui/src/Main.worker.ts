import { Chord, Chords, CounterpointContext, CounterpointScoreBuilder, CounterpointSolver, defineImitation, MeasureData, Note, parseNotes, Rules, Score, Species1, Species2, Species3, Species4, Species5, VoiceData, type INode } from 'species-counterpoint';
import { Debug, LogLevel, Rational, setLogger, type AsRational, type Serialized } from 'common';
import { StandardHeptatonic } from 'core';
import { Clef, toMxl } from 'musicxml';
import { DirectedGraph } from 'graphology';

import * as d3 from 'd3';

const ctx = new CounterpointContext(
    20, // targetMeasures
    {
        measureLength: new Rational(4)
    }
);

ctx.harmonyRules = [
    Rules.enforceValidChords
];

ctx.localRules = [
    Rules.limitConsecutiveLeaps,
    Rules.forbidPerfectsBySimilarMotion,
    Rules.forbidNearbyPerfects,
    Rules.prioritizeVoiceMotion,
    // Rules.enforceVerticalConsonanceWithMovingLocal,
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
    Rules.avoidRepeat2,
];

ctx.candidateRulesAfter = [
    Rules.enforceMelodyIntervals,
    Rules.enforceLeapPreparationBefore,
    Rules.enforceLeapPreparationAfter,
];

ctx.harmonicToneRules = [
    Rules.enforceChordTone,
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

// ctx.allowUnison = true;
// ctx.similarMotionCost = 0;
// ctx.obliqueMotionCost = 0;

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
    // .soprano(defineImitation({
    //     forbidRepeatedNotes: false,
    //     maxConsecutiveLeaps: Infinity,
    //     maxIgnorable3rdLeaps: Infinity,
    //     maxUnidirectionalConsecutiveLeaps: Infinity,
    //     maxUnidirectionalIgnorable3rdLeaps: Infinity
    // }, 1, 2, (p) => [p.add(StandardHeptatonic.Interval.parse('P5')!)]))
    // .alto(Species5)
    .soprano(Species2)
    .soprano(Species2)
    .soprano(Species2)
    // .alto(Species5)
    .alto(Species5)
    .tenor(Species5)
    // .cantus(Clef.Bass, [
    //     parseNotes(['c3', ctx.parameters.measureLength]),
    //     parseNotes(['d3', ctx.parameters.measureLength]),
    //     parseNotes(['e3', ctx.parameters.measureLength]),
    //     parseNotes(['g3', ctx.parameters.measureLength]),
    //     parseNotes(['a3', ctx.parameters.measureLength]),
    //     parseNotes(['f3', ctx.parameters.measureLength]),
    //     parseNotes(['e3', ctx.parameters.measureLength]),
    //     parseNotes(['d3', ctx.parameters.measureLength]),
    //     parseNotes(['c3', ctx.parameters.measureLength]),
    //     parseNotes(['d3', ctx.parameters.measureLength]),
    //     parseNotes(['e3', ctx.parameters.measureLength]),
    //     parseNotes(['g3', ctx.parameters.measureLength]),
    //     parseNotes(['a3', ctx.parameters.measureLength]),
    //     parseNotes(['f3', ctx.parameters.measureLength]),
    //     parseNotes(['e3', ctx.parameters.measureLength]),
    //     parseNotes(['b2', ctx.parameters.measureLength]),
    //     parseNotes(['c3', ctx.parameters.measureLength]),
    // ])
    // .cantus(Clef.Bass, [
    //     parseNotes(['c3', ctx.parameters.measureLength]),
    //     parseNotes(['g3', ctx.parameters.measureLength]),
    //     parseNotes(['f3', ctx.parameters.measureLength]),
    //     parseNotes(['ef3', ctx.parameters.measureLength]),
    //     parseNotes(['f3', ctx.parameters.measureLength]),
    //     parseNotes(['d3', ctx.parameters.measureLength]),
    //     parseNotes(['b2', ctx.parameters.measureLength]),
    //     parseNotes(['c3', ctx.parameters.measureLength]),
    // ])
    // .build(StandardHeptatonic.Scales.C.completeMinor)
    .build(StandardHeptatonic.Scales.C.major)
;

// score.harmony.elements[0]!.chord =
//     Chords.major.withBass(StandardHeptatonic.PitchClasses.c);

// score.harmony.elements[score.harmony.elements.length - 1]!.chord =
//     Chords.major.withBass(StandardHeptatonic.PitchClasses.c);

// score.harmony.elements[score.harmony.elements.length - 2]!.chord =
//     Chords.major.withBass(StandardHeptatonic.PitchClasses.g);

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

// solver.limitSteps = 500;
solver.removeOld = 8;
solver.batch = 5;
solver.reportInterval = 1000;

const result = solver.aStar(score, {
    type: 'constant',
    value: 50,
});
// const result = solver.beamSearch(score, 200);

console.log(result?.toString());

const nodes = new Map<string, INode>();
const graph = new DirectedGraph();

type Node = d3.HierarchyNode<[INode, INode | undefined]>;

if (false) {
    function addNode(n: Node, size?: number, x?: number, y?: number) {
        if (!n.id) return;
        const node = n.data[0];
        graph.addNode(n.id, {
            color: node === solver.startNode ? 'green'
                : node.isGoal ? 'blue'
                : node.nExpanded == 0 ? 'red'
                : node.nExpanded !== undefined ? 'black'
                : 'gray',
            size: node === solver.startNode ? 3
                : size ?? (node.isGoal ? 3 : 2),
            label: `${node.measureIndex}/${node.voiceIndex};${node.thisCost.toFixed(1)}`,
            // x: n.y! * Math.cos(n.x!), y: n.y! * Math.sin(n.x!)
            x: x ?? n.y!, y: y ?? (- n.x!)
        });
    }

    function addEdge(m: Node, n: Node) {
        const node = m.data[0];
        graph.addEdge(n.id, m.id, {
            size: node.thisCost / 100 * 0 + 0.2, type: 'line',
            color: node.isGoal ? 'blue'
                    : node.nExpanded == 0 ? 'red'
                    : 'lightgray',
        });
    }

    const operator = d3.stratify<[INode, INode | undefined]>()
        .id(([n, _]) => `${n.id}`)
        .parentId(([_, p]) => p ? `${p.id}` : undefined);
    const root = operator([...solver.parents!.entries()]);

    const nonLeaves: [INode, INode | undefined][] = [];
    root.each((x) => {
        nodes.set(x.id!, x.data[0]);
        if (!x.children || x.children.length == 0) return;
        nonLeaves.push(x.data);
    });
    const nonLeavesRoot = operator(nonLeaves);

    d3.tree<[INode, INode | undefined]>()
        // .size([Math.PI * 2, 1000])
        .nodeSize([6, 15])
        (nonLeavesRoot);

    nonLeavesRoot.eachAfter((n) => {
        if (!n.id) return;
        addNode(n);

        if (!n.children) return;
        for (const c of n.children)
            addEdge(c, n);
    });

    root.leaves().forEach((n) => {
        if (!n.id || n.data[0] === solver.startNode) return;
        const p = n.parent!;
        Debug.assert(p.children !== undefined);

        const px = graph.getNodeAttribute(p.id, 'x') as number;
        const py = graph.getNodeAttribute(p.id, 'y') as number;
        const allLeaves = p.children.filter((x) => !x.children?.length);

        const total = allLeaves.length;
        const i = allLeaves.findIndex((x) => x.id == n.id);
        Debug.assert(i >= 0);

        const angleOne = total <= 1 ? 0 : Math.PI * 0.6 / (total - 1);
        const angle = angleOne * i - angleOne * ((total - 1) / 2);

        addNode(n, 0.5, px + Math.cos(angle) * 5, py - Math.sin(angle) * 5);
        addEdge(n, p);
    });
}

postMessage({
    type: 'graph',
    graph: graph.export()
} satisfies MainMessage);

if (result) {
    const ms: MeasureData[] = [];
    for (let i = 0; i < ctx.targetMeasures; i++) {
        const t = ctx.parameters.measureLength.mul(i);
        const p1 = (dt: AsRational) => result.voices[0]?.noteAt(t.add(dt))?.value.pitch;
        const p2 = (dt: AsRational) => result.voices[1]?.noteAt(t.add(dt))?.value.pitch;
        const p3 = (dt: AsRational) => result.voices[2]?.noteAt(t.add(dt))?.value.pitch;
        // Debug.assert(!!(p1 && p2 && p3));
        ms.push(new MeasureData(
            [
                new Note(Rational.from(0.5), p3(0)),
                new Note(Rational.from(0.5), p1(0)),
                new Note(Rational.from(0.5), p2(1)),
                new Note(Rational.from(0.5), p1(1)),
                new Note(Rational.from(0.5), p3(2)),
                new Note(Rational.from(0.5), p1(2)),
                new Note(Rational.from(0.5), p2(3)),
                new Note(Rational.from(0.5), p1(3)),
            ],
            ctx.parameters.measureLength
        ));
    }
    const newVoice = new VoiceData(ms, 0, 'Rendered', Clef.Treble);
    const newScore = new Score(ctx.parameters,
        [newVoice, ...result.voices.slice(3)], result.harmony);

    postMessage({
        type: 'ok',
        data: newScore.voices.map((x) => VoiceData.from(x).serialize()),
        source: toMxl.score(newScore),
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
} | {
    type: 'graph',
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
