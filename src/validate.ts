import { z } from "zod"

const II = z.literal("II", {
  description: "Internet Identity",
})
const NFID = z.literal("NFID", {
  description: "Non-Fungible Identity",
})
const PLUG = z.literal("PLUG", {
  description: "Plug wallet",
})

const Provider = z.union([II, NFID, PLUG], {
  description:
    "This can be either a wallet or an identity provider. The user will only be able to connect with this provider on Quark's Checkout page",
  required_error: "Provider is required",
})
const Integrator = z
  .string({
    description:
      "The Quark Address of the integrator. This address will receive the payment upon a successful checkout",
    required_error: "Integrator is required",
  })
  .uuid({ message: "Invalid Principal ID" })
const Domain = z
  .string({
    description: "The domain of the Quark website",
    required_error: "Domain is required",
  })
  .url({ message: "Invalid url" })
  .startsWith("https://", { message: "Must provide secure URL" })
  .endsWith(".ic0.app", { message: "Only .ic0.app domains allowed" })

/**
 * Notify
 *
 * Used to produce a Candid func that is called when the checkout
 * has been confirmed on the Quark website. From there on out it is
 * up to the integrator to process all the bought items by the end-user.
 *
 * More info:
 * https://smartcontracts.org/docs/candid-guide/candid-types.html#type-func
 */

const Principal = z
  .string({
    description:
      "The Principal ID of the canister that receives the callback from Quark to notify the payment result",
    required_error: "principalId is required",
  })
  .uuid({ message: "Invalid Principal ID" })
const Method = z.string({
  description:
    "The name of the canister method that is called from Quark to notify the payment result",
  required_error: "principalId is required",
})
const Notify = z.object({
  principalId: Principal,
  method: Method,
})

const Config = z.object({
  provider: Provider,
  integrator: Integrator,
  domain: Domain,
  notify: Notify,
})
