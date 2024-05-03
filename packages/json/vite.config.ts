import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
    plugins: [
        dts({
            include: ['./lib'],
        }),
    ],
    build: {
        lib: {
            entry: resolve('./lib/index.ts'),
            formats: ['es', 'cjs'],
            fileName(format, name) {
                return `${name}.${format === 'es' ? 'mjs' : 'cjs'}`;
            },
        },
    },
});
