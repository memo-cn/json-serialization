export type Channel = {
    onmessage?: ((ev: any) => any) | null;
    postMessage: (message: any) => void;
};

import { name as NameSpace } from '../package.json';

export type CallData = {
    type: 'call';
    funId: string;
    args: any[];
};

export type UnrefData = {
    type: 'unref';
    funId: string;
};

export function data2Message<T>(msg: T) {
    return {
        [NameSpace]: msg,
    };
}

export function message2UnrefData(data: any): UnrefData | null {
    const ns = data?.[NameSpace] || data?.data?.[NameSpace];
    if (Object(ns) !== ns) {
        return null;
    }
    if (ns.type !== 'unref') {
        return null;
    }
    if (typeof ns.funId !== 'string') {
        return null;
    }
    return ns;
}

export function message2CallData(data: any): CallData | null {
    const ns = data?.[NameSpace] || data?.data?.[NameSpace];
    if (Object(ns) !== ns) {
        return null;
    }
    if (ns.type !== 'call') {
        return null;
    }
    if (typeof ns.funId !== 'string') {
        return null;
    }
    if (!Array.isArray(ns.args)) {
        return null;
    }
    return ns;
}
