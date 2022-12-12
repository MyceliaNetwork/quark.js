/**
 * initialize - Initialize quark.js
 *
 * When called the configuration passed as a parameter is first
 * validated. When validated, we're attaching an eventListener
 * to the window scope. The eventListener will execute a handler
 * upon receiving an incoming message. When this message comes from
 * the Quark website it will execute code to ensure communication
 * between quark.js and the Quark website.
 *
 * There are two types of incoming messages on the quark.js-side:
 * - `checkoutLoaded`: this message will be dispatched once the Quark
 * checkout page was opened in another tab. Upon receiving this
 * message we will send all the necessary data to the opened tab,
 * such as `basket`, `integrator`, etc. using a window.postMessage
 * MessageEvent with the type "basketUpdate".
 * - `checkoutComplete`: this is sent to our listener when the user
 * has confirmed the checkout on the Quark website. Upon receiving
 * a message with this type, we will call the `callback` Function
 * that the user passed inside the init() config and it's up to
 * the integrator to take it from there.
 *
 * Also, there is one type of outgoing message going from the
 * quark.js-side to the Quark-side:
 * - `basketUpdate`: When opened in the end-user's browser, the
 * Checkout page on the Quark website will listen for this
 * particular message to update the contents of the checkout
 * and calculate the total sum of the transaction to display
 * this to the user to confirm.
 *
 * checkout(basket);
 **/
import { type Config, type Checkout } from "../../src/schemas";
export declare function initialize(config: Config): Checkout;
