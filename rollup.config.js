import { terser } from "rollup-plugin-terser"
import resolve from "@rollup/plugin-node-resolve"

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
      name: "quark",
      file: "dist/quark.umd.min.js",
      format: "umd",
      exports: "named",
      sourcemap: true,
    },
    {
      file: "dist/quark.esm.min.js",
      format: "esm",
      exports: "named",
      sourcemap: true,
    },
  ],
}
