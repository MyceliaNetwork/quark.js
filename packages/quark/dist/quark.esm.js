/**
 * checkout - Open Quark website to confirm checkout
 *
 * After quark.js is properly configured, the integrator
 * can call the `checkout` Function returned by this
 * higher order Function to open a new browser window to
 * the Quark website to let the user confirm the transfer.
 */
function createCheckout(config) {
    const { closure, domain, provider } = config;
    return function checkout(b) {
        // By assiging the user's Basket value to the closure, the
        // `checkoutEventHandler` will be able to access its value
        // once it is receiving the `checkoutLoaded` EventMessage
        // sent by Quark, so that it can update the Quark Checkout
        // page with the basket content.
        closure.basket = b;
        const origin = window.origin;
        const queryString = JSON.stringify({ origin, provider });
        closure.window = window.open(`${domain}/checkout?data=${window.btoa(queryString)}`, "_blank");
        return true;
    };
}

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
function initialize(config) {
    // higher order variables that get assigned upon checkout
    const closure = {
        window: undefined,
        basket: [],
    };
    window.addEventListener("message", function checkoutEventHandler(event) {
        var _a;
        if (event.origin !== config.domain)
            return; // DANGER ZONE
        if (!["checkoutLoaded", "checkoutComplete"].includes(event.data.type))
            return;
        if (event.data.type === "checkoutLoaded") {
            const message = JSON.parse(JSON.stringify({
                type: "basketUpdate",
                origin: window.origin,
                basket: closure.basket,
                notify: config.notify,
                integrator: config.integrator,
                provider: config.provider,
            }));
            (_a = closure.window) === null || _a === void 0 ? void 0 : _a.postMessage(message, config.domain);
        }
        else if (event.data.type === "checkoutComplete") {
            config.callback(event.data);
        }
    }, false);
    const { provider, domain } = config;
    return createCheckout({ provider, domain, closure });
}

export { initialize };
//# sourceMappingURL=quark.esm.js.map
