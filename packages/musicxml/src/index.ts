import * as mxl from "musicxml-interfaces";
import { StandardHeptatonic } from "core";

export const toMxl = {
    pitch(x: StandardHeptatonic.Pitch): mxl.Pitch {
        return {
            step: 'CDEFGAB'[x.index],
            alter: x.acci.value(),
            octave: x.period,
        }
    },
}
