import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/games/hedge-fund-floor/model.ts"],
    rules: { "prefer-const": "warn" },
  },
  // Daybook sources are concatenated into one script by daybook/build.py, so
  // they share globals across files; public/daybook/index.html is the build output.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "daybook/**", "public/daybook/**"]),
]);
