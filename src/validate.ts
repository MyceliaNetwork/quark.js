import { Config, Basket } from "./schemas"

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
