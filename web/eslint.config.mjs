import { defineConfig } from 'eslint/config'
import licenseHeader from 'eslint-plugin-license-header'
import unusedImports from 'eslint-plugin-unused-imports'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default defineConfig([
  ...compat.extends('next/core-web-vitals', 'prettier'),
  {
    plugins: {
      'license-header': licenseHeader,
      'unused-imports': unusedImports,
    },

    rules: {
      'license-header/header': [2, 'license.js'],
      'unused-imports/no-unused-imports': 'error',
    },
  },
])
