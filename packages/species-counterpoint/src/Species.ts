import { Rational, repeat } from "common";
import { defineSpecies, MeasureSchema, NoteSchema, SpeciesMeasure } from "./SpeciesBase";
import { MeasureCursor } from "./Voice";
import { Score } from "./Score";

const first = (c: MeasureCursor<SpeciesMeasure>) => c.index == 0;
const later = (c: MeasureCursor<SpeciesMeasure>) => c.index > 0;


const hdiff = (c: MeasureCursor<SpeciesMeasure>, name: string) =>
    c.prevGlobal()?.value.schemaName !== name;

const vdiff = (c: MeasureCursor<SpeciesMeasure>, score: Score, name: string) => {
    if (!hdiff(c, name)) return false;

    let total = 0, same = 0;
    for (const v of score.voices) {
        const m = v.elements[c.index];
        if (!(m instanceof SpeciesMeasure)) continue;
        if (m.schemaName == name) same++;
        total++;
    }
    if (total > 0 && same > total - 1) return false;
    return true;
}

// 1

const schema1: MeasureSchema[] = [{
    name: 'sp1',
    notes: (c) => [{
        harmonic: true,
        duration: c.parameters.measureLength
    }]
}];

export const Species1 = defineSpecies({
    forbidRepeatedNotes: false,
    maxConsecutiveLeaps: 2,
    maxIgnorable3rdLeaps: 2,
    maxUnidirectionalConsecutiveLeaps: 1,
    maxUnidirectionalIgnorable3rdLeaps: 1,
}, schema1);

// 2

const schema2: MeasureSchema[] = [{
    name: 'sp2.0',
    condition: (c) => first(c),
    notes: (c) => [{
        skip: true,
        duration: c.parameters.measureLength.div(2)
    }, {
        harmonic: true,
        duration: c.parameters.measureLength.div(2)
    }]
}, {
    name: 'sp2.1',
    condition: (c) => later(c),
    notes: (c) => [{
        harmonic: true,
        duration: c.parameters.measureLength.div(2)
    }, {
        harmonic: true,
        types: ['passing_tone', 'neighbor'],
        duration: c.parameters.measureLength.div(2)
    }]
}];

export const Species2 = defineSpecies({
    forbidRepeatedNotes: true,
    maxConsecutiveLeaps: 2,
    maxIgnorable3rdLeaps: 1,
    maxUnidirectionalConsecutiveLeaps: 1,
    maxUnidirectionalIgnorable3rdLeaps: 0,
}, schema2);

// 3

const schema3: MeasureSchema[] = [{
    name: 'sp3.0',
    condition: (c) => first(c),
    notes: (c) => [{
        skip: true,
        duration: new Rational(1)
    }, {
        harmonic: true,
        duration: new Rational(1)
    }, ...repeat<NoteSchema>(c.parameters.measureLength.value() - 2, () => ({
        harmonic: true,
        types: ['passing_tone', 'neighbor'],
        duration: new Rational(1)
    }))]
}, {
    name: 'sp3.1',
    condition: (c) => later(c),
    notes: (c) => [{
        harmonic: true,
        duration: new Rational(1)
    }, ...repeat<NoteSchema>(c.parameters.measureLength.value() - 1, () => ({
        harmonic: true,
        types: ['passing_tone', 'neighbor'],
        duration: new Rational(1)
    }))]
}];

export const Species3 = defineSpecies({
    forbidRepeatedNotes: true,
    maxConsecutiveLeaps: 2,
    maxIgnorable3rdLeaps: 1,
    maxUnidirectionalConsecutiveLeaps: 1,
    maxUnidirectionalIgnorable3rdLeaps: 0,
}, schema3);

// 4

const schema4: MeasureSchema[] = [{
    name: 'sp4.0',
    condition: (c) => first(c),
    notes: (c) => [{
        skip: true,
        duration: c.parameters.measureLength.div(2)
    }, {
        harmonic: true,
        duration: c.parameters.measureLength.div(2)
    }]
}, {
    name: 'sp4.1',
    condition: (c) => later(c),
    notes: (c) => [{
        harmonic: false,
        types: ['suspension'],
        duration: c.parameters.measureLength.div(2)
    }, {
        harmonic: true,
        duration: c.parameters.measureLength.div(2)
    }]
}, {
    name: 'sp4.2',
    condition: (c) => later(c),
    notes: (c) => [{
        harmonic: true,
        duration: c.parameters.measureLength.div(2)
    }, {
        harmonic: true,
        types: ['passing_tone', 'neighbor'],
        duration: c.parameters.measureLength.div(2)
    }],
    cost: 500
}];

export const Species4 = defineSpecies({
    forbidRepeatedNotes: true,
    maxConsecutiveLeaps: 2,
    maxIgnorable3rdLeaps: 1,
    maxUnidirectionalConsecutiveLeaps: 1,
    maxUnidirectionalIgnorable3rdLeaps: 0,
}, schema4);

// 5

