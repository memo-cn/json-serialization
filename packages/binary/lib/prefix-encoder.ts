export function createPrefixEncoder<T>({
    prefix,
    stringify,
    parse,
    escapeCharacter,
}: {
    prefix: string;
    stringify: (arg: T) => string;
    parse: (arg: string) => T;
    escapeCharacter: string;
}) {
    return {
        encode,
        decode,
    };

    function indexOfPrefix(str: string) {
        for (let i = 0; i < str.length; ++i) {
            const char = str[i];
            if (char === prefix[0]) {
                if (str.slice(i, i + prefix.length) === prefix) {
                    return i;
                }
            }
            if (str[i] !== escapeCharacter) {
                return -1;
            }
        }
        return -1;
    }

    function encode(arg: T | string): string {
        if (typeof arg === 'string') {
            let ind = indexOfPrefix(arg);
            if (ind === -1) return arg;
            return escapeCharacter.repeat(ind + 1) + arg.slice(ind);
        }
        return prefix + stringify(arg);
    }

    function decode(str: string): T | string {
        const ind = indexOfPrefix(str);
        if (ind === -1) {
            return str;
        }
        if (ind === 0) {
            const path = str.slice(prefix.length);
            return parse(path);
        }
        return escapeCharacter.repeat(ind - 1) + str.slice(ind);
    }
}
