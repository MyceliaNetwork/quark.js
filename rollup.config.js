import { terser } from "rollup-plugin-terser";
import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "index.js",
  plugins: [
    terser(),
    resolve({
      // pass custom options to the resolve plugin
      customResolveOptions: {
        moduleDirectories: ["node_modules"],
      },
    }),
  ],
  // indicate which modules should be treated as external
  external: [],
  output: [
    {
      file: "dist/esm/quark.js",
      format: "esm",
      exports: "named",
      sourcemap: true,
    },
    {
      file: "dist/umd/quark.js",
      name: "quark",
      format: "umd",
      exports: "named",
      sourcemap: true,
    },
  ],
};
