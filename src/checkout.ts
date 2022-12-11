/**
 * checkout - Open Quark website to confirm checkout
 *
 * After quark.js is properly configured, the integrator
 * can call the `checkout` Function returned by this
 * higher order Function to open a new browser window to
 * the Quark website to let the user confirm the transfer.
 */

import { type CreateCheckoutArgs, type Checkout, type Basket } from "./schemas"

function createCheckout({
  domain,
  provider,
  closure,
}: CreateCheckoutArgs): Checkout {
  return function checkout(b: Basket): boolean {
    // TODO: validate in outside module to separate validation from logic
    // if (!validateBasket(data)) return
    closure.basket = b
    const queryString = JSON.stringify({
      origin: window.origin,
      provider,
    })
    closure.window = window.open(
      `${domain}/checkout?data=${btoa(queryString)}`,
      "_blank",
    )
    return true
  }
}

export { createCheckout }
