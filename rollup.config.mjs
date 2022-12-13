import resolve from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"
import commonjs from "@rollup/plugin-commonjs"

function createConfig(name) {
  return {
    input: `./packages/${name}/index.ts`,
    plugins: [resolve({ browser: true }), typescript(), commonjs()],
    // indicate which modules should be treated as external
    external: ["zod", "@dfinity/principal"],
    output: [
      {
        name,
        file: `./packages/${name}/dist/${name}.umd.js`,
        format: `umd`,
        exports: `named`,
        sourcemap: true,
      },
      {
        name,
        file: `./packages/${name}/dist/${name}.esm.js`,
        format: `esm`,
        exports: `named`,
        sourcemap: true,
      },
    ],
  }
}

export default [
  createConfig("quark-checkout", false),
  createConfig("quark-checkout.validate", false),
]
