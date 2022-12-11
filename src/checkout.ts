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
  provider,
  domain,
  windowObject,
}: CreateCheckoutArgs): Checkout {
  return function checkout(basket: Basket): Basket {
    // TODO: validate in outside module to separate validation from logic
    // if (!validateBasket(data)) return
    const queryString = JSON.stringify({
      origin: window.origin,
      provider: provider,
    })
    windowObject = window.open(
      `${domain}/checkout?data=${btoa(queryString)}`,
      "_blank",
    )
    return basket
  }
}

export { createCheckout }
