/**
 * checkout - Open Quark website to confirm checkout
 *
 * After quark-checkout is properly configured, the integrator
 * can call the `checkout` Function returned by this
 * higher order Function to open a new browser window to
 * the Quark website to let the user confirm the transfer.
 */
import { type Checkout, type CreateCheckoutConfig } from "../../src/schemas";
declare function createCheckout(config: CreateCheckoutConfig): Checkout;
export { createCheckout };
