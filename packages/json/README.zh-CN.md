# json-serialization<a href="https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.zh-CN.md"><img src="https://img.shields.io/npm/v/json-serialization.svg" /></a> <a href="https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.zh-CN.md"><img src="https://packagephobia.now.sh/badge?p=json-serialization" /></a>

[English](https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.md) | [简体中文](https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.zh-CN.md)

## 介绍

`json-serialization` 是一个可扩展的异步 JSON 序列化库。

## 起步

### 基本用法

`json-serialization` 提供了以下方法：

| 方法        | 作用                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `stringify` | 将一个 JavaScript 对象或值转换为 JSON 字符串, 如果指定了 `serializerList`, 则可以选择性地替换值。                                          |
| `parse`     | 用来解析 JSON 字符串, 构造由字符串描述的 JavaScript 值或对象。 提供可选的 `deserializerList` 用以在返回之前对所得到的对象执行变换 (操作)。 |

```ts
import { stringify, parse } from 'json-serialization';

// {"name":"memo","age":18}
var json = await stringify({ name: 'memo', age: 18 });

// {name: 'memo', age: 18}
var object = await parse(json);
```

### 扩展序列化规则

`json-serialization` 支持通过实现 `Deserializer` 和 `Serializer` 接口定义来扩展序列化和反序列化规则。

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

其中 `test` 方法用于初步判断值是否可以被序列化或反序列化。如果 `test` 方法始终返回 `true`, 那么：

`serialize` 方法类似于 `JSON.stringify` 的 `replacer` 参数。

`deserialize` 方法类似于 `JSON.parse` 的 `reviver` 参数。

下面的示例展示如何将 `bigint` 序列化为字符串，以及如何进行反序列化。

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

为了和普通的字符串区分, 我们分别加上一个字符前缀, `b` 表示 `bigint`, `s` 表示 `string`。
那么 `memo` 被序列化为 `smemo`, `18n` 被序列化为 `b18`, 解析时再依据前缀判断出原来的类型和值。

```ts
// {"name":"smemo","age":"b18"}
var json = await stringify({ name: 'memo', age: 18n }, [BigIntSerializer]);

// {name: 'memo', age: 18}
var object = await parse(json, [BigIntDeserializer]);
```

当多个序列化器或反序列化器都符合运行条件时，它们会被串行调用（前一个序列化器的返回值作为下一个序列化器的入参）。
请确保同一组序列化器和反序列化器在两个列表中的书写顺序一致。

## 许可

[MIT](./LICENSE)
