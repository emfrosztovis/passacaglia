import { Voice } from "./Voice";

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
};

export type PlayOptions = {
    tempo?: number,
    synth?: boolean
}

export async function play(voices: readonly Voice[], instrs: number[], opts?: PlayOptions) {
    const JZZ = (await import('jzz')).default;

    let name: string | undefined;
    if (opts?.synth) {
        // @ts-ignore
        (await import('jzz-synth-tiny')).Tiny(JZZ);
        // @ts-ignore
        JZZ.synth.Tiny.register('synth');
        name = 'synth';
    }

    const midi = await JZZ();
    const port = await midi.openMidiOut(name);
    const tempo = opts?.tempo ?? 180;
    instrs.forEach((x, i) => port.program(i, x));

    const events: Event[] = [];
    voices.forEach((v) => {
        for (let n = v.noteAt(0); n; n = n.nextGlobal()) {
            if (n.value.pitch === null) continue;
            const pitch = n.value.pitch.toMidi().value();
            const isTieStart = n.nextGlobal()?.value.isTied;
            const isTieEnd = n.value.isTied;
            if (!isTieEnd) events.push({
                    type: 'on', pitch,
                    channel: v.index,
                    at: n.globalTime.value()
                });
            if (!isTieStart) events.push({
                    type: 'off', pitch,
                    channel: v.index,
                    at: n.globalEndTime.value()
                });
        }
    });
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
