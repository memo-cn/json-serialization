import { defineConfig } from 'vite';
import { resolve } from 'path';
import { name } from './package.json';
import { binaryDeserializer, binarySerializer } from './lib/index';
// import { parse, stringify } from 'json-serialization';
import { parse, stringify } from '../json/lib';
import { readFileSync } from 'fs';

export default defineConfig({
    plugins: [
        {
            name: 'binary-serializer-demo',
            apply: 'serve',
            configureServer(viteDevServer) {
                viteDevServer.hot.on('json', async (oldJson) => {
                    // console.log(json);
                    var obj = await parse(oldJson, [binaryDeserializer]);
                    if (Object(obj) === obj) {
                        obj.CHANGELOG = readFileSync('./CHANGELOG.md');
                    }
                    var newJson = await stringify(obj, [binarySerializer], 4);
                    console.log('obj:', obj);
                    // console.log('json:', newJson);

                    viteDevServer.hot.send('json', newJson);
                });
            },
        },
        {
            name: 'inject-title',
            apply: 'serve',
            transformIndexHtml(html, ctx) {
                const ind = name.indexOf('/');
                return {
                    html,
                    tags: [
                        {
                            tag: 'title',
                            injectTo: 'head-prepend',
                            children: ind === -1 ? name : name.slice(ind + 1),
                        },
                    ],
                };
            },
        },
    ],
    build: {
        sourcemap: true,
        minify: false,
        lib: {
            entry: resolve('./lib/index.ts'),
            formats: ['es', 'cjs'],
            fileName(format, name) {
                return `${name}.${format === 'es' ? 'mjs' : 'cjs'}`;
            },
        },
    },
});
