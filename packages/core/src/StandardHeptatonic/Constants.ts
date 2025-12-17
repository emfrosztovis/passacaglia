/* node:coverage ignore file -- @preserve */

import { _Interval } from "./Interval";
import { _Pitch } from "./Pitch";
import { _Scale } from "./Scale";

export const PitchClasses = {
    c: new _Pitch(0),
    d: new _Pitch(1),
    e: new _Pitch(2),
    f: new _Pitch(3),
    g: new _Pitch(4),
    a: new _Pitch(5),
    b: new _Pitch(6),
};

const CChromatic = _Scale.fromPitches(['c', 'cs', 'df', 'd', 'ds', 'ef', 'e', 'f', 'fs', 'gf', 'g', 'gs', 'af', 'a', 'as', 'bf', 'b'].map((x) => _Pitch.parse(x)!));

const CMajor = _Scale.fromIntervals(_Pitch.parse('c0')!,
    ['M2', 'M2', 'm2', 'M2', 'M2', 'M2', 'm2'].map((x) => _Interval.parse(x)!));
const CHarmonicMinor = _Scale.fromIntervals(_Pitch.parse('c0')!,
    ['M2', 'm2', 'M2', 'M2', 'm2', 'A2', 'm2'].map((x) => _Interval.parse(x)!));

const CCompleteMinor = _Scale.fromPitches(
    ['c', 'd', 'ef', 'f', 'g', 'af', 'a', 'bf', 'b'].map((x) => _Pitch.parse(x)!));

const C = {
    ionian     : CMajor,
    dorian     : CMajor.rotate(1),
    phrygian   : CMajor.rotate(2),
    lydian     : CMajor.rotate(3),
    mixolydian : CMajor.rotate(4),
    aeolian    : CMajor.rotate(5),
    locrian    : CMajor.rotate(6),

    major: CMajor,
    harmonicMinor: CHarmonicMinor,

    /**
     * Chromatic scale with enharmonics.
     *
     * ```
     *  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16
     *  C Cs Df  D Ds Ef  E  F Fs Gf  G Gs Af  A As Bf  B
     * ````
     */
    chromatic: CChromatic,

    /**
     * Includes all altered tones as degrees.
     *
     * ```
     *  0  1  2  3  4  5  6  7  8
     *  C  D Ef  F  G Af  A Bf  B
     * ````
     */
    completeMinor: CCompleteMinor,
};

export const Scales = {
    C: C,

    major      (root: _Pitch) { return CMajor.transposeTo(root); },
    harmonicMinor(root: _Pitch) { return CHarmonicMinor.transposeTo(root); },

    ionian     (root: _Pitch) { return C.ionian.transposeTo(root); },
    dorian     (root: _Pitch) { return C.dorian.transposeTo(root); },
    phrygian   (root: _Pitch) { return C.phrygian.transposeTo(root); },
    lydian     (root: _Pitch) { return C.lydian.transposeTo(root); },
    mixolydian (root: _Pitch) { return C.mixolydian.transposeTo(root); },
    aeolian    (root: _Pitch) { return C.aeolian.transposeTo(root); },
    locrian    (root: _Pitch) { return C.locrian.transposeTo(root); },
};
