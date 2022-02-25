module.exports = {
    root: true,
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-undef': 'error',
        'no-unused-vars': ['warn', { args: 'none' }],
        '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
        'import/prefer-default-export': 'off',
        '@typescript-eslint/explicit-module-boundary-types': ['off'],
    },
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
    ],
    parserOptions: {
        ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
    },
    settings: {
        'import/resolver': {
            node: {
                paths: ['src'],
                extensions: ['.js', '.ts'],
            },
        },
    },
};
