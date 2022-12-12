/**
 * checkout - Open Quark website to confirm checkout
 *
 * After quark.js is properly configured, the integrator
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
    // By assiging the user's Basket value to the closure
    // `checkoutEventHandler` will be able to access it and
    // send it to the Quark website.
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
