# json-serialization<a href="https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.md"><img src="https://img.shields.io/npm/v/json-serialization.svg" /></a> <a href="https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.md"><img src="https://packagephobia.now.sh/badge?p=json-serialization" /></a>

[English](https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.md) | [简体中文](https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.zh-CN.md)

## Introduction

`json-serialization` is an extensible asynchronous JSON serialization library.

## Get Started

### Basic Usage

`json-serialization` provides the following methods:

| method      | function                                                                                                                                                                                                             |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stringify` | converts a JavaScript value to a JSON string, optionally replacing values if a `serializerList` is specified.                                                                                                        |
| `parse`     | parses a JSON string, constructing the JavaScript value or object described by the string. An optional `deserializerList` can be provided to perform a transformation on the resulting object before it is returned. |

```ts
import { stringify, parse } from 'json-serialization';

// {"name":"memo","age":18}
var json = await stringify({ name: 'memo', age: 18 });

// {name: 'memo', age: 18}
var object = await parse(json);
```

### Extending Serialization Rules

`json-serialization` supports extending serialization and deserialization rules by implementing the `Serializer` and `Serializer` interface definitions.

```ts
type Serializer = {
    test: (value: any, key: string) => boolean;
    serialize: (value: any, key: string) => any | Promise<any>;
};

type Deserializer = {
    test: (value: any, key: string) => boolean;
    deserialize: (value: any, key: string) => any | Promise<any>;
};
```

The `test` method is used to preliminarily determine whether a value can be serialized or deserialized. If the `test` method always returns true, then:

The `serialize` method is similar to the `replacer` parameter of `JSON.stringify`.

The `deserialize` method is similar to the `reviver` parameter of `JSON.parse`.

The following example shows how to serialize a bigint into a string and how to deserialize it.

```ts
import type { Serializer, Deserializer } from 'json-serialization';

const BigIntSerializer: Serializer = {
    test: (value) => typeof value === 'bigint' || typeof value === 'string',
    serialize(value: bigint | string) {
        switch (typeof value) {
            case 'bigint':
                return 'b' + String(value);
            case 'string':
                return 's' + value;
            default:
                return value;
        }
    },
};

const BigIntDeserializer: Deserializer = {
    test: (value) => typeof value === 'string',
    deserialize(value: string) {
        switch (value[0]) {
            case 's':
                return value.slice(1);
            case 'b':
                return BigInt(value.slice(1));
            default:
                return value;
        }
    },
};
```

To distinguish from ordinary strings, we add a character prefix respectively, `b` represents `bigint`, `s` represents `string`. So `memo` is serialized as `smemo`, `18n` is serialized as `b18`. the original type and value are determined based on the prefix during parsing.

```ts
// {"name":"smemo","age":"b18"}
var json = await stringify({ name: 'memo', age: 18n }, [BigIntSerializer]);

// {name: 'memo', age: 18}
var object = await parse(json, [BigIntDeserializer]);
```

When multiple serializers or deserializers meet the running conditions, they will be called in series (the return value of the previous serializer is used as the parameter of the next serializer).

Please ensure that the order of the same group of serializers and deserializers is consistent in the two lists.

## License

[MIT](./LICENSE)
