import { AsRational, Debug, Rational } from 'common';
import { StandardHeptatonic as H } from 'core';

export { StandardHeptatonic as H } from 'core';
export const P = H.Pitch;
export const PC = H.PitchClasses;
export const I = H.Interval;
export const S = H.Scale;
export const Scales = H.Scales;

export type Note = {
    /**
     * `null` means either it is not filled in, or it's a rest
     */
    pitch: H.Pitch | null,
    position: Rational,
    length: Rational
};

export type GlobalNote = Note & {
    measureIndex: number,
    voiceIndex: number,
    globalPosition: Rational
};

export function parseNotes(...notes: [string, AsRational][]) {
    const n: Note[] = [];
    let position = new Rational(0);
    for (const [p, len] of notes) {
        const pitch = H.Pitch.parse(p);
        const length = Rational.from(len);
        Debug.assert(pitch !== null);
        n.push({ pitch, position, length });
        position = position.add(length);
    }
    return n;
}

export abstract class Measure {
    constructor(
        public readonly voiceIndex: number,
        public readonly index: number,
    ) {
        Debug.assert(voiceIndex >= 0);
        Debug.assert(index >= 0);
    }

    abstract readonly notes: Note[];
    abstract readonly writable: boolean;
    abstract hash(): string;

    protected hashNotes(): string {
        return this.notes.map((x) => {
            const p = x.pitch ? x.pitch.ord().toString() : '#';
            return `${p},${x.length},${x.position}`;
        }).join();
    }

    notesBetween(t0: Rational, t1: Rational, inclusive = false): Note[] {
        return this.notes.filter((x) => {
            const d0 = t0.sub(x.position.add(x.length));
            const d1 = t1.sub(x.position);
            if (d0.num >= 0) return false;
            if (d1.num < 0 || (!inclusive && d1.num == 0)) return false;
            return true;
        });
    }

    noteAt(localT: Rational): Note {
        const found = this.notes.find((x) => {
            const d = localT.sub(x.position);
            if (d.num < 0) return false;
            if (d.sub(x.length).num >= 0) return false;
            return true;
        });
        Debug.assert(found !== undefined);
        return found;
    }

    noteBefore(localT: Rational): Note | null {
        const i = this.notes.findIndex((x) => {
            const d = localT.sub(x.position);
            if (d.num < 0) return false;
            if (localT.sub(x.length).num < 0) return false;
            return true;
        });
        if (i < 1) return null;
        return this.notes.at(i-1)!;
    }

    toString(): string {
        return this.notes.map((x) => `${x.pitch}`).join(' ');
    }
}

export abstract class Voice {
    constructor(
        public readonly index: number,
    ) {
        Debug.assert(index >= 0);
    }

    abstract measures: Measure[];
    abstract readonly name: string;

    abstract clone(): this;

    hash(): string {
        return this.measures.map((x) => x.hash()).join(';');
    }

    toString(): string {
        return this.measures.map((x) => x.toString()).join(' | ');
    }
}

export type Parameters = {
    measureLength: 4;
};

export class Score {
    constructor(
        public readonly parameters: Parameters,
        public readonly voices: Voice[]
    ) {}

    hash(): string {
        return this.voices.map((x) => x.hash()).join('|');
    }

    toString() {
        return this.voices.map((x) => x.toString()).join('\n');
    }

    replaceMeasure(iv: number, i: number, measure: Measure) {
        const newScore = this.clone();
        newScore.voices[iv].measures[i] = measure;
        return newScore;
    }

    measureAt(t: AsRational, iv: number) {
        t = Rational.from(t);
        Debug.assert(iv >= 0 && iv < this.voices.length);
        const i = Math.floor(t.div(this.parameters.measureLength).value());
        const v = this.voices[iv];
        if (i >= v.measures.length) return null;
        return v.measures[i];
    }

    noteBetween(t0: AsRational, t1: AsRational, iv: number, inclusive = false): GlobalNote[] {
        t0 = Rational.from(t0);
        t1 = Rational.from(t1);
        const i0 = t0.div(this.parameters.measureLength).value();
        const i1 = t1.div(this.parameters.measureLength).value();
        const v = this.voices[iv];
        const notes: GlobalNote[] = [];
        for (let i = Math.floor(i0); (inclusive ? i <= i1 : i < i1); i++) {
            if (i >= v.measures.length) break;
            const offset = i * this.parameters.measureLength;
            const m = v.measures[i];
            notes.push(...m.notesBetween(t0.sub(offset), t1.sub(offset), inclusive)
                .map((n) => ({ ...n,
                    globalPosition: n.position.add(offset),
                    voiceIndex: m.voiceIndex,
                    measureIndex: m.index
                })));
        }
        return notes;
    }

    noteAt(t: AsRational, iv: number): GlobalNote | null {
        t = Rational.from(t);
        const m = this.measureAt(t, iv);
        if (!m) return m;
        const n = m.noteAt(t.modulo(this.parameters.measureLength));
        return { ...n,
            globalPosition: n.position.add(m.index * this.parameters.measureLength),
            voiceIndex: m.voiceIndex,
            measureIndex: m.index
        };
    }

    noteBefore(t: AsRational, iv: number): GlobalNote | null {
        t = Rational.from(t);
        Debug.assert(iv >= 0 && iv < this.voices.length);
        const i = Math.floor(t.div(this.parameters.measureLength).value());
        const v = this.voices[iv];
        if (i >= v.measures.length || i < 0) return null;

        const m = v.measures[i];
        const n = m.noteBefore(t.modulo(this.parameters.measureLength))
        if (n) return { ...n,
            globalPosition: n.position.add(m.index * this.parameters.measureLength),
            voiceIndex: m.voiceIndex,
            measureIndex: m.index
        };

        // return last note from the previous measure
        if (i == 0) return null;
        const m2 = v.measures[i-1];
        const n2 = m2.notes.at(-1)!;
        return { ...n2,
            globalPosition: n2.position.add(m2.index * this.parameters.measureLength),
            voiceIndex: m2.voiceIndex,
            measureIndex: m2.index
        };
    }

    clone() {
        return new Score(this.parameters, this.voices.map((x) => x.clone()));
    }
}
