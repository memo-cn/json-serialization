// import { parse, stringify } from 'json-serialization';
import { parse, stringify } from '../../json/lib';
import { binaryDeserializer, binarySerializer } from '../lib/index';

main();

async function main() {
    var oldObject: any = {
        file: new File(['file content | 文件内容'], 'file name | 文件名', {
            lastModified: Date.now(),
            type: 'text/plain',
        }),
        blob: new Blob(['hi', '测试'], { type: 'text' }),
        uint8: Uint8Array.from([96, 97, 98]),
        arrayBuffer: Uint8Array.from([30, 31]).buffer,
    };

    var json = await stringify(oldObject, [binarySerializer], 4);

    var newObject = await parse(json, [binaryDeserializer]);

    console.dir(newObject);

    import.meta.hot!.send('json', json);

    import.meta.hot!.on('json', async (json) => {
        try {
            var obj = await parse(json, [binaryDeserializer]);
            console.dir(obj);
        } catch (e) {
            console.error(e);
        }
    });
}
