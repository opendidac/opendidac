import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import header from "eslint-plugin-header";
import unusedImports from "eslint-plugin-unused-imports";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  // import.meta.dirname is available after Node.js v20.11.0
  baseDirectory: import.meta.dirname,
})

export default defineConfig([{
    extends: [...nextCoreWebVitals, ...compat.extends("prettier")],

    plugins: {
        header,
        "unused-imports": unusedImports,
    },

    rules: {
        "header/header": [2, "license.js"],
        "unused-imports/no-unused-imports": "error",
    },
}]);