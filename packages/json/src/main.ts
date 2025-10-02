import { stringify, parse } from '../lib';
import type { Serializer, Deserializer } from '../lib';

basicDemo();
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
