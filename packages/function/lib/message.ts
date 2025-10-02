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

export type UnrefAllData = {
    type: 'unrefAll';
};

export function message2Data<D extends { type: string } = never>(msg: any, type: D['type']): D | null {
    const data = msg?.[NameSpace] || msg?.data?.[NameSpace];
    if (Object(data) !== data || data.type !== type) return null;
    return data;
}

export function data2Message<T = never>(data: T) {
    return {
        [NameSpace]: data,
    };
}
