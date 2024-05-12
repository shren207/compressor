module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'react', '@typescript-eslint'],
  rules: {
    'sort-imports': [
      'error',
      {
        ignoreMemberSort: false,
        ignoreDeclarationSort: true,
        ignoreCase: true,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
      },
    ],
    '@typescript-eslint/consistent-type-imports': ['error'],
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
};
