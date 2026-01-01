import { Hashable, Serializable } from "./Common";
import { Debug } from "./Debug";

function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

export class InvalidRationalError extends Error {
    constructor(message: string, num: number, den: number) {
        super(`${message} (${num}/${den})`);
        this.name = "InvalidRationalError";
    }
}

export type AsRational = number | Rational;

export class Rational implements Hashable, Serializable {
    readonly num: number;
    readonly den: number;

    constructor(num: number, den: number = 1) {
        if (den === 0)
            throw new InvalidRationalError("zero denominator", num, den);

        if (den < 0) {
            num = -num;
            den = -den;
        }

        if (!Number.isSafeInteger(num) || !Number.isSafeInteger(den))
            throw new InvalidRationalError("bad components", num, den);

        const common = gcd(Math.abs(num), den);
        this.num = num / common;
        this.den = den / common;
    }

    static parse(ex: string): Rational | null {
        const match = ex.match(/^((?:\+|-)?\d+)(?:\/(\d+))?$/);
        if (!match) return null;
        const a = Number.parseInt(match[1]);
        const b = match[2] ? Number.parseInt(match[2]) : 1;
        if (Number.isNaN(a) || Number.isNaN(b) || b == 0) return null;
        return new Rational(a, b);
    }

    static from(x: AsRational, eps = 0.00001): Rational {
        if (x instanceof Rational) return x;
        const sign = Math.sign(x);
        x = Math.abs(x);
        let den = 1;
        while (x % 1 > eps) {
            x *= 10;
            den *= 10;
        }
        return new Rational(x * sign, den);
    }

    static array(x: AsRational[], eps = 0.00001): Rational[] {
        return x.map((x) => Rational.from(x, eps));
    }

    serialize() {
        return [this.num, this.den] as const;
    }

    static deserialize([num, den]: any): Rational {
        return new Rational(num, den);
    }

    add(other: AsRational): Rational {
        other = Rational.from(other);

        // a/b + c/d = (ad + bc) / bd
        const newNum = this.num * other.den + other.num * this.den;
        const newDen = this.den * other.den;
        return new Rational(newNum, newDen);
    }

    sub(other: AsRational): Rational {
        other = Rational.from(other);

        // a/b - c/d = (ad - bc) / bd
        const newNum = this.num * other.den - other.num * this.den;
        const newDen = this.den * other.den;
        return new Rational(newNum, newDen);
    }

    mul(other: AsRational): Rational {
        other = Rational.from(other);

        // (a/b) * (c/d) = (ac) / (bd)
        return new Rational(
            this.num * other.num,
            this.den * other.den
        );
    }

    div(other: AsRational): Rational {
        other = Rational.from(other);

        // (a/b) / (c/d) = (ad) / (bc)
        Debug.assert(other.num !== 0);

        return new Rational(
            this.num * other.den,
            this.den * other.num
        );
    }

    modulo(other: AsRational): Rational {
        other = Rational.from(other);

        // a mod b = a - b * floor(a / b)
        return this.sub(other.mul(Math.floor(this.div(other).value())));
    }

    negate(): Rational {
        return new Rational(-this.num, this.den);
    }

    abs(): Rational {
        return new Rational(Math.abs(this.num), this.den);
    }

    hash(): string {
        return `${this.num},${this.den}`;
    }

    equals(other: AsRational): boolean {
        other = Rational.from(other);
        return this.num === other.num && this.den === other.den;
    }

    max(...others: AsRational[]): Rational {
        let max: Rational = this;
        let maxValue = this.value();
        for (const other of others) {
            const r = Rational.from(other);
            const v = r.value();
            if (v > maxValue) {
                max = r;
                maxValue = v;
            }
        }
        return max;
    }

    min(...others: AsRational[]): Rational {
        let min: Rational = this;
        let minValue = this.value();
        for (const other of others) {
            const r = Rational.from(other);
            const v = r.value();
            if (v < minValue) {
                min = r;
                minValue = v;
            }
        }
        return min;
    }

    value(): number {
        return this.num / this.den;
    }

    toString(opt?: { alwaysSigned?: boolean, mixedFraction?: boolean }): string {
        const sign = this.num < 0 ? '-'
            : opt?.alwaysSigned ? '+' : '';
        const absNum = Math.abs(this.num);
        if (this.den === 1) return `${sign}${absNum}`;
        if (opt?.mixedFraction) {
            const i = Math.floor(Math.abs(this.value()));
            if (i == 0) return `${sign}${absNum}/${this.den}`;
            const num = absNum - i * this.den;
            return `${sign}${i} ${num}/${this.den}`;
        }
        return `${sign}${absNum}/${this.den}`;
    }
}
