import { repeat, shuffle } from "common";
import { GeneralizedToneRow, ToneRow, ToneRowBase } from "./Row";
import { StandardHeptatonic } from "core";

const H = StandardHeptatonic;

const list = repeat(12, (i) => i);
const shuffled = shuffle(list);
const row = ToneRow.from(H.System, shuffled);

function printRow(r: ToneRowBase<typeof StandardHeptatonic.System>, prompt = '') {
    console.log(prompt, r.notes.map((x) =>
        x.toPitch(H.Pitch, 'sharp').toString({ noPeriod: true }).padStart(6)).join(''));
}

repeat(12, (i) => printRow(row.rotate(i), `rot${i}`.padStart(5)));

repeat(12, (i) => printRow(GeneralizedToneRow.new(row.notes).multiply(i+1), `m${i+1}`.padStart(5)));
