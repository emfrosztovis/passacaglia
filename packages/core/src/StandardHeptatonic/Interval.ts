import { AsRational, Debug, Rational } from "common";
import { Interval } from "../Interval";
import { _System, StandardHeptatonicSystem } from "./System";
import { _Pitch } from "./Pitch";

const MultiplierAdverbs = ['', '', 'doubly', 'triply'];

function getMultiplierAdverb(n: Rational, word: string) {
    Debug.assert(n.num !== 0);
    if (n.num == 1) return word;
    if (n.den == 1 && n.num < MultiplierAdverbs.length)
        return `${MultiplierAdverbs[n.num]}-${word}`;
    return `${n}×-${word}`;
}

const Multipliers = ['', 'single', 'double', 'triple'];

function getMultiplier(n: Rational, word: string) {
    Debug.assert(n.num !== 0);
    if (n.num == 1) return word;
    if (n.den == 1 && n.num < MultiplierAdverbs.length)
        return `${Multipliers[n.num]} ${word}`;
    return `${n}-${word}`;
}

const Ordinals = ['unison', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'octave', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth'];

function steps2Ordinal(n: number) {
    Debug.assert(Number.isSafeInteger(n) && n >= 0);
    if (n < Ordinals.length) return Ordinals[n];
    if (n % 7 == 0) return getMultiplier(Rational.from(Math.floor(n / 7)), 'octave');

    const ord = n + 1;
    if (ord % 10 == 1) return `${ord}st`;
    if (ord % 10 == 2) return `${ord}nd`;
    if (ord % 10 == 3) return `${ord}rd`;
    return `${ord}th`;
}

type Quality = 'perfect' | 'major' | 'minor' | 'augmented' | 'diminished';

const Quality2Abbr: Record<Quality, string> = {
    perfect: 'P',
    major: 'M',
    minor: 'm',
    augmented: 'A',
    diminished: 'd'
};

const Abbr2Quality: Record<string, Quality> = {
    P: 'perfect',
    M: 'major',
    m: 'minor',
    A: 'augmented',
    d: 'diminished'
};

function makePefect(n: number): [number, Quality][] {
    return [
        [n-1, 'diminished'],
        [n, 'perfect'],
        [n+1, 'augmented']
    ];
}

function makeMajorMinor(n: number): [number, Quality][] {
    return [
        [n-2, 'diminished'],
        [n-1, 'minor'],
        [n, 'major'],
        [n+1, 'augmented'],
    ];
}

// the outer index is the number of steps
const IntervalData: [semitones: number, q: Quality][][] = [
    // unisons
    [
        [0, 'perfect'],
        [1, 'augmented']
    ],
    // seconds
    makeMajorMinor(2),
    // thirds
    makeMajorMinor(4),
    // fourths
    makePefect(5),
    // fifths
    makePefect(7),
    // sixths
    makeMajorMinor(9),
    // sevenths
    makeMajorMinor(11),
    // octaves
    makePefect(12)
];

/**
 * A signed interval in the standard heptatonic system.
 */
export class _Interval extends Interval<StandardHeptatonicSystem> {
    constructor(steps: number, distance: AsRational, sign: 1 | -1 = 1) {
        super(_System, steps, distance, sign);
    }

    /**
     * Parses an interval abbreviation in the format of sign (optional) + quality + number + further semitone differences (optional). Available qualities are `P` (perfect), `M` (major), `m` (minor), `A` (augmented) and `d` (diminished).
     *
     * "Further semitone differences" consists of a sign (`+` or `-`) and an integer or a fraction. For example, a doubly augmented third is `A3+1`. In this way you can also express complex intervals that have no official names, such as `d12+1/4`.
     *
     * The algorithm does *not* distinguish between intervals with the same steps and same semitones, such as `m3+1/2` and `M3-1/2`. They parse to the same interval object.
     */
    static parse(ex: string): _Interval | null {
        const match = ex.match(/^([+-])?([PMmAd])(\d+)([+-]?\d+(?:\/\d+)?)?$/);
        if (!match) return null;
        const quality = Abbr2Quality[match[2]];
        const number = Number.parseInt(match[3]);
        if (isNaN(number)) return null;
        const remainder = match[4] ? Rational.parse(match[4]) : new Rational(0);
        if (remainder === null) return null;

        const sign = match[1] == '-' ? -1 : 1;
        const steps = number - 1;

        let octaves = Math.floor(steps / 7);
        let simpleSteps = steps % 7;
        if (simpleSteps == 0 && octaves > 0) {
            simpleSteps = 7;
            octaves--;
        }

        const simpleSemitones = IntervalData[simpleSteps].find((x) => x[1] == quality)?.[0];
        if (simpleSemitones === undefined) return null;


        Debug.info(octaves, simpleSteps);

        return new _Interval(steps, remainder.add(simpleSemitones + octaves * 12), sign);
    }

    protected override _create(steps: number, distance: AsRational, sign: 1 | -1) {
        return new _Interval(steps, distance, sign) as this;
    }

    #getClosestWellKnown() {
        const simple = this.toSimple({ preserveUpToSteps: 7 });
        let diff: Rational | undefined, q: Quality | undefined;
        for (const [semitones, quality] of IntervalData[simple.steps]) {
            const d = simple.distance.sub(semitones);
            if (!diff
             || Math.abs(d.value()) < Math.abs(diff.value())
             || (Math.abs(d.value()) == Math.abs(diff.value())
              && ((d.num < 0 && quality == 'diminished')
               || (d.num > 0 && quality == 'augmented')))
            ) {
                diff = d;
                q = quality;
            }
        }
        Debug.assert(diff !== undefined && q !== undefined);
        return [diff, q] as const;
    }

    override toAbbreviation(opts?: { alwaysSigned?: boolean }): string {
        const [diff, q] = this.#getClosestWellKnown();
        const quality = Quality2Abbr[q];
        const remainder = diff.num == 0 ? '' : diff.toString({ alwaysSigned: true });
        const sign =
            (this.sign > 0 && !opts?.alwaysSigned) ? ''
           : this.sign < 0 ? '-' : '+';
        return `${sign}${quality}${this.steps+1}${remainder}`;
    }

    override toString(opts?: { alwaysSigned?: boolean }): string {
        const [diff, q] = this.#getClosestWellKnown();
        const name = steps2Ordinal(this.steps);

        let quality = // use "octave" instead of "perfect octave"
            (this.steps % 7 == 0 && q == 'perfect') ? '' : q + ' ';
        let main: string;
        if (diff.num == 0)
            main = `${quality}${name}`;
        else if ((diff.num <= 0 && q == 'diminished') || (diff.num >= 0 && q == 'augmented'))
            main = `${getMultiplierAdverb(diff.abs().add(1), quality)}${name}`;
        else
            main = `${quality}${name} ${diff.toString({ alwaysSigned: true, mixedFraction: true })}`;

        const sign =
            (this.sign > 0 && !opts?.alwaysSigned) ? ''
           : this.sign < 0 ? ' downward' : ' upward';
        return `${main}${sign}`;
    }
}
