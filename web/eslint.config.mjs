/**
 * Copyright 2022-2024 HEIG-VD
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
  {
    ignores: ['.next/**', 'node_modules/**', 'build/**', 'next-env.d.ts'],
  },
])
