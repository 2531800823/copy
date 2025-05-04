import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  react: true,
  ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/dist-electron/**'],
  rules: {
    'no-console': 'off',
  },
})
