import { AsRational, Debug, Hashable, HashMap, rotateArray } from "common";
import { PitchSystem } from "core";
import { EnharmonicPitchClass } from "./PitchClass";

/**
 * Base class for tone row-like structures that provides basic transformation methods.
 */
export abstract class ToneRowBase<S extends PitchSystem> implements Hashable {
    protected constructor(
        public readonly pitchSystem: S,
        readonly notes: readonly EnharmonicPitchClass<S>[]
    ) {}

    hash(): string {
        return this.notes.map((x) => x.hash()).join(';');
    }

    protected abstract _create(notes: readonly EnharmonicPitchClass<S>[]): this;

    transposeTo(target: EnharmonicPitchClass<S>) {
        return this.transpose(target.pc.sub(this.notes[0].pc));
    }

    transpose(n: AsRational) {
        return this._create(this.notes.map((x) => x.transpose(n)));
    }

    reverse() {
        return this._create([...this.notes].reverse());
    }

    invert() {
        const first = this.notes[0].pc;
        return this._create(this.notes.map((x) => {
            const dist = first.sub(x.pc);
            return EnharmonicPitchClass.from(x.system, first.add(dist));
        }));
    }

    multiply(n: AsRational) {
        return this._create(this.notes.map((x) => x.multiply(n)));
    }

    rotate(n: number) {
        const rotated = rotateArray(this.notes, n);
        const t = this.notes[0].pc.sub(rotated[0].pc);
        return this._create(rotated.map((x) => x.transpose(t)));
    }
}

/**
 * Represents a sequence of pitch classes in a pitch system, without further assumptions.
 */
export class GeneralizedToneRow<S extends PitchSystem> extends ToneRowBase<S> {
    protected constructor(pitchSystem: S, notes: readonly EnharmonicPitchClass<S>[]) {
        super(pitchSystem, notes);
    }

    static new<S extends PitchSystem>(notes: readonly EnharmonicPitchClass<S>[]) {
        Debug.assert(notes.length > 0);
        return new GeneralizedToneRow(notes[0].system, notes);
    }

    static from<S extends PitchSystem>(pitchSystem: S, notes: readonly number[]) {
        Debug.assert(notes.length > 0);
        return new GeneralizedToneRow(pitchSystem,
            notes.map((x) => EnharmonicPitchClass.from(pitchSystem, x)));
    }

    protected _create(notes: readonly EnharmonicPitchClass<S>[]): this {
        return new GeneralizedToneRow(this.pitchSystem, notes) as this;
    }
}

/**
 * Represents a traditional tone row in a pitch system, i.e. a permutation of pitch classes in that system. Transformation methods will throw if the result is not a tone row.
 */
export class ToneRow<S extends PitchSystem> extends ToneRowBase<S> {
    protected constructor(pitchSystem: S, notes: readonly  EnharmonicPitchClass<S>[]) {
        super(pitchSystem, notes);
        // no validation here
    }

    #validated() {
        Debug.assert(this.notes.length == this.pitchSystem.nPitchClasses);
        const set = new HashMap<EnharmonicPitchClass<S>>();
        Debug.assert(!this.notes.find((x) => {
            if (x.pc.den !== 1) return true;
            if (set.has(x)) return true;
            set.set(x);
        }));
        return this;
    }

    static new<S extends PitchSystem>(notes: readonly EnharmonicPitchClass<S>[]) {
        Debug.assert(notes.length > 0);
        return new ToneRow(notes[0].system, notes).#validated();
    }

    static from<S extends PitchSystem>(pitchSystem: S, notes: readonly number[]) {
        Debug.assert(notes.length > 0);
        return new ToneRow(pitchSystem,
            notes.map((x) => EnharmonicPitchClass.from(pitchSystem, x))).#validated();
    }

    protected _create(notes: readonly EnharmonicPitchClass<S>[]): this {
        return (new ToneRow(this.pitchSystem, notes) as this).#validated();
    }
}
