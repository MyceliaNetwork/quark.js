import resolve from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"

export default [
  {
    input: "./packages/quark/index.ts",
    plugins: [resolve(), typescript()],
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
    plugins: [typescript(), resolve()],
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