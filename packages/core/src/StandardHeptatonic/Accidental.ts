import { Rational } from "common";

export const Accidental = {
    parse(ex: string): Rational | null {
        if (ex == '' || ex == 'n') return new Rational(0);
        if (ex.match(/^s+$/)) return new Rational(ex.length);
        if (ex.match(/^f+$/)) return new Rational(-ex.length);

        const match = ex.match(/^(\d+)(?:\/(\d+))?(s|f)+$/);
        if (!match) return null;
        const a = Number.parseInt(match[1]) * (match[3] == 's' ? 1 : -1);
        const b = match[2] ? Number.parseInt(match[2]) : 1;
        if (Number.isNaN(a) || Number.isNaN(b)) return null;
        return new Rational(a, b);
    },
    print(x: Rational, opt?: { useNatural?: boolean }) {
        if (x.num == 0) return opt?.useNatural ? 'n' : '';

        const absNum = Math.abs(x.num);
        const letter = x.num > 0 ? 's' : 'f';

        if (x.den == 1 && absNum <= 2)
            return letter.repeat(absNum);
        if (x.den == 1)
            return `${absNum}${letter}`;
        return `${absNum}/${x.den}${letter}`;
    }
}
