import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import typescript from "@rollup/plugin-typescript"

export default [
  {
    input: "./packages/quark/index.ts",
    plugins: [resolve(), typescript(), commonjs()],
    // indicate which modules should be treated as external
    external: [],
    output: [
      {
        name: "quark",
        file: "./packages/quark/dist/quark.umd.js",
        format: "umd",
        exports: "named",
        sourcemap: true,
      },
      {
        name: "quark",
        file: "./packages/quark/dist/quark.esm.js",
        format: "esm",
        exports: "named",
        sourcemap: true,
      },
    ],
  },

  {
    input: "./packages/quark.validate/index.ts",
    plugins: [resolve(), typescript(), commonjs()],
    // indicate which modules should be treated as external
    external: [],
    output: [
      {
        name: "quark.validate",
        file: "./packages/quark.validate/dist/quark.validate.umd.js",
        format: "umd",
        exports: "named",
        sourcemap: true,
      },
      {
        name: "quark.validate",
        file: "./packages/quark.validate/dist/quark.validate.esm.js",
        format: "esm",
        exports: "named",
        sourcemap: true,
      },
    ],
  },
]
