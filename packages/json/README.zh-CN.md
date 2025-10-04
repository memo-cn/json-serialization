# json-serialization <a href="https://www.npmjs.com/package/json-serialization"><img src="https://img.shields.io/npm/v/json-serialization.svg" /></a>

[English](https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.md) | [简体中文](https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.zh-CN.md)

## 介绍

`json-serialization` 是一个可扩展的异步 JSON 序列化库。

## 起步

### 基本用法

`json-serialization` 提供了以下方法：

| 方法        | 作用                                                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `stringify` | 将一个 JavaScript 对象或值转换为 JSON 字符串, 如果指定了 `serializer`, 则可以选择性地替换值。                                          |
| `parse`     | 用来解析 JSON 字符串, 构造由字符串描述的 JavaScript 值或对象。 提供可选的 `deserializer` 用以在返回之前对所得到的对象执行变换 (操作)。 |

```ts
import { stringify, parse } from 'json-serialization';

// {"name":"memo","age":18}
var json = await stringify({ name: 'memo', age: 18 });

// {name: 'memo', age: 18}
var object = await parse(json);
```

### 循环引用

`json-serialization` 集成了 [`reference-path`](https://github.com/memo-cn/reference-path/blob/main/README.zh-CN.md)，在序列化时会将 JavaScript 对象结构中重复出现的引用（包括循环引用）转换为字符串格式的引用路径，并在反序列化时恢复原始的引用关系。

以下是一个包含循环引用的数据结构示例：

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

序列化后的 JSON 字符串为:

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

在上面的示例中，`$ref:children.0.next` 就是一个引用路径，表示根对象的 `children` 属性对应的数组中，索引为 `0` 的元素的 `next` 属性所指向的对象。

### 扩展序列化规则

`json-serialization` 支持通过提供 `Deserializer` 和 `Serializer` 来自定义来扩展序列化和反序列化规则。

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

`Serializer` 类似于 `JSON.stringify` 的 `replacer` 参数，`Deserialize` 类似于 `JSON.parse` 的 `reviver` 参数。

以下示例展示如何将 `bigint` 序列化为字符串，以及如何进行反序列化。

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

为了和普通的字符串区分, 我们分别加上一个字符前缀, `b` 表示 `bigint`, `s` 表示 `string`。
那么 `memo` 被序列化为 `smemo`, `18n` 被序列化为 `b18`, 解析时再依据前缀判断出原来的类型和值。

```ts
// {"name":"smemo","age":"b18"}
var json = await stringify({ name: 'memo', age: 18n }, [BigIntSerializer]);

// {name: 'memo', age: 18}
var object = await parse(json, [BigIntDeserializer]);
```

当指定多个序列化器或反序列化器时，它们会被串行调用（前一个序列化器的返回值作为下一个序列化器的入参）。
请确保同一组序列化器和反序列化器在两个列表中的书写顺序一致。

## 许可

[MIT](./LICENSE)
