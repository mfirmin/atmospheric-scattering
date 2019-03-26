import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
    input: './src/main.js',

    plugins: [
        commonjs({
            include: [
                'node_modules/**',
            ],
            ignoreGlobal: false,
            sourceMap: false,
        }),
        resolve({
            jsnext: true,
            main: true,
            browser: true,
        }),
    ],
    output: {
        file: './static/lighting.js',
        format: 'umd',
        name: 'lighting',
    },
};
