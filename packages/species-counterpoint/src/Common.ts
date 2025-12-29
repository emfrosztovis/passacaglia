import { AsRational, Debug, Rational } from 'common';
import { Cursor, DurationalElement, StandardHeptatonic as H, SequentialContainer } from 'core';

export { StandardHeptatonic as H } from 'core';
export const P = H.Pitch;
export const PC = H.PitchClasses;
export const I = H.Interval;
export const S = H.Scale;
export const Scales = H.Scales;

export function parseNotes(...notes: [string, AsRational][]) {
    const n: Note[] = [];
    for (const [p, len] of notes) {
        const pitch = H.Pitch.parse(p);
        const duration = Rational.from(len);
        Debug.assert(pitch !== null);
        n.push(new Note(duration, pitch));
    }
    return n;
}

export type NoteAttributes = {
    /**
     * Whether the note is a passing tone.
     */
    isPassingTone?: boolean;
    /**
     * Whether the note is tied to the previous one.
     */
    isTied?: boolean;
}

export class Note implements DurationalElement {
    duration: Rational;

    /**
     * `null` means either it is not filled in, or it's a rest
     */
    pitch: H.Pitch | null;
    attrs: NoteAttributes;

    constructor(d: Rational, p?: H.Pitch | null, attrs?: NoteAttributes) {
        this.duration = d;
        this.pitch = p ?? null;
        this.attrs = attrs ?? {};
    }
}

export type MeasureCursor = Cursor<Measure, Voice, never>;
export type NoteCursor = Cursor<Note, Measure, MeasureCursor>;

export abstract class Measure
    extends SequentialContainer<Note>
    implements DurationalElement
{
    constructor(
        notes: readonly Note[],
        public readonly duration: Rational,
    ) {
        super(notes);
    }

    abstract readonly writable: boolean;
    abstract hash(): string;

    protected hashNotes(): string {
        return this.elements.map((x) => {
            const p = x.pitch ? x.pitch.ord().toString() : '_';
            return `${p},${x.duration}`;
        }).join(';');
    }

    toString(): string {
        return this.elements.map((x) => `${x.pitch}${x.attrs.isPassingTone ? '!' : ''}`).join(' ');
    }
}

export abstract class Voice<M extends Measure = Measure> extends SequentialContainer<M> {
    constructor(
        measures: readonly M[],
        public readonly index: number,
    ) {
        super(measures);
    }

    abstract readonly name: string;
    abstract clone(): this;

    noteAt(t: AsRational) {
        t = Rational.from(t);
        const m = this.cursorAtTime(t);
        if (!m) return undefined;
        // @ts-expect-error compiler bug?
        return m.value.cursorAtTime(t.sub(m.globalTime))?.withParent(m);
    }

    hash(): string {
        return this.elements.map((x) => x.hash()).join(';');
    }

    toString(): string {
        return this.elements.map((x) => x.toString()).join(' | ');
    }
}

export type Parameters = {
    measureLength: Rational;
};

export class Score {
    constructor(
        public readonly parameters: Parameters,
        public readonly voices: readonly Voice[]
    ) {}

    hash(): string {
        return this.voices.map((x) => x.hash()).join('|');
    }

    toString() {
        return this.voices.map((x) => x.toString()).join('\n');
    }

    replaceVoice(i: number, v: Voice) {
        const vs = [...this.voices];
        vs.splice(i, 1, v);
        return new Score(this.parameters, vs);
    }

    clone() {
        return new Score(this.parameters, this.voices.map((x) => x.clone()));
    }
}