const schema5: MeasureSchema[] = [{
    name: 'sp5.1',
    condition: (c, s) => later(c) && s.voices.length > 2 && vdiff(c, s, 'sp5.1'),
    notes: (c) => [{
        harmonic: true,
        duration: c.parameters.measureLength
    }],
}, {
    name: 'sp5.2.0',
    condition: (c, s) => first(c) && vdiff(c, s, 'sp5.2.0'),
    notes: (c) => [{
        skip: true,
        duration: c.parameters.measureLength.div(2)
    }, {
        harmonic: true,
        duration: c.parameters.measureLength.div(2)
    }]
}, {
    name: 'sp5.2.1',
    condition: (c, s) => later(c) && vdiff(c, s, 'sp5.2.1'),
    notes: (c) => [{
        harmonic: true,
        duration: c.parameters.measureLength.div(2)
    }, {
        harmonic: true,
        types: ['passing_tone', 'neighbor'],
        duration: c.parameters.measureLength.div(2)
    }]
}, {
    name: 'sp5.3.0',
    condition: (c, s) => first(c) && vdiff(c, s, 'sp5.3.0'),
    notes: (c) => [{
        skip: true,
        duration: new Rational(1)
    }, {
        harmonic: true,
        duration: new Rational(1)
    }, ...repeat<NoteSchema>(c.parameters.measureLength.value() - 2, () => ({
        harmonic: true,
        types: ['passing_tone', 'neighbor'],
        duration: new Rational(1)
    }))]
}, {
    name: 'sp5.3.1',
    condition: (c, s) => later(c) && vdiff(c, s, 'sp5.3.1'),
    notes: (c) => [{
        harmonic: true,
        types: ['suspension'], // suspension allowed
        duration: new Rational(1)
    }, ...repeat<NoteSchema>(c.parameters.measureLength.value() - 1, () => ({
        harmonic: true,
        types: ['passing_tone', 'neighbor'],
        duration: new Rational(1)
    }))]
}, {
    name: 'sp5.4.1',
    condition: (c, s) => later(c) && vdiff(c, s, 'sp5.4.1'),
    notes: (c) => [{
        harmonic: false,
        types: ['suspension'],
        duration: c.parameters.measureLength.div(2)
    }, {
        harmonic: true,
        duration: c.parameters.measureLength.div(2)
    }]
}, {
    name: 'sp5.5.1',
    condition: (c, s) => later(c) && vdiff(c, s, 'sp5.5.1'),
    notes: (c) => [{
        harmonic: true,
        types: ['suspension'], // suspension allowed
        duration: c.parameters.measureLength.div(2)
    }, ...repeat<NoteSchema>(c.parameters.measureLength.value() / 2, () => ({
        harmonic: true,
        types: ['passing_tone', 'neighbor'],
        duration: new Rational(1)
    }))]
}, {
    name: 'sp5.5.2',
    condition: (c, s) => later(c) && vdiff(c, s, 'sp5.5.2'),
    notes: (c) => [{
        harmonic: true,
        duration: new Rational(1)
    }, ...repeat<NoteSchema>(c.parameters.measureLength.value() / 2 - 1, () => ({
        harmonic: true,
        types: ['passing_tone', 'neighbor'],
        duration: new Rational(1)
    })), {
        harmonic: true,
        duration: c.parameters.measureLength.div(2)
        // FIXME: require suspension
    }]
}, {
    name: 'sp5.5.3',
    condition: (c, s) => later(c) && vdiff(c, s, 'sp5.5.3'),
    notes: (c) => [{
        harmonic: true,
        types: ['suspension'], // suspension allowed
        duration: c.parameters.measureLength.div(2)
    }, {
        harmonic: true,
        types: ['passing_tone', 'neighbor'],
        duration: c.parameters.measureLength.div(4)
    }, ...repeat<NoteSchema>(c.parameters.measureLength.value() / 2, () => ({
        harmonic: true,
        types: ['passing_tone', 'neighbor'],
        duration: new Rational(1, 2)
    }))]
}, {
    name: 'sp5.5.4',
    condition: (c, s) => later(c) && vdiff(c, s, 'sp5.5.4'),
    notes: (c) => {
        const d1 = new Rational(Math.floor(c.parameters.measureLength.value() * 3/4));
        const n = c.parameters.measureLength.value() - d1.value();
        return [{
            harmonic: true,
            // types: ['suspension'], // suspension allowed
            duration: d1
        }, ...repeat<NoteSchema>(n, () => ({
            harmonic: true,
            types: ['passing_tone', 'neighbor'],
            duration: new Rational(1)
        }))]
    }
}, {
    name: 'sp5.5.5',
    condition: (c, s) => later(c) && vdiff(c, s, 'sp5.5.5'),
    notes: (c) => [{
        harmonic: true,
        duration: c.parameters.measureLength.mul(3).div(4)
    }, ...repeat<NoteSchema>(c.parameters.measureLength.value() / 2, () => ({
        harmonic: true,
        types: ['passing_tone', 'neighbor'],
        duration: new Rational(1, 2)
    }))]
},];

export const Species5 = defineSpecies({
    forbidRepeatedNotes: true,
    maxConsecutiveLeaps: 3,
    maxIgnorable3rdLeaps: 1,
    maxUnidirectionalConsecutiveLeaps: 1,
    maxUnidirectionalIgnorable3rdLeaps: 0,
}, schema5);
