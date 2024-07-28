import { createPrefixEncoder } from './prefix-encoder';

const referenceEncoder = createPrefixEncoder<string[]>({
    prefix: '$ref:',
    stringify: JSON.stringify,
    parse: JSON.parse,
    escapeCharacter: '_',
});

/**
 * Convert Circular References
 * 转换循环引用
 *
 * @description
 * Convert circular references in the input data structure to serializable reference paths.
 * 将入参数据结构中的循环引用转换为可序列化的引用路径。
 *
 * @note
 * - This function does not modify the input data structure.
 * 该函数不会修改入参的数据结构。
 *
 * - If the input does not contain any circular references, it returns the input itself.
 * 如果输入不包含任何循环引用，则返回入参本身。
 *
 * - If a part of the input does not contain circular references, the corresponding part in the returned data structure will directly reference that part, rather than a copy of it.
 * 如果入参的某部分不包含循环引用，则返回的数据结构中相应位置会直接引用这一部分，而不是其副本。
 */
export function replaceCircularReference<T = any>(data: T): T {
    const valueToPathMap = new WeakMap<any, any>();

    const valueToNewValue = new Map<any, any>();

    return replace(data, []);

    function replace(value: any, path: string[]) {
        if (valueToNewValue.has(value)) {
            return valueToNewValue.get(value);
        }

        function setNewValue(newValue: any) {
            valueToNewValue.set(value, newValue);
            return newValue;
        }

        if (typeof value === 'string') {
            return setNewValue(referenceEncoder.encode(value));
        }

        if (Object(value) !== value) {
            return setNewValue(value);
        }

        const existingPath = valueToPathMap.get(value);
        if (existingPath) {
            return setNewValue(referenceEncoder.encode(existingPath));
        }

        valueToPathMap.set(value, path);

        let clone: typeof value = Array.isArray(value) ? [] : {};
        let containsCircularReference = false;
        for (let [key, originalValue] of Object.entries(value)) {
            const newValue = replace(originalValue, path.concat(key));
            if (clone[key] !== newValue) {
                clone[key] = newValue;
            }
            if (originalValue !== newValue) {
                containsCircularReference = true;
            }
        }

        return containsCircularReference ? clone : value;
    }
}

/**
 * Restore Circular References
 * 恢复循环引用
 *
 * @description
 * Restore reference relationships in the input data structure.
 * 恢复入参数据结构中的引用关系。
 *
 * @note
 *   This function will directly modify the input data structure.
 *   该函数会直接修改输入的数据结构。
 */
export function restoreCircularReference<T = any>(data: T): T {
    const valueToRefValue = new Map<any, any>();

    return restore(data);

    function restore(value: any) {
        if (Object(value) === value) {
            if (valueToRefValue.has(value)) {
                return valueToRefValue.get(value);
            } else {
                valueToRefValue.set(value, value);
            }
            for (let [key, originalValue] of Object.entries(value)) {
                const newValue = restore(originalValue);
                if (newValue !== value[key]) {
                    value[key] = newValue;
                }
            }
        } else if (typeof value === 'string') {
            if (valueToRefValue.has(value)) {
                return valueToRefValue.get(value);
            }
            const strOrPath = referenceEncoder.decode(value);
            if (typeof strOrPath === 'string') {
                return strOrPath;
            }
            const refValue = getValueByPath(strOrPath);
            valueToRefValue.set(value, refValue);
            return refValue;
        }
        return value;
    }

    function getValueByPath(path: string[]) {
        let current: any = data;
        for (let key of path) {
            current = current[key];
        }
        return current;
    }
}
