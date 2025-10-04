# @json-serialization/binary <a href="https://www.npmjs.com/package/@json-serialization/binary"><img src="https://img.shields.io/npm/v/@json-serialization/binary.svg" /></a>

[English](https://github.com/memo-cn/json-serialization/blob/main/packages/binary/README.md) | [简体中文](https://github.com/memo-cn/json-serialization/blob/main/packages/binary/README.zh-CN.md)

## 介绍

`@json-serialization/binary` 提供了一种二进制序列化和反序列化的机制，支持 `ArrayBuffer`、`Buffer`、`Blob`、`File`、`Uint8Array` 这些数据类型。

> 提示: `@json-serialization/binary` 需要配合 `json-serialization` 使用。这是一个可扩展的异步 JSON 序列化库，你可以通过阅读[这篇文档](https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.zh-CN.md)对其有所了解。

## 注意事项

- 考虑到在 Web 环境中，`Buffer` 不受支持，在低版本 Node.js 环境中可能也不支持 `Blob` 和 `File`。在反序列化时，`@json-serialization/binary` 可能会对这 3 种数据类型进行相互转换，以确保适应运行环境。

- 为了防止 `Buffer` 被 `JSON.stringify` 预处理，`@json-serialization/binary` 内部会在 `Buffer` 对象实例上设置 `toJSON` 属性，值设为 `null`，请注意并处理可能的影响。

## 许可

[MIT](./LICENSE)
