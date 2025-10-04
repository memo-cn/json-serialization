# @json-serialization/function <a href="https://www.npmjs.com/package/@json-serialization/function"><img src="https://img.shields.io/npm/v/@json-serialization/function.svg" /></a>

[English](https://github.com/memo-cn/json-serialization/blob/main/packages/function/README.md) | [简体中文](https://github.com/memo-cn/json-serialization/blob/main/packages/function/README.zh-CN.md)

## 介绍

`@json-serialization/function` 提供了一种函数序列化和反序列化的机制，能够在不使用 `eval` 的情况下实现函数的跨上下文调用。

在序列化阶段，原始函数被转换为一个唯一的 UUID 标识，在反序列化阶段，这个标识被转换为一个代理函数。

当代理函数被调用时，调用参数和标识信息会通过指定的信道（实现 `onmessage` 和 `postMessage` 方法的对象）被发送回原始上下文，从而触发原始函数的回调执行。

## 起步

### 基本用法

以下示例代码创建了一个 `animal` 对象，该对象包含 `name` 属性以及 `eat` 和 `sleep` 方法。

```ts
var animal = {
    name: 'cat',
    eat() {
        console.log('eat', ...arguments);
    },
    sleep() {
        console.log('sleep', ...arguments);
    },
};
```

> 提示: `@json-serialization/function` 可以配合 `json-serialization` 使用。这是一个可扩展的异步 JSON 序列化库，你可以通过阅读[这篇文档](https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.zh-CN.md)对其有所了解。

假设你现在的场景是需要将定义在客户端的函数序列化，然后通过 WebSocket 传输到服务端。

客户端的代码可能如下：

```ts
import { stringify } from 'json-serialization';
import { createFunctionSerDes } from '@json-serialization/function';

var clientSocket = new WebSocket('ws://example.com');
var clientSerDes = createFunctionSerDes(clientSocket);
var jsonText = await stringify([animal, animal.eat, animal.sleep], [clientSerDes.serializer], 4);
```

`@json-serialization/function` 提供的 `createFunctionSerDes` 是一个工厂函数，入参是一个实现了 `onmessage` 和 `postMessage` 方法的信道对象，返回一对序列化器和反序列化器。

序列化后的 `jsonText` 可能为:

```json
[
    {
        "name": "cat",
        "eat": "$fun:d6c95def-79d3-41c7-bfb2-afc797c300a0",
        "sleep": "$fun:fd5cff004-bb7d-43f3-bae7-ad64aac8be71"
    },
    "$fun:d6c95def-79d3-41c7-bfb2-afc797c300a0",
    "$fun:d5cff004-bb7d-43f3-bae7-ad64aac8be71"
]
```

每个函数都被分配了一个唯一的 UUID 标识符，并被序列化为带有 `$fun:` 前缀的字符串。

服务端反序列化的代码可能为:

```ts
import { parse } from 'json-serialization';
import { createFunctionSerDes } from '@json-serialization/function';

var serverSerDes = createFunctionSerDes(serverSocket);
var object = await parse(jsonText, [serverSerDes.deserializer]);
```

反序列化出的 `object` 为:

```ts
[
    {
        name: "cat",
        eat: proxyFunction<link to eat>,
        sleep: proxyFunction<link to sleep>,
    },
    proxyFunction<link to eat>,
    proxyFunction<link to sleep>
]
```

非函数标识的字段被正常还原，函数标识字段则被转换为了代理函数。

如果对代理函数进行调用，调用参数和内部记录的原始函数标识信息会通过 Socket 信道发送回客户端。

客户端的 `eat` 函数会以同样入参被调用，在客户端控制台打印 `eat fish`。

```ts
// client console output: eat fish
object[0].eat('fish');
```

对于开发者来说，对反序列化出的代理函数的调用会被转发为对原始函数的调用，这一过程仿佛将函数在不同执行上下文之间进行了透明地序列化与反序列化。

### 注意事项

为了避免造成内存泄漏，建议在业务逻辑执行完成后，通过 `FunctionSerDes` 提供的 `unref` 方法来移除对函数的引用，之后对代理函数调用也将不会再被转发至原函数。

在服务端或客户端任意一方调用即可，析构指令会自动同步到另一方。

```ts
// unreferencing function on the client
clientSerDes.unref(animal.eat);

// or unreferencing function on the server
serverSerDes.unref(object[1]);
```

## 许可

[MIT](./LICENSE)
