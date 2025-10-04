# @json-serialization/binary <a href="https://www.npmjs.com/package/@json-serialization/binary"><img src="https://img.shields.io/npm/v/@json-serialization/binary.svg" /></a>

[English](https://github.com/memo-cn/json-serialization/blob/main/packages/binary/README.md) | [简体中文](https://github.com/memo-cn/json-serialization/blob/main/packages/binary/README.zh-CN.md)

## Introduction

`@json-serialization/binary` provide s a binary serialization and deserialization mechanism, supporting `ArrayBuffer`, `Buffer`, `Blob`, `File`, `Uint8Array` these data types.

> Note: `@json-serialization/binary` needs to be used in conjunction with `json-serialization`. This is an extensible asynchronous JSON serialization library. You can get to know it by reading [this document](https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.zh-CN.md).

## Precautions

- Considering that `Buffer` is not supported in a web environment, `Blob` and `File` may not be supported in lower versions of Node.js environment. During deserialization, `@json-serialization/binary` may convert these three data types to and from each other to ensure adaptation to the running environment.

- In order to prevent `Buffer` from being preprocessed by `JSON.stringify`, `@json-serialization/binary` will internally set the `toJSON` attribute on the `Buffer` object instance, with the value set to `null`. Please pay attention to and handle the possible Influence.

## License

[MIT](./LICENSE)
