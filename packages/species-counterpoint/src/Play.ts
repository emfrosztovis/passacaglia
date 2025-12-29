import jzz from "jzz";
import { Score } from "./Common";

type Event = {
    type: 'on',
    channel: number,
    pitch: number,
    at: number
} | {
    type: 'off',
    channel: number,
    pitch: number,
    at: number
}

export async function play(s: Score, instrs: number[], tempo = 180) {
    const midi = await jzz();
    const port = await midi.openMidiOut();

    instrs.forEach((x, i) => port.program(i, x));

    let i = 0;
    while (true) {
        const measures = s.voices.flatMap((x) => {
            const m = x.at(i);
            return m ? [m] : [];
        });
        if (measures.length == 0) break;
        i++;

        // play these measures
        const events: Event[] = [];
        for (const m of measures) {
            for (const n of m.value.entries()) {
                if (n.value.pitch === null) continue;
                events.push({
                    type: 'on', pitch: n.value.pitch.toMidi().value(),
                    channel: m.container.index,
                    at: n.time.value()
                }, {
                    type: 'off', pitch: n.value.pitch.toMidi().value(),
                    channel: m.container.index,
                    at: n.time.add(n.duration).value()
                });
            }
        }
        events.sort((a, b) => a.at - b.at);

        let t = 0;
        for (const e of events) {
            if (e.at > t) {
                await port.wait((e.at - t) * 60 / tempo * 1000);
                t = e.at;
            }
            switch (e.type) {
                case "on":
                    await port.noteOn(e.channel, e.pitch);
                    break;
                case "off":
                    await port.noteOff(e.channel, e.pitch);
                    break;
            }
        }
    }
    midi.close();
}
