import { Debug } from "common";
import { NonHarmonicType, Note } from "./Voice";
import { CounterpointMeasure, CounterpointNoteCursor, MelodicContext, Step } from "./Basic";
import { HashMap } from "common";
import { parsePreferred } from "./rules/Scales";
import { H } from "./Internal";
import { Score, Parameters } from "./Score";
import { Chord, ChordCursor } from "./Chord";

export type LocalRule = (
    ctx: CounterpointContext, s: Score, current: CounterpointNoteCursor
) => number;

export type GlobalRule = (
    ctx: CounterpointContext, s: Score
) => string | null;

export type CandidateRule = (
    ctx: CounterpointContext, s: Score, current: CounterpointNoteCursor,
    candidates: HashMap<H.Pitch, number> | null, type?: NonHarmonicType
) => HashMap<H.Pitch, number>;

export type HarmonyRule = (
    ctx: CounterpointContext, s: Score, current: ChordCursor,
    candidates: HashMap<Chord, number> | null
) => HashMap<Chord, number>;

export class CounterpointContext {
    localRules: LocalRule[] = [];
    globalRules: GlobalRule[] = [];
    candidateRulesBefore: CandidateRule[] = [];
    candidateRulesAfter: CandidateRule[] = [];
    harmonyRules: HarmonyRule[] = [];

    nonHarmonicToneRules: Partial<Record<NonHarmonicType, CandidateRule[]>> = {};
    harmonicToneRules: CandidateRule[] = [];

    similarMotionCost = 80;
    obliqueMotionCost = 40;
    contraryMotionCost = 0;

    harmonyIntervals = parsePreferred(
        ['m3', 0], ['M3', 0], ['m6', 0], ['M6', 0],
        ['P4', 10], ['P5', 20], ['P8', 50], ['P1', 100]);

    melodicIntervals = parsePreferred(
        ['m2',   0], ['M2',   0], ['-m2',  40], ['-M2',  40],
        ['m3',  90], ['M3',  90], ['-m3',  90], ['-M3',  90],
        ['P4',  90],              ['-P4',  90],
        ['P5',  90],              ['-P5',  90],
        ['m6',  90], ['M6',  90], ['-m6',  90], ['-M6',  90],
        ['P8', 120],              ['-P8', 120],
        ['P1', 500],
    );

    forbidWithBass = [H.Interval.parse('P4')!];
    allowUnison = false;
    stochastic = false;

    updateMelodicContext(old: MelodicContext, p: H.Pitch | null): MelodicContext {
        if (old.lastPitch === undefined) return {
            ...old,
            lastPitch: p ?? undefined
        };
        const int = p ? old.lastPitch.intervalTo(p) : undefined;
        if (!int || int.steps <= 1) {
            // clear leaps
            return {
                lastPitch: p ?? undefined,
                leapDirection: 0,
                nConsecutiveLeaps: 0,
                n3rdLeaps: 0,
                nUnidirectionalConsecutiveLeaps: 0,
                nUnidirectional3rdLeaps: 0
            };
        }
        const isThird = int.steps == 2;
        const isUnidirectional = int.sign == old.leapDirection;
        return {
            lastPitch: p ?? undefined,
            leapDirection: int.sign,
            nConsecutiveLeaps: old.nConsecutiveLeaps + 1,
            n3rdLeaps: old.n3rdLeaps + (isThird ? 1 : 0),
            nUnidirectionalConsecutiveLeaps: isUnidirectional
                ? old.nUnidirectionalConsecutiveLeaps + 1
                : 0,
            nUnidirectional3rdLeaps: isUnidirectional
                ? old.nUnidirectional3rdLeaps + (isThird ? 1 : 0)
                : 0,
        };
    }

    getCandidates(
        rules: CandidateRule[], s: Score, current: CounterpointNoteCursor,
        type?: NonHarmonicType
    ) {
        let candidates: HashMap<H.Pitch, number> | null = null;
        for (const rule of [...this.candidateRulesBefore, ...rules, ...this.candidateRulesAfter]) {
            candidates = rule(this, s, current, candidates, type);
            if (candidates.size == 0) return candidates;
        }
        Debug.assert(candidates !== null);
        return candidates;
    }

    fillNonHarmonicTone(
        types: NonHarmonicType[],
        s: Score, note: CounterpointNoteCursor,
        create: (n: Note, p: H.Pitch) => CounterpointMeasure,
        costOffset = 0
    ){
        const results: Step[] = [];

        for (const type of types) {
            const rules = this.nonHarmonicToneRules[type];
            if (!rules) {
                // Debug.info('no rules for', type);
                continue;
            }
            results.push(...this.fillIn(rules, s, note, type, create, costOffset));
        }

        return results;
    }

    fillHarmonicTone(
        s: Score, note: CounterpointNoteCursor,
        create: (n: Note, p: H.Pitch) => CounterpointMeasure,
        costOffset = 0
    ) {
        return this.fillIn(this.harmonicToneRules, s, note, undefined, create, costOffset);
    }

    private fillIn(
        rules: CandidateRule[],
        s: Score, note: CounterpointNoteCursor,
        type: NonHarmonicType | undefined,
        create: (n: Note, p: H.Pitch) => CounterpointMeasure,
        costOffset = 0,
    ): Step[] {
        const measure = note.parent;
        const voice = measure.container;
        const candidates = [...this.getCandidates(rules, s, note, type).entries()];

        return candidates.flatMap(([p, cost]) => {
            const m = create(new Note(note.duration, p, type), p);
            const newVoice = voice.replaceMeasure(measure.index, m);
            const newScore = s.replaceVoice(voice.index, newVoice);
            const newCursor = newVoice.noteAt(note.globalTime) as CounterpointNoteCursor;
            Debug.assert(newCursor !== undefined);

            for (const rule of this.localRules) {
                const c = rule(this, newScore, newCursor);
                if (c === Infinity) return [];
                cost += c;
            }
            return { measure: m, cost: cost + costOffset, advanced: note.duration };
        });
    }

    getChordCandidates(
        s: Score, current: ChordCursor
    ) {
        let candidates: HashMap<Chord, number> | null = null;
        for (const rule of this.harmonyRules) {
            candidates = rule(this, s, current, candidates);
            if (candidates.size == 0) return candidates;
        }
        Debug.assert(candidates !== null);
        return candidates;
    }

    constructor(
        public readonly targetMeasures: number,
        public readonly parameters: Parameters,
    ) {}
}
