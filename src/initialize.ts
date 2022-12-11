import { createCheckout } from "./checkout"
import { type Config, type Checkout } from "./schemas"

export function initialize(config: Config): Checkout {
  // higher order variables that get assigned upon checkout
  const closure = {
    window: undefined,
    basket: [],
  }

  window.addEventListener(
    "message",
    function (event) {
      console.log("🚀 ~ file: initialize.ts:33 ~ initialize ~ event", event)
      if (event.origin !== config.domain) return // DANGER ZONE
      if (!["checkoutLoaded", "checkoutComplete"].includes(event.data.type))
        return
      if (event.data.type === "checkoutLoaded") {
        const message = JSON.parse(
          JSON.stringify({
            type: "basketUpdate",
            origin,
            basket: closure.basket,
            notify: config.notify,
            integrator: config.integrator,
            provider: config.provider,
          }),
        )
        console.log(
          "🚀 ~ file: initialize.ts:23 ~ initialize ~ message",
          message,
        )
        closure.window.postMessage(message, config.domain)
      } else if (event.data.type === "checkoutComplete") {
        config.callback(event.data)
      }
    },
    false,
  )
  const { provider, domain } = config
  return createCheckout({ provider, domain, closure })
}
