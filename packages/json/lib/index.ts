import { replaceReference, restoreReference } from 'reference-path';

/**
 * Serializer 序列化器
 * @description Similar to the replacer parameter of JSON.stringify. 类似于 JSON.stringify 的 replacer 参数。
 * @param {string} key - The current key being processed. 当前正在处理的键。
 * @param {any} value - The value associated with the key. 与该键关联的值。
 * @returns {any | Promise<any>} The transformed value. 转换后的值。
 */
export type Serializer = (this: any, key: string, value: any) => any | Promise<any>;

/**
 * Deserializer 反序列化器
 * @description Similar to the reviver parameter of JSON.parse. 类似于 JSON.parse 的 reviver 参数
 * @param {string} key - The current key being processed. 当前正在处理的键。
 * @param {any} value - The value associated with the key. 与该键关联的值。
 * @returns {any | Promise<any>} The transformed value. 转换后的值。
 */
export type Deserializer = (this: any, key: string, value: any) => any | Promise<any>;

// 当前环境支持 AggregateError
const supportAggregateError = typeof AggregateError === 'function';

/**
 * @description Converts a string into an object using a list of deserializers, enhancing the native JSON.parse function. 使用一组反序列化器将字符串解析为对象，增强了原生的 JSON.parse 函数。
 * @param {string} text - A valid JSON string. 一个有效的 JSON 字符串。
 * @param {null | undefined | Deserializer | (null | undefined | Deserializer)[]} [deserializer] - Optional deserializer(s) to customize the parsing behavior. 可选的反序列化器以自定义序列化行为。
 * @returns {Promise<any>} The parsed object. 解析后的对象。
 */
export async function parse(
    text: string,
    deserializer?: null | undefined | Deserializer | (null | undefined | Deserializer)[],
): Promise<any> {
    if (!Array.isArray(deserializer)) {
        deserializer = [deserializer];
    }

    const deserializerList: Deserializer[] = deserializer?.filter((f) => typeof f === 'function') as Deserializer[];

    if (!deserializerList || deserializerList.length === 0) {
        return restoreReference(JSON.parse(text));
    }

    const value2deserialized = new Map<any, any>();

    deserializerList.reverse();

    return restoreReference(
        await JSON.parse(text, function (key, value) {
            if (value2deserialized.has(value)) {
                return value2deserialized.get(value);
            }

            const promise = new Promise<any>(async (resolve, reject) => {
                try {
                    let deserializedValue = await value;

                    {
                        // 遇到被拒绝的 v 时, 仍然需要继续处理其他 v, 而不是立即抛出第一个错误。否则, 控制台会提示 Uncaught (in promise)
                        const errors: any[] = [];
                        if (Object(deserializedValue) === deserializedValue) {
                            for (const [k, v] of Object.entries(deserializedValue)) {
                                try {
                                    deserializedValue[k] = await v;
                                } catch (e) {
                                    if (supportAggregateError && e instanceof AggregateError) {
                                        errors.push(...e.errors);
                                    } else {
                                        errors.push(e);
                                    }
                                }
                            }
                        }
                        if (errors.length > 0) {
                            if (supportAggregateError && errors.length > 1) {
                                throw new AggregateError(errors, 'multiple errors occurred during parsing');
                            } else {
                                throw errors[0];
                            }
                        }
                    }

                    for (let i = 0; i < deserializerList.length; i++) {
                        const deserializer = deserializerList[i];
                        deserializedValue = await deserializer.bind(this)(key, deserializedValue);
                    }

                    resolve(deserializedValue);
                } catch (e) {
                    reject(e);
                }
            });

            value2deserialized.set(value, promise);
            return promise;
        }),
    );
}

/**
 * @description Converts a JavaScript value to a string using a list of serializers, enhancing the native JSON.stringify function. 使用一组序列化器将 JavaScript 值序列化为字符串，增强了原生的 JSON.stringify 函数。
 *
 * @param {any} value - The value to stringify. 需要序列化的值。
 * @param serializer - An optional list of serializers to use. 可选的序列化器列表。
 * @param {null | undefined | Serializer | (null | undefined | Serializer)[]} [serializer] - Optional serializer(s) to customize the serialization behavior. 可选的序列化器以自定义序列化行为。
 * @param {number} [space] - The number of spaces for indentation. 缩进的空格数。
 * @returns {Promise<string>} The stringified value. 序列化后的字符串。
 */
export async function stringify(
    value: any,
    serializer?: null | undefined | Serializer | (null | undefined | Serializer)[],
    space?: number,
): Promise<string> {
    value = replaceReference(value);

    if (!Array.isArray(serializer)) {
        serializer = [serializer];
    }

    const serializerList: Serializer[] = serializer?.filter((f) => typeof f === 'function') as Serializer[];

    if (!serializerList || serializerList.length === 0) {
        return JSON.stringify(value, null, space);
    }

    const value2serialized = new Map<any, any>();

    // key, value, this
    const valueQueue: [string, any, any][] = [['', value, { '': value }]];

    for (; valueQueue.length > 0; ) {
        const [key, rawValue, that] = valueQueue.shift()!;

        if (value2serialized.has(rawValue)) {
            continue;
        }

        let serializedValue = rawValue;
        for (let i = 0; i < serializerList.length; i++) {
            const serializer = serializerList[i];
            serializedValue = await serializer.bind(that)(key, serializedValue);
        }
        value2serialized.set(rawValue, serializedValue);

        if (typeof serializedValue !== 'function' && Object(serializedValue) === serializedValue) {
            for (const [key, val] of Object.entries(serializedValue)) {
                valueQueue.push([key, val, serializedValue]);
            }
        }
    }

    function getSerialized(value: any) {
        if (value2serialized.has(value)) {
            return value2serialized.get(value);
        }
        return value;
    }

    return JSON.stringify(getSerialized(value), (key, value) => getSerialized(value), space);
}
