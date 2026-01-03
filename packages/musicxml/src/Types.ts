import { DurationalElement, SequentialContainer } from "core";
import { StandardHeptatonic as H } from "core";

export type ClefType = 'G' | 'C' | 'F';

export type Clef = {
    type: ClefType,
    line: number,
    octave?: number
};

export namespace Clef {
    export const Treble: Clef = { type: 'G', line: 2 };
    export const Treble8vb: Clef = { type: 'G', line: 2, octave: -1 };
    export const Treble8va: Clef = { type: 'G', line: 2, octave: 1 };
    export const Alto: Clef = { type: 'C', line: 3 };
    export const Bass: Clef = { type: 'F', line: 4 };
}

export type NoteLike = DurationalElement & {
    readonly pitch: H.Pitch | null;
    readonly isNonHarmonic?: string | boolean;

    /**
     * Whether the note is tied to the previous one.
     */
    readonly isTied?: boolean;
};

export type ChordLike = DurationalElement & {
    toString(): string
};

export type HarmonyLike = SequentialContainer<ChordLike>;

export type MeasureLike = DurationalElement & SequentialContainer<NoteLike>;

export type VoiceLike = SequentialContainer<MeasureLike> & {
    readonly name: string;
    readonly clef: Clef;
    readonly index: number;
};

export type ScoreLike = {
    readonly voices: readonly VoiceLike[],
    readonly harmony?: HarmonyLike
};
