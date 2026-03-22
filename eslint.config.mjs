import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

import prettierPlugin from "eslint-plugin-prettier"

const require = createRequire(import.meta.url)
const { FlatCompat } = require("@eslint/eslintrc")

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
// ✅ GLOBAL ignores (must be its own block)
  {
    ignores: [
      "eslint.config.mjs",
      "node_modules/**",
      "**/.next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "lib/generated/prisma/**", 
      ".wrangler/**",
      "worker-configuration.d.ts"
    ],
  }, 
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "plugin:@typescript-eslint/recommended",
    "prettier", // disables conflicting ESLint rules
  ),

  {

    plugins: {
      prettier: prettierPlugin, // 🔑 REQUIRED in Flat Config
    },

    rules: {
      "prettier/prettier": ["error", { semi: false }],

      // allow `_` to explicitly mark ignored variables and parameters
      "@typescript-eslint/no-unused-vars": [
      "error",
      {
        varsIgnorePattern: "^_$",
        argsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    },
  },
]

export default eslintConfig
