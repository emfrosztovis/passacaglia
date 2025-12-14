import { AsRational, Debug } from "common";
import { Degree } from "../Degree";
import { Scale } from "../Scale";
import { _System, StandardHeptatonicSystem } from "./System";
import { _Pitch } from "./Pitch";
import { Accidental } from "./Accidental";
import { _Interval } from "./Interval";

const RomanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];

export class _Scale extends Scale<StandardHeptatonicSystem> {
    protected constructor(ints: readonly _Interval[], degs: readonly _Pitch[]) {
        super(_System, ints, degs);
    }

    protected override _create(ints: readonly _Interval[], degs: readonly _Pitch[]) {
        return new _Scale(ints, degs) as this;
    }

    protected override _createDegree(index: number, acci: AsRational, period: number): _Degree {
        return new _Degree(this, index, acci, period);
    }

    override at = super.at as (i: number, acci?: AsRational) => _Degree;
    override getExactDegree = super.getExactDegree as
        (p: _Pitch, opt?: { allowEnharmonic?: boolean }) => _Degree | null;

    override getDegreesInRange = super.getDegreesInRange as
        (l: _Pitch, r: _Pitch) => _Degree[];

    static fromIntervals(root: _Pitch, ints: _Interval[]) {
        const degs = [root];
        let current = root;
        ints.forEach((int, i) => {
            Debug.assert(int.sign == 1);
            current = current.add(int);
            if (i == ints.length - 1)
                Debug.assert(root.distanceTo(current).value() == _System.nPitchClasses);
            else
                degs.push(current);
        })
        return new _Scale(ints, degs);
    }

    static fromPitches(degs: _Pitch[]) {
        const ints = [];
        for (let i = 1; i < degs.length; i++) {
            const int = degs[i-1].intervalTo(degs[i]);
            Debug.assert(int.sign > 0);
            ints.push(int);
        }
        const wrap = degs.at(-1)!.intervalTo(degs[0].addPeriod(1));
        Debug.assert(wrap.sign > 0);
        Debug.assert(wrap.distance.value() < _System.nPitchClasses);
        ints.push(wrap);
        return new _Scale(ints, degs);
    }

    // TODO: support periods
    parseDegree(ex: string): _Degree | null {
        const match = ex.match(/^(?:([ivx]+)|\[(\d+)\])(.*)$/);
        if (!match) return null;

        const acci = Accidental.parse(match[3]);
        if (!acci) return null;

        if (match[1]) {
            const romanDegree = RomanNumerals.findIndex((x) => x == match[1].toLowerCase());
            if (romanDegree < 0) return null;
            return this._createDegree(romanDegree, acci, 0);
        } else {
            const degree = Number.parseInt(match[2]) - 1;
            if (isNaN(degree) || degree < 0 || degree >= this.degrees.length) return null;
            return this._createDegree(degree, acci, 0);
        }
    }
}

export class _Degree extends Degree<StandardHeptatonicSystem> {
    public override readonly scale: _Scale;

    constructor(
        scale: _Scale,
        index: number,
        acci: AsRational,
        period: number
    ) {
        super(_System, scale, index, acci, period);
        this.scale = scale;
    }

    protected _create(index: number, acci: AsRational, period: number) {
        return new _Degree(this.scale, index, acci, period) as this;
    }

    override toPitch = super.toPitch as () => _Pitch;

    toString(opt?: { preferArabic?: boolean }): string {
        const name = (opt?.preferArabic && this.scale.degrees.length <= RomanNumerals.length)
            ? `[${this.index + 1}]` : RomanNumerals[this.index];
        return `${name}${Accidental.print(this.acci)}`;
    }
}
