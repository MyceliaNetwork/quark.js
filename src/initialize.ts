import { createCheckout } from "./checkout"
import { type Config } from "./schemas"

let quarkWindow
let basket = []

export function initialize(config: Config) {
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
        quarkWindow.postMessage(message, config.domain)
      } else if (event.data.type === "checkoutComplete") {
        config.callback(event.data)
      }
    },
    false,
  )

  const { provider, domain } = config
  return createCheckout({ provider, domain })
}
