import { defineConfig } from 'vite';
import { resolve } from 'path';
import { name } from './package.json';

export default defineConfig({
    plugins: [
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
