module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
      'plugin:@typescript-eslint/recommended',
      'prettier',
      'plugin:prettier/recommended'
    ],
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module'
    },
    env: {
      node: true,
      jest: true
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  };