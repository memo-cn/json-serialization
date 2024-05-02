/**
 * Serializer 序列化器
 * @desc Similar to the replacer parameter of JSON.stringify
 * @desc 类似于 JSON.stringify 的 replacer 参数
 */
export type Serializer = {
    /**
     * @desc Preliminary test if the value can be serialized, returns falsy then this serializer will not be used
     * @desc 初步测试值是否可以被序列化，如果返回 falsy，则不会使用此序列化器
     */
    test: (value: any, key: string) => boolean | void | null | undefined;

    /**
     * 序列化
     */
    serialize: (value: any, key: string) => any | Promise<any>;
};

/**
 * Deserializer 反序列化器
 * @description Similar to the reviver parameter of JSON.parse
 * @description 类似于 JSON.parse 的 reviver 参数
 */
export type Deserializer = {
    /**
     * @desc Preliminary test if the value can be deserialized, returns falsy then this deserializer will not be used
     * @desc 初步测试值是否可以被反序列化，如果返回 falsy，则不会使用此反序列化器
     */
    test: (value: any, key: string) => boolean | void | null | undefined;

    /**
     * 反序列化
     */
    deserialize: (value: any, key: string) => any | Promise<any>;
};

/**
 * @desc Converts a string into an object using a list of deserializers, enhancing the native JSON.parse function.
 * @desc 使用一组反序列化器将字符串解析为对象，增强了原生的 JSON.parse 函数。
 *
 * @param {string} text - A valid JSON string. 一个有效的 JSON 字符串。
 * @param {Deserializer[]} [deserializerList] - An optional list of deserializers to use. 可选的反序列化器列表。
 * @returns {Promise<any>} The parsed object. 解析后的对象。
 */
export async function parse(text: string, deserializerList?: Deserializer[]): Promise<any> {
    if (!deserializerList || deserializerList.length === 0) {
        return JSON.parse(text);
    }

    const value2deserialized = new Map<any, any>();

    deserializerList = [...deserializerList].reverse();

    return JSON.parse(text, function (key, value) {
        if (value2deserialized.has(value)) {
            return value2deserialized.get(value);
        }

        const promise = new Promise<any>(async (resolve) => {
            let deserializedValue = await value;

            if (Object(deserializedValue) === deserializedValue) {
                for (let [k, v] of Object.entries(deserializedValue)) {
                    deserializedValue[k] = await v;
                }
            }

            const firstIndex = deserializerList.findIndex((r) => r.test(value, key));

            if (firstIndex !== -1) {
                for (let i = firstIndex; i < deserializerList.length; i++) {
                    const r = deserializerList[i];
                    if (firstIndex === i || r.test(deserializedValue, key)) {
                        deserializedValue = await r.deserialize(deserializedValue, key);
                    }
                }
                value2deserialized.set(value, deserializedValue);
            }

            resolve(deserializedValue);
        });

        value2deserialized.set(value, promise);
        return promise;
    });
}

/**
 * @desc Converts a JavaScript value to a string using a list of serializers, enhancing the native JSON.stringify function.
 * @desc 使用一组序列化器将 JavaScript 值序列化为字符串，增强了原生的 JSON.stringify 函数。
 *
 * @param {any} value - The value to stringify. 需要序列化的值。
 * @param {Serializer[]} [serializerList] - An optional list of serializers to use. 可选的序列化器列表。
 * @param {number} [space] - The number of spaces for indentation. 缩进的空格数。
 * @returns {Promise<string>} The stringified value. 序列化后的字符串。
 */
export async function stringify(
    value: any,
    serializerList?: null | undefined | Serializer[],
    space?: number,
): Promise<string> {
    if (!serializerList || serializerList.length === 0) {
        return JSON.stringify(value, null, space);
    }

    const value2serialized = new Map<any, any>();

    const valueQueue: [string, any][] = [['', value]];

    for (; valueQueue.length > 0; ) {
        const [key, rawValue] = valueQueue.shift()!;

        if (value2serialized.has(rawValue)) {
            continue;
        } else {
            value2serialized.set(rawValue, rawValue);
        }

        let serializedValue = rawValue;
        const firstIndex = serializerList.findIndex((r) => r.test(rawValue, key));
        if (firstIndex !== -1) {
            for (let i = firstIndex; i < serializerList.length; i++) {
                const serializer = serializerList[i];
                if (firstIndex === i || serializer.test(serializedValue, key)) {
                    serializedValue = await serializer.serialize(serializedValue, key);
                }
            }
            value2serialized.set(rawValue, serializedValue);
        }

        if (typeof serializedValue !== 'function' && Object(serializedValue) === serializedValue) {
            valueQueue.push(...Object.entries(serializedValue));
        }
    }

    return JSON.stringify(
        value,
        (key, value) => {
            if (value2serialized.has(value)) {
                return value2serialized.get(value);
            }
            return value;
        },
        space,
    );
}
