import { StandardHeptatonic as H, SequentialCursor } from "core";
import { create } from "xmlbuilder2";
import { NoteLike, MeasureLike, VoiceLike } from "./Types";

export function pitch(x: H.Pitch) {
    return {
        step: 'CDEFGAB'[x.index],
        alter: x.acci.value(),
        octave: x.period,
    }
};

export function note(n: NoteLike, tieStart = false) {
    if (n.pitch) return {
        pitch: pitch(n.pitch),
        duration: n.duration.value(),
        notations: n.isTied || tieStart
            ? {
                tied: {
                    "@type": tieStart ? 'start' : 'stop'
                },
            }: undefined,
        lyric: (typeof n.isNonHarmonic == 'string')
            ? {
                text: n.isNonHarmonic
            } : undefined,
    }; else return {
        rest: {},
        duration: n.duration.value()
    };
}

export function measure(m: SequentialCursor<MeasureLike, VoiceLike, never>, v: VoiceLike) {
    const notes: any[] = [];
    // @ts-expect-error
    for (let n = m.value.first()?.withParent(m); n; n = n.next()) {
        notes.push(note(n.value, n.nextGlobal()?.value.isTied));
    }

    return {
        '@number': m.index,
        attributes: m.index == 0 ? {
            divisions: 1,
            clef: {
                sign: v.clef.type,
                line: v.clef.line,
                'clef-octave-change': v.clef.octave,
            }
        } : undefined,
        note: notes
    };
}

export function part(v: VoiceLike) {
    return {
        '@id': v.name,
        measure: [...v.entries()].map((x) => measure(x, v))
    };
}

export function score(vs: readonly VoiceLike[]): string {
    return create({
        standalone: false,
    }, {
        'score-partwise': {
            '@version': '4.0',
            'part-list': {
                'score-part': vs.map((x) => ({
                    '@id': x.name,
                    'part-name': x.name
                })),
            },
            part: vs.map(part)
        }
    }).end({ prettyPrint: true });
}
