import type { Deserializer, Serializer } from 'json-serialization';
import { createPrefixEncoder } from 'prefix-encoder';

/**
 *
 * 字节序列化算法:（uint8 字节序 → uint8 字符串）
 *   将每一个 uint8 字节的数值作为 Unicode 的编码, 得到的字符顺次拼接起来, 称为 uint8 字符串
 *
 * 字节反序列化算法:（uint8 字符串 → uint8 字节序）
 *   取回 uint8 字符串中的每一个字符的 Unicode 编码, 作为 uint8 字节的数值。
 *
 * 例如:
 *
 * UTF-8 字符串:    abc
 * UTF-8 uint8:    97 98 99
 *
 * Unicode:        97 98 99
 * Unicode 字符串:  abc
 *
 * UTF-8 字符串:    天a
 * UTF-8 uint8:    229 164 169 97
 *
 * Unicode:        229 164 169 97
 * Unicode 字符串:  å¤©a
 */

let File = globalThis.File;
let Blob = globalThis.Blob;
let Buffer = globalThis.Buffer;

// 当前环境支持 Buffer
let supportBuffer = typeof Buffer === 'function';
// 当前环境支持 Blob
let supportBlob = typeof Blob === 'function';
// 当前环境支持 File
let supportFile = typeof File === 'function';

const binaryEncoder = createPrefixEncoder<BinaryJson>({
    prefix: '$bin:',
    stringify: JSON.stringify,
    parse: JSON.parse,
    escapeCharacter: '_',
});

// 二进制反序列化器
export const binaryDeserializer: Deserializer = (key, value) => deserialize(value);

// 二进制序列化器
export const binarySerializer: Serializer = async function (key, value) {
    if (Object(value) === value) {
        if (supportBuffer) {
            if (!(value instanceof Buffer)) {
                Object.values(value).forEach((val) => {
                    if (val instanceof Buffer) {
                        Reflect.defineProperty(val, 'toJSON', {
                            enumerable: false,
                            configurable: true,
                            value: null,
                        });
                    }
                });
            }
        }
    }
    return serialize(value);
};

/** ---------------------------------------------------------------------------------- */

async function serialize(value: string | BinaryJson | any): Promise<string> {
    if (typeof value === 'string') {
        return binaryEncoder.encode(value);
    }
    let binaryJson: BinaryJson;
    if (supportFile && value instanceof File) {
        binaryJson = {
            __type: 'File',
            __data: await blob_To_uint8String(value),
            type: value.type,
            name: value.name,
            lastModified: value.lastModified,
            webkitRelativePath: value.webkitRelativePath,
        };
    } else if (supportBlob && value instanceof Blob) {
        binaryJson = {
            __type: 'Blob',
            __data: await blob_To_uint8String(value),
            type: value.type,
        };
    } else if (supportBuffer && value instanceof Buffer) {
        binaryJson = {
            __type: 'Buffer',
            __data: buffer_To_unit8String(value),
        };
    } else if (value instanceof Uint8Array) {
        binaryJson = {
            __type: 'Uint8Array',
            __data: uint8Array_To_uint8String(value),
        };
    } else if (value instanceof ArrayBuffer) {
        binaryJson = {
            __type: 'ArrayBuffer',
            __data: arrayBuffer_To_uint8String(value),
        };
    } else {
        return value as any;
    }
    return binaryEncoder.encode(binaryJson);
}

