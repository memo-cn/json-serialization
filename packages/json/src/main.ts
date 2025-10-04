import { stringify, parse } from '../lib';
import type { Serializer, Deserializer } from '../lib';

circularReferenceDemo();
async function circularReferenceDemo() {
    var html = { name: 'html' };
    var head = { name: 'head' };
    var body = { name: 'body' };

    head.parent = html;
    body.parent = html;

    head.next = body;
    body.prev = head;

    html.children = [head, body];

    var json = await stringify(html, null, 4);

    console.log(json, json === (await stringify(await parse(json), null, 4)));
}

basicDemo();
async function basicDemo() {
    // {"name":"memo","age":18}
    var json = await stringify({ name: 'memo', age: 18 });

    // {name: 'memo', age: 18}
    var object = await parse(json);

    console.log(json, object);

    const BigIntSerializer: Serializer = function (key, value: bigint | string | any) {
        switch (typeof value) {
            case 'bigint':
                return 'b' + String(value);
            case 'string':
                return 's' + value;
            default:
                return value;
        }
    };

    const BigIntDeserializer: Deserializer = function (key, value: string) {
        switch (value[0]) {
            case 's':
                return value.slice(1);
            case 'b':
                return BigInt(value.slice(1));
            default:
                return value;
        }
    };

    // {"name":"smemo","age":"b18"}
    var json = await stringify({ name: 'memo', age: 18n }, [BigIntSerializer]);

    // {name: 'memo', age: 18}
    var object = await parse(json, [BigIntDeserializer]);

    console.log(json, object);
}

import { binarySerializer, binaryDeserializer } from '../../binary';
import { errorSerializer, errorDeserializer } from '../../error';

// demo3();
async function demo3() {
    var originalObject = {
        name: 'memo',
        age: 18,
        refDemo: {
            obj1: { obj2: {} },
            arr: [],
        },
        errDemo: new TypeError('error-demo'),
    };
    originalObject.refDemo.arr[0] = originalObject.refDemo.obj1.obj2;

    var jsonText = await stringify(originalObject, [binarySerializer, errorSerializer]);
    console.log(JSON.stringify(JSON.parse(jsonText), null, 4));

    var object = await parse(jsonText, [binaryDeserializer, errorDeserializer]);
    // true
    console.log(object.refDemo.arr[0] === object.refDemo.obj1.obj2);
}
