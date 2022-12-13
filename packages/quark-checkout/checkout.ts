/**
 * checkout - Open Quark website to confirm checkout
 *
 * After quark-checkout is properly configured, the integrator
 * can call the `checkout` Function returned by this
 * higher order Function to open a new browser window to
 * the Quark website to let the user confirm the transfer.
 */

import {
  type Basket,
  type Checkout,
  type CreateCheckoutConfig,
} from "../../src/schemas"

function createCheckout(config: CreateCheckoutConfig): Checkout {
  const { closure, domain, provider } = config
  return function checkout(b: Basket): boolean {
    // By assiging the user's Basket value to the closure, the
    // `checkoutEventHandler` will be able to access its value
    // once it is receiving the `checkoutLoaded` EventMessage
    // sent by Quark, so that it can update the Quark Checkout
    // page with the basket content.
    closure.basket = b
    const origin = window.origin
    const queryString = JSON.stringify({ origin, provider })
    closure.window = window.open(
      `${domain}/checkout?data=${window.btoa(queryString)}`,
      "_blank",
    )
    return true
  }
}

export { createCheckout }
