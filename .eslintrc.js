module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  globals: {
    L: 'readonly', // Leaflet global
    TravelApp: 'writable' // Our global app instance
  },
  rules: {
    'indent': ['error', 4],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': ['warn'],
    'no-console': ['warn'],
    'no-debugger': ['warn'],
    'prefer-const': ['error'],
    'no-var': ['error'],
    'arrow-spacing': ['error'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'comma-dangle': ['error', 'never'],
    'eol-last': ['error', 'always'],
    'no-trailing-spaces': ['error'],
    'space-before-blocks': ['error'],
    'keyword-spacing': ['error'],
    'space-infix-ops': ['error'],
    'no-multiple-empty-lines': ['error', { max: 2 }],
    'brace-style': ['error', '1tbs'],
    'camelcase': ['error', { properties: 'never' }]
  }
}; 