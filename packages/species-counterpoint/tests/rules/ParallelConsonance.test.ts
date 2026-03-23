import { describe, test, expect } from "vitest";
import { Chord } from "../../src/Chord";
import { H, I } from "../../src/Internal";
import { CounterpointContext, CounterpointScoreBuilder, parseNotes, Rules, Score } from "../../src";
import { Rational } from "common";
import { Clef } from "musicxml";

const ctx = new CounterpointContext(2, { measureLength: Rational.from(4) });

test('consecutive perfects', () => {
    let score: Score;

    score = new CounterpointScoreBuilder(ctx)
        .cantus(Clef.Treble, [
            parseNotes(['c5', 1], ['b4', 1], ['a4', 1], ['g4', 1]),
            parseNotes(['f4', 4]),
        ])
        .cantus(Clef.Bass, [
            parseNotes(['e3', 4]),
            parseNotes(['f3', 4]),
        ])
        .build(H.Scales.C.major);

    expect(Rules.forbidPerfectsBySimilarMotion(
        ctx, score, score.voices[1].noteAt(4)!)).toBe(0);

    score = new CounterpointScoreBuilder(ctx)
        .cantus(Clef.Treble, [
            parseNotes(['c5', 1], ['b4', 1], ['a4', 1], ['g4', 1]),
            parseNotes(['f4', 4]),
        ])
        .cantus(Clef.Bass, [
            parseNotes(['g3', 4]),
            parseNotes(['f3', 4]),
        ])
        .build(H.Scales.C.major);

    expect(Rules.forbidPerfectsBySimilarMotion(
        ctx, score, score.voices[1].noteAt(4)!)).toBe(Infinity);

    score = new CounterpointScoreBuilder(ctx)
        .cantus(Clef.Treble, [
            parseNotes(['c5', 1], ['b4', 1], ['a4', 1], ['g4', 1]),
            parseNotes(['f4', 4]),
        ])
        .cantus(Clef.Bass, [
            parseNotes(['c3', 4]),
            parseNotes(['f3', 4]),
        ])
        .build(H.Scales.C.major);

    expect(Rules.forbidPerfectsBySimilarMotion(
        ctx, score, score.voices[1].noteAt(4)!)).toBe(Infinity);

    score = new CounterpointScoreBuilder(ctx)
        .cantus(Clef.Treble, [
            parseNotes(['e5', 2], ['f5', 1], ['g5', 1]),
            parseNotes(['a5', 4]),
        ])
        .cantus(Clef.Alto, [
            parseNotes(['e4', 2], ['d4', 1], ['c4', 1]),
            parseNotes(['a4', 4]),
        ])
        .cantus(Clef.Bass, [
            parseNotes(['c3', 2], ['d3', 1], ['e3', 1]),
            parseNotes([null, 4]),
        ])
        .build(H.Scales.C.major);

    expect(Rules.forbidPerfectsBySimilarMotion(
        ctx, score, score.voices[1].noteAt(4)!)).toBe(Infinity);
});

test('perfect by similar motion', () => {
    let score: Score;

    score = new CounterpointScoreBuilder(ctx)
        .cantus(Clef.Treble, [
            parseNotes(['g4', 4]),
            parseNotes(['f4', 4]),
        ])
        .cantus(Clef.Bass, [
            parseNotes(['a3', 4]),
            parseNotes(['f3', 4]),
        ])
        .build(H.Scales.C.major);

    expect(Rules.forbidPerfectsBySimilarMotion(
        ctx, score, score.voices[1].noteAt(4)!)).toBe(Infinity);
});
