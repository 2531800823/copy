export default {
  bracketSpacing: false,
  singleQuote: true,
  jsxBracketSameLine: true,
  trailingComma: 'es5',
  printWidth: 80,
  parser: 'typescript',
  overrides: [
    {
      files: ['*.json', '.syncpackrc'],
      options: {
        parser: 'jsonc',
        singleQuote: false,
        trailingComma: 'none',
      },
    },
    {
      files: ['*.scss', '*.css'],
      options: {
        parser: 'scss',
        trailingComma: 'none',
      },
    },
    {
      files: ['*.md'],
      options: {
        parser: 'markdown',
      },
    },
    {
      files: ['*.html'],
      options: {
        parser: 'html',
      },
    },
    {
      files: ['*.yaml'],
      options: {
        parser: 'yaml',
      },
    },
  ],
}
