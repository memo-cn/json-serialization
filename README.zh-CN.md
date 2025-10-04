# json-serialization

[English](https://github.com/memo-cn/json-serialization/blob/main/README.md) | [简体中文](https://github.com/memo-cn/json-serialization/blob/main/README.zh-CN.md)

推荐一组基于 JSON 的序列化方案:

| 库                                                                                                                        | 功能                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [json-serialization](https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.zh-CN.md)               | 一个异步 JSON 序列化库，自动处理循环引用关系，支持扩展自定义序列化规则。                                      |
| [@json-serialization/binary](https://github.com/memo-cn/json-serialization/blob/main/packages/binary/README.zh-CN.md)     | 提供了二进制序列化和反序列化的机制，支持 `ArrayBuffer`、`Buffer`、`Blob`、`File`、`Uint8Array` 这些数据类型。 |
| [@json-serialization/error](https://github.com/memo-cn/json-serialization/blob/main/packages/error/README.zh-CN.md)       | 提供 `Error` 及其子类的序列化与反序列化机制。                                                                 |
| [@json-serialization/function](https://github.com/memo-cn/json-serialization/blob/main/packages/function/README.zh-CN.md) | 提供了函数序列化和反序列化的机制，能够在不使用 `eval` 的情况下实现函数的跨上下文调用。                        |

### 安装

```bash
npm i json-serialization
npm i @json-serialization/binary
npm i @json-serialization/error
npm i @json-serialization/function
```

### 使用示例

```ts
import { parse, stringify } from 'json-serialization';
import { binarySerializer, binaryDeserializer } from '@json-serialization/binary';
import { errorSerializer, errorDeserializer } from '@json-serialization/error';

var originalObject = {
    name: 'memo',
    age: 18,
};

// {"name":"memo","age":18}
var jsonText = await stringify(originalObject, [binarySerializer, errorSerializer]);

// {name: 'memo', age: 18}
var object = await parse(jsonText, [binaryDeserializer, errorDeserializer]);
```
