import { terser } from "rollup-plugin-terser"
import resolve from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"

export default [
  {
    input: "./src/initialize.ts",
    plugins: [
      typescript({ module: "ESNext" }),
      // TODO: uncomment
      // terser(),
      resolve({
        // TODO: review this
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
        name: "quark",
        file: "dist/quark.esm.min.js",
        format: "esm",
        exports: "named",
        sourcemap: true,
      },
    ],
  },

  {
    input: "./src/validate.ts",
    plugins: [
      typescript({ module: "ESNext" }),
      // TODO: uncomment
      // terser(),
      resolve({
        // TODO: review this
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
        name: "validate",
        file: "dist/validate.umd.min.js",
        format: "umd",
        exports: "named",
        sourcemap: true,
      },
      {
        name: "validate",
        file: "dist/validate.esm.min.js",
        format: "esm",
        exports: "named",
        sourcemap: true,
      },
    ],
  },
]
