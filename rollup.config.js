import resolve from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"

export default [
  {
    input: "./packages/quark.checkout/index.ts",
    plugins: [
      typescript({
        module: "ESNext",
        tsconfig: "./packages/quark.checkout/tsconfig.pkg.json",
      }),
      resolve(),
    ],
    // indicate which modules should be treated as external
    external: [],
    output: [
      {
        name: "quark.checkout",
        file: "./dist/quark.checkout.umd.js",
        format: "umd",
        exports: "named",
        sourcemap: true,
      },
      {
        name: "quark.checkout",
        file: "./dist/quark.checkout.esm.js",
        format: "esm",
        exports: "named",
        sourcemap: true,
      },
    ],
  },

  {
    input: "./packages/quark.checkout.validate/index.ts",
    plugins: [
      typescript({
        module: "ESNext",
        tsconfig: "./packages/quark.checkout.validate/tsconfig.pkg.json",
      }),
      resolve(),
    ],
    // indicate which modules should be treated as external
    external: [],
    output: [
      {
        name: "quark.checkout.validate",
        file: "./dist/quark.checkout.validate.umd.js",
        format: "umd",
        exports: "named",
        sourcemap: true,
      },
      {
        name: "quark.checkout.validate",
        file: "./dist/quark.checkout.validate.esm.js",
        format: "esm",
        exports: "named",
        sourcemap: true,
      },
    ],
  },
]
