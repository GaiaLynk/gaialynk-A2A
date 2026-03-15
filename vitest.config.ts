import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/server/tests/**/*.test.ts", "packages/website/tests/**/*.test.ts"],
  },
});
