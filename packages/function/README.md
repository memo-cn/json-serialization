# @json-serialization/function <a href="https://github.com/memo-cn/json-serialization/blob/main/packages/function/README.md"><img src="https://img.shields.io/npm/v/@json-serialization/function.svg" /></a> <a href="https://github.com/memo-cn/json-serialization/blob/main/packages/function/README.md"><img src="https://packagephobia.now.sh/badge?p=@json-serialization/function" /></a>

[English](https://github.com/memo-cn/json-serialization/blob/main/packages/function/README.md) | [简体中文](https://github.com/memo-cn/json-serialization/blob/main/packages/function/README.zh-CN.md)

## Introduction

`@json-serialization/function` provides a mechanism for function serialization and deserialization, which can implement cross-context function calls without using `eval`.

During the serialization phase, the original function is converted into a unique UUID identifier. In the deserialization phase, this identifier is converted into a proxy function.

When the proxy function is called, the call parameters and identification information will be sent back to the original context through the specified channel (an object implementing the `onmessage` and `postMessage` methods), thereby triggering the callback execution of the original function.

## Getting Started

### Basic Usage

The following example code creates an `animal` object, which includes a `name` attribute and `eat` and `sleep` methods.

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

> Note: `@json-serialization/function` can be used with `json-serialization`. This is an extensible asynchronous JSON serialization library. You can get to know it by reading [this document](https://github.com/memo-cn/json-serialization/blob/main/packages/json/README.zh-CN.md).

Suppose your current scenario is to serialize functions defined on the client side and then transmit them to the server side via WebSocket.

The client-side code might look like this:

```ts
import { stringify } from 'json-serialization';
import { createFunctionSerDes } from '@json-serialization/function';

var clientSocket = new WebSocket('ws://example.com');
var clientSerDes = createFunctionSerDes(clientSocket);
var jsonText = await stringify([animal, animal.eat, animal.sleep], [clientSerDes.serializer], 4);
```

`@json-serialization/function` provides a factory function `createFunctionSerDes`. The input parameter is a channel object that implements the `onmessage` and `postMessage` methods, and it returns a pair of serializer and deserializer.

The serialized jsonText might be:

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

Each function is assigned a unique UUID identifier and serialized as a string prefixed with `$fun:`.

The server-side deserialization code might be:

```ts
import { parse } from 'json-serialization';
import { createFunctionSerDes } from '@json-serialization/function';

var serverSerDes = createFunctionSerDes(serverSocket);
var object = await parse(jsonText, [serverSerDes.deserializer]);
```

The deserialized `object` is:

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

Fields that are not function identifiers are normally restored, and fields that are function identifiers are converted into proxy functions.

If the proxy function is called, the call parameters and the internally recorded original function identification information will be sent back to the client side through the Socket channel.

The `eat` function on the client side will be called with the same parameters, and `eat fish` will be printed on the client console.

```ts
// client console output: eat fish
object[0].eat('fish');
```

For developers, the call to the deserialized proxy function will be forwarded to the call to the original function. This process seems to have transparently serialized and deserialized the function between different execution contexts.

### Precautions

To avoid causing memory leaks, it is recommended to remove the reference to the function through the `unref` method provided by `FunctionSerDes` after the business logic is executed, Subsequent calls to the proxy function will no longer be forwarded to the original function.

It can be called on either the server side or the client side, and the destructor instruction will be automatically synchronized to the other side.

```ts
// unreferencing function on the client
clientSerDes.unref(animal.eat);

// or unreferencing function on the server
serverSerDes.unref(object[1]);
```

## License

[MIT](./LICENSE)
