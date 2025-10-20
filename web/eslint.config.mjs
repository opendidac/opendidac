import { defineConfig } from "eslint/config";
import unusedImports from "eslint-plugin-unused-imports";
import licenseHeader from "eslint-plugin-license-header";

import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import prettierConfig from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    ...compat.extends("next/core-web-vitals"),
    prettierConfig,
    {
        plugins: {
            "license-header": licenseHeader,
            "unused-imports": unusedImports,
        },

        rules: {
            "unused-imports/no-unused-imports": "error",
            "license-header/header": [ "error", "license.js"],
        },
    }
]);