function deserialize(arg: string): any {
    if (typeof (arg as any) !== 'string') return arg;
    let obj = binaryEncoder.decode(arg);
    if (typeof obj === 'string') return obj;

    let bufferJson = obj.__type === 'Buffer' ? obj : null;
    let blobJson = obj.__type === 'Blob' ? obj : null;
    let fileJson = obj.__type === 'File' ? obj : null;
    const uint8ArrayJson = obj.__type === 'Uint8Array' ? obj : null;
    const arrayBufferJson = obj.__type === 'ArrayBuffer' ? obj : null;

    // node 端不支持 Blob、File 时, 转换为 Buffer
    if ((blobJson && !supportBlob) || (fileJson && !supportFile)) {
        if (supportBuffer) {
            bufferJson = { ...(blobJson || fileJson!), __type: 'Buffer' };
            blobJson = fileJson = null;
        }
    }

    // web 端不支持 Buffer 时, 转换为 Blob
    if (bufferJson && !supportBuffer) {
        if (supportBlob) {
            blobJson = { ...bufferJson, __type: 'Blob', type: '' };
            bufferJson = null;
        }
    }

    if (bufferJson) {
        return uint8String_To_buffer(bufferJson.__data);
    }

    if (blobJson) {
        return uint8String_To_blob(blobJson.__data, { type: blobJson.type });
    }

    if (fileJson) {
        const file = new File([uint8String_To_blob(fileJson.__data)], fileJson.name, {
            type: fileJson.type,
            lastModified: fileJson.lastModified,
        });
        if (typeof fileJson.webkitRelativePath === 'string') {
            Reflect.defineProperty(file, 'webkitRelativePath', {
                value: fileJson.webkitRelativePath,
                configurable: true,
                enumerable: true,
            });
        }
        return file;
    }

    if (uint8ArrayJson) {
        return uint8String_To_uint8Array(uint8ArrayJson.__data);
    }

    if (arrayBufferJson) {
        return uint8String_To_arrayBuffer(arrayBufferJson.__data);
    }
}

/** ---------------------------------------------------------------------------------- */

type BinaryJsonBase = {
    // uint8 字符串
    __data: string;
    // 数据类型
    __type: string;
};

type BinaryJson = Uint8ArrayJson | BufferJson | BlobJson | FileJson | ArrayBufferJson;

type Uint8ArrayJson = BinaryJsonBase & {
    __type: 'Uint8Array';
};

type ArrayBufferJson = BinaryJsonBase & {
    __type: 'ArrayBuffer';
};

type BufferJson = BinaryJsonBase & {
    __type: 'Buffer';
};

type BlobJson = BinaryJsonBase & {
    __type: 'Blob';
    // mime 类型
    type: string;
};

type FileJson = BinaryJsonBase & {
    __type: 'File';
    // mime 类型
    type: string;
    // File 使用
    name: string;
    // File 使用
    lastModified: number;
    // File 使用
    webkitRelativePath?: string;
};

/** ---------------------------------------------------------------------------------- */

function uint8Array_To_uint8String(uint8Array: Uint8Array): string {
    return Array.prototype.map.call(uint8Array, (byte) => String.fromCharCode(byte)).join('');
}

function uint8String_To_uint8Array(uint8string: string): Uint8Array {
    const uint8Array = new Uint8Array(uint8string.length);
    for (let i = 0; i < uint8string.length; i++) {
        uint8Array[i] = uint8string.charCodeAt(i);
    }
    return uint8Array;
}

async function blob_To_uint8String(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    return uint8Array_To_uint8String(uint8Array);
}

function uint8String_To_blob(uint8string: string, options?: BlobPropertyBag): Blob {
    return new Blob([uint8String_To_uint8Array(uint8string).buffer as ArrayBuffer], options);
}

function buffer_To_unit8String(buffer: Buffer) {
    return Array.prototype.map.call(buffer, (byte) => String.fromCharCode(byte)).join('');
}

function uint8String_To_buffer(uint8string: string): Buffer {
    const buffer = Buffer.allocUnsafe(uint8string.length);
    for (let i = 0; i < buffer.length; i++) {
        buffer[i] = uint8string.charCodeAt(i);
    }
    return buffer;
}

function uint8String_To_arrayBuffer(uint8string: string): ArrayBuffer {
    return uint8String_To_uint8Array(uint8string).buffer as ArrayBuffer;
}

function arrayBuffer_To_uint8String(arrayBuffer: ArrayBuffer): string {
    return uint8Array_To_uint8String(new Uint8Array(arrayBuffer));
}
