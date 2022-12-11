import { createCheckout } from "./checkout"
import { type Config, type Checkout } from "./schemas"

let basket = []

export function initialize(config: Config): Checkout {
  const windowObject = window
  window.addEventListener(
    "message",
    function (event) {
      if (event.origin !== config.domain) return // DANGER ZONE
      if (!["checkoutLoaded", "checkoutComplete"].includes(event.data.type))
        return
      if (event.data.type === "checkoutLoaded") {
        const message = JSON.parse(
          JSON.stringify({
            type: "basketUpdate",
            basket,
            origin,
            notify: config.notify,
            integrator: config.integrator,
            provider: config.provider,
          }),
        )
        windowObject.postMessage(message, config.domain)
      } else if (event.data.type === "checkoutComplete") {
        config.callback(event.data)
      }
    },
    false,
  )

  const { provider, domain } = config
  return createCheckout({ provider, domain, windowObject })
}
