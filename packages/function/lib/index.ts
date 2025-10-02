import type { Deserializer, Serializer } from 'json-serialization';
import { CallData, Channel, data2Message, message2Data, UnrefAllData, UnrefData } from './message';
import { uuid } from './uuid';
import { createPrefixEncoder } from 'prefix-encoder';

export { type Channel };

export type FunctionSerDes = {
    serializer: Serializer;
    deserializer: Deserializer;
    /**
     * unreference a function
     * 取消函数引用
     *
     * @desc after unreferencing, the callback function will no longer be triggered.
     * @desc 取消后, 回调函数将不再被触发。
     *
     * @param fun
     *   The function to be unreferenced
     *   需要取消引用的函数
     */
    unref: (fun: (...args: any[]) => any) => boolean;

    /**
     * unreference all functions
     * 取消所有函数引用
     */
    unrefAll: () => void;
};

/**
 * @desc create function serializer and deserializer
 *   - string,   serialized as s{original string}
 *   - function, serialized as f{function uuid}
 *
 * @desc 创建函数序列化和反序列化器
 *   - 序列化为 s{original string}
 *   - 序列化为 f{function uuid}
 *
 * @param channel
 *   The channel used internally for transmitting call messages.
 *   内部用于传输调用消息的信道。
 */
export function createFunctionSerDes(channel: Channel): FunctionSerDes {
    const functionEncoder = createPrefixEncoder<(...args: any[]) => any>({
        prefix: '$fun:',
        escapeCharacter: '_',
        stringify(fun) {
            return originalFunction2Id(fun);
        },
        parse(funId) {
            return id2ProxyFunction(funId);
        },
    });

    const serializer: Serializer = function (key, fun: string | ((...args: any[]) => any)) {
        if (typeof fun === 'string' || typeof fun === 'function') {
            return functionEncoder.encode(fun);
        }
        return fun;
    };

    const deserializer: Deserializer = function (key, str: string) {
        if (typeof (str as any) !== 'string') {
            return str;
        }
        return functionEncoder.decode(str);
    };

    /************************** ***** **************************/

    // 从 id 返回代理函数
    function id2ProxyFunction(funId: string): (...args: any[]) => any {
        let fun = id2proxyFunctionMap.get(funId);
        if (!fun) {
            fun = function proxyFunction(...args) {
                channel.postMessage(
                    data2Message<CallData>({
                        type: 'call',
                        funId,
                        args,
                    }),
                );
            };
            id2proxyFunctionMap.set(funId, fun);
            proxyFunction2idMap.set(fun, funId);
        }
        return fun;
    }

    // 获取原函数对应的 id
    function originalFunction2Id(fun: (...args: any[]) => any): string {
        let funId = originalFunction2idMap.get(fun);
        if (!funId) {
            funId = uuid();
            originalFunction2idMap.set(fun, funId);
            id2originalFunctionMap.set(funId, fun);
        }
        return funId;
    }

    // 原函数和 id 的映射关系
    const originalFunction2idMap = new WeakMap<(...args: any[]) => void, string>();
    const id2originalFunctionMap = new Map<string, (...args: any[]) => void>();

    // 记录代理函数和 id 的映射关系
    const proxyFunction2idMap = new WeakMap<(...args: any[]) => void>();
    const id2proxyFunctionMap = new Map<string, (...args: any[]) => void>();

    function unref(fun: (...args: any[]) => any) {
        const funId = originalFunction2idMap.get(fun) || proxyFunction2idMap.get(fun);
        if (funId) {
            id2originalFunctionMap.delete(funId);
            id2proxyFunctionMap.delete(funId);
            channel.postMessage(
                data2Message<UnrefData>({
                    type: 'unref',
                    funId,
                }),
            );
            return true;
        }
        return false;
    }

    function unrefAll() {
        id2originalFunctionMap.clear();
        id2proxyFunctionMap.clear();
        channel.postMessage(
            data2Message<UnrefAllData>({
                type: 'unrefAll',
            }),
        );
    }

    /************************** ***** **************************/

    const originalOnMessage: any = channel.onmessage;
    channel.onmessage = function (...args: any[]) {
        const data = args[0];
        // 如果原来存在监听器, 对其进行调用。
        if (originalOnMessage) {
            setTimeout(() => {
                Reflect.apply(originalOnMessage, channel, args);
            });
        }

        const callData = message2Data<CallData>(data, 'call');
        if (callData) {
            const fun = id2originalFunctionMap.get(callData.funId);
            if (fun) {
                Reflect.apply(fun, null, callData.args);
            }
            return;
        }

        const unrefData = message2Data<UnrefData>(data, 'unref');
        if (unrefData) {
            const funId = unrefData.funId;
            id2originalFunctionMap.delete(funId);
            id2proxyFunctionMap.delete(funId);
            return;
        }

        const unrefAllData = message2Data<UnrefAllData>(data, 'unrefAll');
        if (unrefAllData) {
            id2originalFunctionMap.clear();
            id2proxyFunctionMap.clear();
            return;
        }
    };

    return {
        serializer,
        deserializer,
        unref,
        unrefAll,
    };
}
