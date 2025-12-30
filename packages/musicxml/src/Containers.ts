import { DurationalElement, SequentialContainer } from "core";
import { StandardHeptatonic as H } from "core";
import * as mxl from "musicxml-interfaces";
import * as mxlb from "musicxml-interfaces/lib/builders";

export type NoteLike = DurationalElement & {
    pitch: H.Pitch | null;
};

export type MeasureLike = DurationalElement & SequentialContainer<NoteLike>;

export type VoiceLike = SequentialContainer<MeasureLike>;

export function pitch(x: H.Pitch): mxl.Pitch {
    return mxlb.buildPitch((b) => b
        .step('CDEFGAB'[x.index])
        .alter(x.acci.value())
        .octave(x.period));
};

export function note(n: NoteLike): mxl.Note {
    if (n.pitch) {
        return mxlb.buildNote((x) => x
            .pitch(pitch(n.pitch!))
            .duration(n.duration.value()));
    } else {
        return mxlb.buildNote((x) => x
            .rest((x) => x)
            .duration(n.duration.value()));
    }
}

export function score(vs: VoiceLike[]): mxl.ScoreTimewise {
    const len = Math.max(...vs.map((x) => x.size));
    let measures: mxl.Measure[] = [];
    for (let i = 0; i < len; i++) {
        const parts = vs.map((x) => {
            const m = x.elements.at(i);
            if (!m) return [];
            return m.elements.map(note);
        });
        measures.push(mxlb.buildMeasure((x) => {
            x = x.number(`${i}`);
            parts.forEach((part, i) => x = x.set(`#${i}`, part as unknown as boolean[]));
            return x;
        }));
    }

    return mxlb.buildScoreTimewise((x) => x
        .measures(measures));
}
