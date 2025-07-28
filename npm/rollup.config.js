import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/browser/me.browser.js", // punto de entrada principal
  output: [
    {
      file: "dist/this-me.esm.js",
      format: "es",
      sourcemap: true,
    },
    {
      file: "dist/this-me.umd.js",
      format: "umd",
      name: "me", // expone window.me en browsers
      sourcemap: true,
    },
    {
      file: "dist/this-me.cjs.js",
      format: "cjs",
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    json(),
    terser(), // minificación opcional
  ],
};