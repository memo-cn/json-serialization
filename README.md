# json-serialization

[English](https://github.com/memo-cn/json-serialization/blob/main/README.md) | [简体中文](https://github.com/memo-cn/json-serialization/blob/main/README.zh-CN.md)

A set of JSON-based serialization schemes are recommended:

| Library                                                                                                             | Functionality                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [json-serialization](https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.md)               | An asynchronous JSON serialization library that automatically handles circular references and supports custom serialization rules.              |
| [@json-serialization/binary](https://github.com/memo-cn/json-serialization/blob/main/packages/binary/README.md)     | Provides binary serialization and deserialization mechanisms, supporting data types like `ArrayBuffer`, `Buffer`, `Blob`, `File`, `Uint8Array`. |
| [@json-serialization/error](https://github.com/memo-cn/json-serialization/blob/main/packages/error/README.md)       | Provides a serialization and deserialization mechanism for `Error` and its subclasses.                                                          |
| [@json-serialization/function](https://github.com/memo-cn/json-serialization/blob/main/packages/function/README.md) | Provides function serialization and deserialization mechanisms, enabling cross-context function calls without using `eval`.                     |

### Installation

```bash
npm i json-serialization
npm i @json-serialization/binary
npm i @json-serialization/error
npm i @json-serialization/function
```

### Usage Example

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
