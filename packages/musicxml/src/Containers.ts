import { StandardHeptatonic as H } from "core";
import { create } from "xmlbuilder2";
import { NoteLike, MeasureLike, VoiceLike } from "./Types";

export function pitch(x: H.Pitch) {
    return {
        step: 'CDEFGAB'[x.index],
        alter: `${x.acci.value()}`,
        octave: `${x.period}`,
    }
};

export function note(n: NoteLike) {
    if (n.pitch) return {
        pitch: pitch(n.pitch),
        duration: `${n.duration.value()}`
    }; else return {
        rest: {},
        duration: `${n.duration.value()}`
    };
}

export function firstMeasure(m: MeasureLike, v: VoiceLike) {
    return {
        '@number': 0,
        attributes: {
            divisions: 1,
            clef: {
                sign: v.clef.type,
                line: v.clef.line,
                'clef-octave-change': v.clef.octave,
            }
        },
        note: m.elements.map(note)
    };
}

export function measure(m: MeasureLike, i: number) {
    return {
        '@number': i,
        note: m.elements.map(note)
    };
}

export function part(v: VoiceLike) {
    return {
        '@id': v.name,
        measure: v.elements.map((m, i) => i == 0 ? firstMeasure(m, v) : measure(m, i))
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
