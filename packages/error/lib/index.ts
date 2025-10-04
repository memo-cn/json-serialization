import type { Deserializer, Serializer } from 'json-serialization';
import { createPrefixEncoder } from 'prefix-encoder';

// ['name', 'message', 'stack']
const prototypePropertyNames = Object.getOwnPropertyNames(Error.prototype).filter(
    (p) => typeof Error.prototype[p as keyof typeof Error.prototype] === 'string',
);

function error2json(err: Error): Record<string, any> {
    if (!((err as any) instanceof Error)) {
        return err as never;
    }
    const json: Record<string, any> = {};
    for (let property of prototypePropertyNames.concat(Object.getOwnPropertyNames(err))) {
        json[property] = err[property as keyof typeof err];
    }
    if (json['name'] === 'AggregateError') {
        const errors = json['errors'];
        if (Array.isArray(errors)) {
            json.errors = [];
            for (let i = 0; i < errors.length; i++) {
                json.errors[i] = error2json(errors[i]);
            }
        }
    }
    return json;
}

function json2error(json: any) {
    if (Object(json) !== json) {
        return json;
    }
    let name = json.name;
    let constructor = globalThis[name as keyof typeof globalThis];
    let error;
    if (constructor) {
        try {
            error = Reflect.construct(constructor, name === 'AggregateError' ? [] : json.message);
        } catch (e) {}
    }
    if (!error) {
        error = new Error(json.message);
        error.stack = '';
    }
    Object.assign(error, json);
    if (name === 'AggregateError') {
        const errors = json['errors'];
        if (Array.isArray(errors)) {
            (error as AggregateError).errors = [];
            for (let i = 0; i < errors.length; i++) {
                (error as AggregateError).errors[i] = json2error(errors[i]);
            }
        }
    }
    return error;
}

const errorEncoder = createPrefixEncoder<Error>({
    prefix: '$err:',
    stringify: (err) => JSON.stringify(error2json(err)),
    parse: (str) => json2error(JSON.parse(str)),
    escapeCharacter: '_',
});

export const errorDeserializer: Deserializer = (key, val) => {
    if (typeof val === 'string') {
        val = errorEncoder.decode(val);
    }
    return val;
};

export const errorSerializer: Serializer = (key, val) => {
    if (typeof val === 'string' || val instanceof Error) {
        val = errorEncoder.encode(val);
    }
    return val;
};
