# json-serialization <a href="https://www.npmjs.com/package/json-serialization"><img src="https://img.shields.io/npm/v/json-serialization.svg" /></a>

[English](https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.md) | [简体中文](https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.zh-CN.md)

## Introduction

`json-serialization` is an extensible asynchronous JSON serialization library.

## Get Started

### Basic Usage

`json-serialization` provides the following methods:

| method      | function                                                                                                                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stringify` | converts a JavaScript value to a JSON string, optionally replacing values if a `serializer` is specified.                                                                                                        |
| `parse`     | parses a JSON string, constructing the JavaScript value or object described by the string. An optional `deserializer` can be provided to perform a transformation on the resulting object before it is returned. |

```ts
import { stringify, parse } from 'json-serialization';

// {"name":"memo","age":18}
var json = await stringify({ name: 'memo', age: 18 });

// {name: 'memo', age: 18}
var object = await parse(json);
```

### Circular References

`json-serialization` integrates with [`reference-path`](https://github.com/memo-cn/reference-path/blob/main/README.md). During serialization, it converts repeated references (including circular references) within JavaScript object structures into string-formatted reference paths.

During deserialization, these reference paths are restored to their original reference relationships.

Below is an example of an object structure containing circular references:

```ts
var html = { name: 'html' };
var head = { name: 'head' };
var body = { name: 'body' };

head.parent = html;
body.parent = html;

head.next = body;
body.prev = head;

html.children = [head, body];

var json = await stringify(html, null, 4);
```

The serialized JSON string is:

```json
{
    "name": "html",
    "children": [
        {
            "name": "head",
            "parent": "$ref:",
            "next": {
                "name": "body",
                "parent": "$ref:",
                "prev": "$ref:children.0"
            }
        },
        "$ref:children.0.next"
    ]
}
```

In the above example, `$ref:children.0.next` is a reference path, which represents the object pointed to by the `next` property of the element with an index of `0` in the array corresponding to the `children` property of the root object.

### Extending Serialization Rules

`json-serialization` supports extending serialization and deserialization rules by providing `Deserializer` and `Serializer` for customization.

```ts
type Serializer = (this: any, key: string, value: any) => any | Promise<any>;
type Deserializer = (this: any, key: string, value: any) => any | Promise<any>;

function stringify(
    value: any,
    serializer?: null | undefined | Serializer | (null | undefined | Serializer)[],
    space?: number,
): Promise<string>;

function parse(
    text: string,
    deserializer?: null | undefined | Deserializer | (null | undefined | Deserializer)[],
): Promise<any>;
```

`Serializer` is similar to the `replacer` parameter of `JSON.stringify`, and `Deserializer` is similar to the `reviver` parameter of `JSON.parse`.

The following example shows how to serialize a bigint into a string and how to deserialize it.

```ts
import type { Serializer, Deserializer } from 'json-serialization';

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
```

To distinguish from ordinary strings, we add a character prefix respectively, `b` represents `bigint`, `s` represents `string`. So `memo` is serialized as `smemo`, `18n` is serialized as `b18`. the original type and value are determined based on the prefix during parsing.

```ts
// {"name":"smemo","age":"b18"}
var json = await stringify({ name: 'memo', age: 18n }, [BigIntSerializer]);

// {name: 'memo', age: 18}
var object = await parse(json, [BigIntDeserializer]);
```

When multiple serializers or deserializers are specified, they will be called serially (the return value of the previous serializer is used as the input parameter of the next serializer).

Please ensure that the order of the same group of serializers and deserializers is consistent in the two lists.

## License

[MIT](./LICENSE)
