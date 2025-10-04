// import { parse, stringify } from 'json-serialization';
import { parse, stringify } from '../../json/lib';
import { errorSerializer, errorDeserializer } from '../lib/index';

// demo1();
demo2();
// demo3();

async function demo3() {
    console.log(errorSerializer('', '$err:test'), errorSerializer('', null), errorSerializer('', 2025));
    console.log(errorDeserializer('', '$err:{"name":"TypeError", "message": "demo3"}'), errorDeserializer('', 2025));
}

async function demo2() {
    const err = new Error('test');
    err.code = 404;
    const json = errorSerializer('', err);
    const err2 = errorDeserializer('', json);
    console.log(json);
    console.log(err2);
}

async function demo1() {
    let e1, e2, e3;

    try {
        new (void 0 as any)();
    } catch (e) {
        e1 = e;
    }
    try {
        (null as any)();
    } catch (e) {
        e2 = e;
    }
    e3 = new AggregateError([e1, e2], 'my Aggregate Error');

    let oldObject: any = {
        year: 2025,
        name: 'demo',
        e1,
        e2,
        e3,
    };

    const json = await stringify(oldObject, [errorSerializer], 4);
    console.log('json', json);

    const newObject = await parse(json, [errorDeserializer]);
    console.log('new object', newObject);
}
