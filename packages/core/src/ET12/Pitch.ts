import { AsRational, Rational } from "common";
import { Pitch } from "../Pitch";
import { ET12System } from "./System";

export abstract class ET12Pitch<S extends ET12System> extends Pitch<S> {
    toMidi(): Rational {
        return this.ord().add(12);
    }
}
