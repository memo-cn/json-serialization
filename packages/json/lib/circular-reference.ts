import { createPrefixEncoder } from './prefix-encoder';

// 创建一个用于编码和解码循环引用路径的编码器
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
    // 存储值到路径的映射
    const valueToPathMap = new WeakMap<any, string[]>();

    // 存储原始值到新值的映射
    const valueToNewValue = new Map<any, any>();

    // 开始替换循环引用
    return replace(data, []);

    // 递归替换函数
    function replace(value: any, path: string[]) {
        // 如果值已经被处理过，直接返回缓存的新值
        if (valueToNewValue.has(value)) {
            return valueToNewValue.get(value);
        }

        // 设置并缓存新值
        function setNewValue(newValue: any) {
            valueToNewValue.set(value, newValue);
            return newValue;
        }

        // 如果值是字符串，进行编码处理
        if (typeof value === 'string') {
            return setNewValue(referenceEncoder.encode(value));
        }

        // 如果值不是对象，直接返回
        if (Object(value) !== value) {
            return value;
        }

        // 如果值是对象, 检查是否已经存在路径
        const existingPath = valueToPathMap.get(value);
        // 如果已经存在, 说明之前被处理过
        if (existingPath) {
            valueToPathMap.delete(value);
            // 直接返回首次处理时的路径，并建立值与路径字符串的映射关系。第 3 次及以后将直接从缓存中取到编码后的字符串路径
            return setNewValue(referenceEncoder.encode(existingPath));
        } else {
            // 将当前值和路径存储。后续该值被第 2 次处理时，直接返回路径
            // 现在不立即, 而是等到值被第 2 次处理时再进行序列化, 是为了避免不必要的计算
            valueToPathMap.set(value, path);
        }

        // 复制对象或数组
        let clone: typeof value = Array.isArray(value) ? [] : {};
        // 是否包含循环引用
        let containsCircularReference = false;
        // 遍历键值对
        for (let [key, originalValue] of Object.entries(value)) {
            // 递归处理子值
            const newValue = replace(originalValue, path.concat(key));
            // 如果 clone 的当前属性与新值不同，则更新 clone 的该属性为新值
            if (clone[key] !== newValue) {
                clone[key] = newValue;
            }
            // 如果原始值与新值不同，表明存在循环引用
            if (originalValue !== newValue) {
                containsCircularReference = true;
            }
        }

        // 如果包含循环引用，返回克隆的值，否则返回原值
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

    // 用于存储值到引用值或缓存值的映射，用于恢复引用关系
    const valueToNewValue = new Map<any, any>();

    // 开始恢复循环引用
    return restore(data);

    // 递归恢复函数
    function restore(value: any) {

        // 恢复引用关系
        if (valueToNewValue.has(value)) {
            return valueToNewValue.get(value);
        }

        // 设置并缓存新值
        function setNewValue(newValue: any) {
            valueToNewValue.set(value, newValue);
            return newValue;
        }

        if (typeof value === 'string') {
            // 解码字符串，可能得到路径或原始字符串
            const strOrPath = referenceEncoder.decode(value);
            // 本来就是字符串
            if (typeof strOrPath === 'string') {
                return setNewValue(strOrPath);
            } else {
                // 恢复路径获取引用值
                const refValue = getValueByPath(strOrPath);
                return setNewValue(refValue);
            }
        }

        if (Object(value) !== value) {
            return value;
        }

        for (let [key, originalValue] of Object.entries(value)) {
            // 递归处理子值
            const newValue = restore(originalValue);
            if (newValue !== value[key]) {
                value[key] = newValue;
            }
        }

        return setNewValue(value);
    }

    // 根据路径获取值
    function getValueByPath(path: string[]) {
        let current: any = data;
        for (let key of path) {
            current = current[key];
        }
        return current;
    }
}
