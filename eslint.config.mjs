import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import reactHooks from "eslint-plugin-react-hooks"

const eslintConfig = defineConfig([
  reactHooks.configs.flat.recommended,
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/features/**/*.{ts,tsx,js,jsx,mjs,cjs}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*"],
              message: "Feature folders must be self-contained. Import shared code from '@/shared/*' instead of importing from another feature."
            },
            {
              group: ["../../*", "../../../*", "../../../../*", "../../../../../*"],
              message: "Avoid multi-level relative imports inside features. Use same-feature local paths or shared aliases like '@/shared/*'."
            }
          ]
        }
      ]
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts"
  ])
])

export default eslintConfig
