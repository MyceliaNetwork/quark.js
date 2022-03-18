let quarkWindow
let basket = []
const ALLOWED_AUTH_PROVIDERS = ["ii"]
const ALLOWED_VALUE_TYPES = ["ICP"]

/**
 * NotifyObject
 *
 * Used to produce a Candid func that is called when the checkout
 * has been confirmed on the Quark website. From there on out it is
 * up to the merchant to process all the bought items by the end-user.
 *
 * More info:
 * https://smartcontracts.org/docs/candid-guide/candid-types.html#type-func
 *
 * @typedef {Object} NotifyObject
 * @property {string} principalId the ID of the merchant's canister
 * @property {string} methodName the name of the exposed method
 */

/**
 * InitConfig
 *
 * A valid config to initialize Quark on the merchant's website.
 * @typedef {Object} InitConfig
 * @property {string} authProvider - Used to ensure the correct
 * auth mechanism when the user is redirected to the Quark website
 * to proceed the checkout.
 * @property {string} payee - A canister ID where the funds will
 * be sent to upon a successful checkout
 * @property {string} domain - The domain of the Quark website
 * @property {NotifyObject} - An exposed canister method that
 * belongs to the merchant that is called when Quark successfully
 * confirms the checkout.
 */

/**
 * init - Initialize quark.js
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
 * such as basket, payee, etc. using a window.postMessage
 * MessageEvent with the type `basketUpdate`.
 * - `checkoutComplete`: this is sent to our listener when the user
 * has confirmed the checkout on the Quark website. Upon receiving
 * a message with this type, we will call the `callback` Function
 * that the user passed inside the init() config and it's up to
 * the merchant to take it from there.
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
 *
 * @param {InitConfig} config
 * @returns {void}
 */
const init = config => {
  validateConfig(config)
  window.addEventListener(
    "message",
    function (event) {
      if (event.origin !== config.domain) return // DANGER ZONE
      if (!["checkoutLoaded", "checkoutComplete"].includes(event.data.type))
        return
      if (event.data.type === "checkoutLoaded") {
        const message = JSON.stringify(
          {
            type: "basketUpdate",
            basket,
            origin,
            notify: config.notify,
            payee: config.payee,
            authProvider: config.authProvider,
          },
          (_key, value) => (typeof value === "bigint" ? Number(value) : value),
        )
        quarkWindow.postMessage(message, config.domain)
      } else if ("checkoutComplete") {
        config.callback(event.data)
      }
    },
    false,
  )

  /**
   * getTotal - Utility Function to calculate the total sum of checkout items
   *
   * @param {Array.<BasketItem>} basket
   * @returns {number}
   */
  function getTotal(basket = []) {
    let total = 0
    basket.forEach(v => (total += Number(v.value)))
    return total
  }

  /**
   * validateConfig - Utility Function to validate the `config` param init()
   *
   * @param {InitConfig} config
   * @returns {void}
   */
  function validateConfig(config) {
    if (!config.payee) throw new Error("The field `payee` is required")
    if (!config.domain) throw new Error("The field `domain` is required")
    if (!config.notify) throw new Error("The field `notify` is required")
    if (!config.authProvider)
      throw new Error("The field `authProvider` is required")
    if (typeof config.payee !== "string")
      throw new Error("The field `payee` must be of type 'string'")
    if (typeof config.domain !== "string")
      throw new Error("The field `domain` must be of type 'string'")
    if (typeof config.authProvider !== "string")
      throw new Error("The field `authProvider` must be of type 'string'")
    if (typeof config.notify !== "object")
      throw new Error("The field `notify` must be of type 'object'")
    if (!config.notify.principalId || !config.notify.methodName)
      throw new Error(
        "The field `notify` must have two properties: `principalId` and `methodName`",
      )
    if (!config.notify.principalId)
      throw new Error(
        "The field `notify` requires a field called `principalId`",
      )
    if (typeof config.notify.principalId !== "string")
      throw new Error("The field `notify.principalId` must be of type 'string'")
    if (!config.notify.methodName)
      throw new Error("The field `notify` requires a field called `methodName`")
    if (typeof config.notify.methodName !== "string")
      throw new Error("The field `notify.methodName` must be of type 'string'")
    if (!ALLOWED_AUTH_PROVIDERS.includes(config.authProvider))
      throw new Error(
        "The field `authProvider` must be one of: " +
          ALLOWED_AUTH_PROVIDERS.join(", "),
      )
  }

  /**
   * A BasketItem is used to display the checkout confirmation to
   * the user on the Quark-side and to calculate the total sum of
   * the transaction.
   *
   * @typedef {Object} BasketItem
   * @property {string} name the metadata item name. e.g. "Spoon"
   * @property {string} [description] An optional item description
   * @property {number} value the value of the metadata item as an
   * e8s value. e.g. 10000000 for 1 ICP
   * @property {string} valueType The currency used for the checkout.
   * e.g. "ICP"
   */

  /**
   * validateBasket -Utility Function to ensure a correct
   * implementation of quark.js' metadata.
   *
   * @param {Array.<BasketItem>} metadata Array with BasketItems
   * @returns {boolean} the validation result
   */
  function validateBasket(basket = []) {
    if (!Array.isArray(basket)) {
      throw new Error("The field `basket` must be an array")
    }
    if (!basket.length) {
      throw new Error("You should provide at least one item to check-out")
    }
    const hasValidMetadata = basket.every(item => {
      if (!item.name) throw new Error("The field `name` is required")
      if (!item.value) throw new Error("The field `value` is required")
      if (!item.valueType) throw new Error("The field `valueType` is required")
      if (typeof item.name !== "string")
        throw new Error("The field `name` must be of type 'string'")
      if (typeof item.value !== "number")
        throw new Error("The field `value` must be of type 'number'")
      if (typeof item.valueType !== "string")
        throw new Error("The field `valueType` must be of type 'string'")
      if (!ALLOWED_VALUE_TYPES.includes("ICP"))
        throw new Error(
          "The field `valueType` must be one of: " +
            ALLOWED_VALUE_TYPES.join(", "),
        )
      if (item.description && typeof item.description !== "string") {
        throw new Error("The field `description` must be of type 'string'")
      }
      return true
    })
    const total = getTotal(basket)
    const hasValidAmount = total >= 0
    return hasValidMetadata && hasValidAmount
  }

  /**
   * checkout - Open Quark website to confirm checkout
   *
   * After quark.js is properly configured, the merchant
   * can call this Function to open a new browser window to
   * the Quark website to let the user confirm the transfer.
   *
   * @param {Object} data
   * @returns {void}
   */
  function checkout(data) {
    if (!validateBasket(data)) return
    metadata = data
    const queryString = JSON.stringify({
      origin: window.origin,
      authProvider: config.authProvider,
    })
    quarkWindow = window.open(
      `${config.domain}/checkout?checkoutData=${btoa(queryString)}`,
      "_blank",
    )
  }

  return {
    checkout,
  }
}

export { init }
