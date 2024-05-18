import { stringify, parse } from '../lib';

// {"name":"memo","age":18}
var json = await stringify({ name: 'memo', age: 18 });

// {name: 'memo', age: 18}
var object = await parse(json);

console.log(json, object);

import type { Serializer, Deserializer } from '../lib';

const BigIntSerializer: Serializer = function (key, value: bigint | string | any) {
    switch (typeof value) {
        case 'bigint':
            return 'b' + String(value);
        case 'string':
            return 's' + value;
        default:
            return value;
    }
};

const BigIntDeserializer: Deserializer = function (key, value: string) {
    switch (value[0]) {
        case 's':
            return value.slice(1);
        case 'b':
            return BigInt(value.slice(1));
        default:
            return value;
    }
};

// {"name":"smemo","age":"b18"}
var json = await stringify({ name: 'memo', age: 18n }, [BigIntSerializer]);

// {name: 'memo', age: 18}
var object = await parse(json, [BigIntDeserializer]);

console.log(json, object);
