import { describe, it, expect } from "vitest"
import { init } from "../index.js"

const ALLOWED_AUTH_PROVIDERS = ["ii"]
const ALLOWED_VALUE_TYPES = ["ICP"]

describe("quark.js", async () => {
  describe("init", () => {
    const validConfig = {
      authProvider: "ii",
      domain: "http://localhost:3000",
      notify: {
        principalId: "jsl3u-sqaaa-aaaaa-danil-cai",
        methodName: "callback",
      },
      integrator: "rno2w-sqaaa-aaaaa-aaacq-cai",
      callback: event => {
        if (event.type === "checkoutComplete") {
          if (event.data.result === "Accepted") {
            checkoutComplete()
          } else {
            checkoutFailed()
          }
        }
      },
    }

    // FIXME: blocked by:
    // https://github.com/jsdom/jsdom/issues/2745
    it.skip("adds an eventListener", async () => {
      init(validConfig)
      window.location = "http://localhost:3000"
      window.postMessage(
        {
          data: {
            type: "checkoutComplete",
          },
          origin: "hoax",
        },
        "http://localhost:3000",
      )

      await new Promise(resolve => setTimeout(resolve, 1))
      console.log(window.onmessage)
    })

    it("throws when required fields are not correctly configured", async () => {
      const notify = { methodName: "callback", principalId: "aaaa-aa" }
      const authProvider = "f00"
      const integrator = "b4r"
      const domain = "b4z"
      const primitives = { integrator, authProvider, domain }

      const expectedErrors = [
        {
          config: { notify, authProvider, domain },
          error: "The field `integrator` is required",
        },
        {
          config: { notify, integrator, authProvider },
          error: "The field `domain` is required",
        },
        {
          config: { notify, integrator, domain },
          error: "The field `authProvider` is required",
        },
        {
          config: { integrator, authProvider, domain },
          error: "The field `notify` is required",
        },

        {
          config: { notify, integrator: 1337, authProvider, domain },
          error: "The field `integrator` must be of type 'string'",
        },
        {
          config: { notify, integrator, authProvider: 1337, domain },
          error: "The field `authProvider` must be of type 'string'",
        },
        {
          config: { notify, integrator, authProvider, domain: 1337 },
          error: "The field `domain` must be of type 'string'",
        },

        {
          config: { notify: "f00", integrator, authProvider, domain },
          error: "The field `notify` must be of type 'object'",
        },
        {
          config: { notify: { principalId: "f00" }, ...primitives },
          error:
            "The field `notify` must have two properties: `principalId` and `methodName`",
        },
        {
          config: { notify: { methodName: "f00" }, ...primitives },
          error:
            "The field `notify` must have two properties: `principalId` and `methodName`",
        },
        {
          config: {
            notify: { principalId: 1337, methodName: "f00" },
            ...primitives,
          },
          error: "The field `notify.principalId` must be of type 'string'",
        },
        {
          config: {
            notify: { principalId: "1337", methodName: true },
            ...primitives,
          },
          error: "The field `notify.methodName` must be of type 'string'",
        },
        {
          config: { notify, integrator, domain, authProvider },
          error:
            "The field `authProvider` must be one of: " +
            ALLOWED_AUTH_PROVIDERS.join(", "),
        },
      ]

      expectedErrors.forEach(({ config, error }) =>
        expect(() => init(config)).toThrowError(error),
      )
    })

    it("throws when basket fields are not correctly configured", () => {
      const { checkout } = init(validConfig)

      const expectedErrors = [
        {
          basket: {},
          error: "The field `basket` must be an array",
        },
        {
          basket: [],
          error: "You should provide at least one item to check-out",
        },
        {
          basket: [{ value: 1337, token: "DLT" }],
          error: "The field `name` is required",
        },
        {
          basket: [{ name: "f00", value: 1337 }],
          error: "The field `token` is required",
        },
        {
          basket: [{ name: "f00", token: "DLT" }],
          error: "The field `value` is required",
        },
        // test
        {
          basket: [{ name: 1337, value: 1337, token: "DLT" }],
          error: "The field `name` must be of type 'string'",
        },
        {
          basket: [{ name: "f00", value: "bar", token: "DLT" }],
          error: "The field `value` must be of type 'number'",
        },
        {
          basket: [{ name: "f00", value: 1337, token: 1337 }],
          error: "The field `token` must be of type 'string'",
        },
        {
          basket: [{ name: "f00", value: 1337, token: "N/A" }],
          error:
            "The field `token` must be one of: " +
            ALLOWED_VALUE_TYPES.join(", "),
        },
        {
          basket: [{ name: "f00", value: 1337, token: "ICP", description: [] }],
          error: "The field `description` must be of type 'string'",
        },
      ]

      expectedErrors.forEach(({ basket, error }) =>
        expect(() => checkout(basket)).toThrowError(error),
      )
    })
  })
})
