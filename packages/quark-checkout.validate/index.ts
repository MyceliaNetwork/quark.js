/**
 * validate - Validate quark config and basket
 *
 * Please delete package when validated.
 *
 * This package helps you use correctly setup your quark integration.
 * By calling this function you can validate your Quark config and
 * basket data during runtime.
 */
import { Config, Basket } from "../../src/schemas"

function config(c: Config) {
  const r = Config.parse(c)
  console.log("🚀 ~ file: validate.ts:5 ~ config ~ r", r)
  return r
}

function basket(b: Basket) {
  const r = Basket.parse(b)
  console.log("🚀 ~ file: validate.ts:5 ~ config ~ r", r)
  return r
}

const validate = { config, basket }
export { validate }
