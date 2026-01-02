import { AsRational, Debug, Hashable, Rational, Serializable, Serialized } from 'common';
import { Cursor, DurationalElement, StandardHeptatonic as H, SequentialContainer, SequentialCursor } from 'core';
import { Clef, NoteLike } from 'musicxml';

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

export type NonHarmonicType = 'passing_tone' | 'suspension' | 'neighbor';

export class Note implements DurationalElement, NoteLike, Serializable, Hashable {
    duration: Rational;

    /**
     * `null` means either it is not filled in, or it's a rest
     */
    pitch: H.Pitch | null;

    type?: NonHarmonicType;

    hash(): string {
        return `${this.duration.hash()},${this.pitch?.hash()},${this.type}`;
    }

    serialize() {
        return [this.duration.serialize(), this.pitch?.serialize(), this.type] as const;
    }

    static deserialize([duration, pitch, type]: Serialized<Note>): Note {
        return new Note(
            Rational.deserialize(duration),
            pitch ? H.Pitch.deserialize(pitch) : null,
            type
        );
    }

    get isNonHarmonic() {
        return this.type == 'neighbor' ? 'N'
             : this.type == 'passing_tone' ? 'P'
             : this.type == 'suspension' ? 'S'
             : this.type === undefined ? false
             : Debug.never(this.type);
    }

    get isTied() {
        return this.type == 'suspension';
    }

    constructor(d: Rational, p?: H.Pitch | null, type?: NonHarmonicType) {
        this.duration = d;
        this.pitch = p ?? null;
        this.type = type;
    }
}

export type MeasureCursor = SequentialCursor<Measure, Voice, never>;

// @ts-expect-error
export type NoteCursor = SequentialCursor<Note, Measure, MeasureCursor>;

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
        return this.elements.map((x) => x.hash()).join(';');
    }

    toString(): string {
        return this.elements.map((x) => `${x.pitch}${x.type == 'passing_tone' ? '!' : ''}`).join(' ');
    }
}

export class MeasureData extends Measure implements Serializable {
    readonly writable = false;

    hash(): string {
        return this.hashNotes();
    }

    serialize() {
        return [this.elements.map((x) => x.serialize()), this.duration.serialize()] as const;
    }

    static deserialize([elems, duration]: Serialized<MeasureData>) {
        return new MeasureData(
            (elems as any[]).map((x) => Note.deserialize(x)),
            Rational.deserialize(duration));
    }

    static from(m: Measure) {
        return new MeasureData(m.elements, m.duration);
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
    abstract readonly clef: Clef;
    abstract clone(): this;

    noteAt(t: AsRational): NoteCursor | undefined {
        t = Rational.from(t);
        const m = this.cursorAtTime(t);
        if (!m) return undefined;
        // FIXME: withParent
        // @ts-expect-error
        return m.value.cursorAtTime(t.sub(m.globalTime))?.withParent(m);
    }

    hash(): string {
        return this.elements.map((x) => x.hash()).join(';');
    }

    toString(): string {
        return this.elements.map((x) => x.toString()).join(' | ');
    }
}

export class VoiceData extends Voice<MeasureData> implements Serializable {
    constructor(
        measures: readonly MeasureData[],
        index: number,
        readonly name: string,
        readonly clef: Clef,
    ) {
        super(measures, index);
    }

    clone(): this {
        return new VoiceData(this.elements, this.index, this.name, this.clef) as this;
    }

    serialize() {
        return [this.elements.map((x) => x.serialize()), this.index, this.name, this.clef] as const;
    }

    static deserialize([elems, index, name, clef]: Serialized<VoiceData>) {
        return new VoiceData(
            (elems as any[]).map((x) => MeasureData.deserialize(x)),
            index, name, clef);
    }

    static from(v: Voice) {
        return new VoiceData(v.elements.map((x) => MeasureData.from(x)), v.index, v.name, v.clef);
    }
}
