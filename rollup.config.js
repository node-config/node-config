const { defineConfig } = require("rollup");
const nodeResolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const terser = require("@rollup/plugin-terser");

export default defineConfig({
  input: "./lib/config.js",
  output: [
    {
      // esm first
      file: "./dist/config.js",
      format: "esm",
    },
    {
      // compatible with commonjs
      file: "./dist/config.cjs",
      format: "cjs",
    },
  ],

  plugins: [commonjs(), nodeResolve(), terser()],
});
