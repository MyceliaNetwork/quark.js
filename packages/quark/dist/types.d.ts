import { z } from "zod";
/**
 * Config
 *
 * A config to initialize Quark on the integrator's website.
 */
export declare const Config: z.ZodObject<{
    provider: z.ZodUnion<[z.ZodLiteral<"II">, z.ZodLiteral<"NFID">, z.ZodLiteral<"PLUG">]>;
    integrator: z.ZodString;
    domain: z.ZodString;
    callback: z.ZodFunction<z.ZodTuple<[z.ZodAny], z.ZodUnknown>, z.ZodAny>;
    notify: z.ZodObject<{
        principalId: z.ZodString;
        methodName: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        principalId: string;
        methodName: string;
    }, {
        principalId: string;
        methodName: string;
    }>;
}, "strict", z.ZodTypeAny, {
    provider: "II" | "NFID" | "PLUG";
    integrator: string;
    domain: string;
    callback: (args_0: any, ...args_1: unknown[]) => any;
    notify: {
        principalId: string;
        methodName: string;
    };
}, {
    provider: "II" | "NFID" | "PLUG";
    integrator: string;
    domain: string;
    callback: (args_0: any, ...args_1: unknown[]) => any;
    notify: {
        principalId: string;
        methodName: string;
    };
}>;
export type Config = z.infer<typeof Config>;
export declare const Basket: z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    value: z.ZodNumber;
    token: z.ZodUnion<[z.ZodLiteral<"TEST">, z.ZodLiteral<"ICP">]>;
}, "strip", z.ZodTypeAny, {
    description: string;
    value: number;
    name: string;
    token: "TEST" | "ICP";
}, {
    description: string;
    value: number;
    name: string;
    token: "TEST" | "ICP";
}>, "many">;
export type Basket = z.infer<typeof Basket>;
/**
 * Checkout
 */
declare const Checkout: z.ZodFunction<z.ZodTuple<[z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    value: z.ZodNumber;
    token: z.ZodUnion<[z.ZodLiteral<"TEST">, z.ZodLiteral<"ICP">]>;
}, "strip", z.ZodTypeAny, {
    description: string;
    value: number;
    name: string;
    token: "TEST" | "ICP";
}, {
    description: string;
    value: number;
    name: string;
    token: "TEST" | "ICP";
}>, "many">], z.ZodUnknown>, z.ZodBoolean>;
export type Checkout = z.infer<typeof Checkout>;
export type Closure = {
    window?: Window;
    basket?: Basket;
};
/**
 * CreateCheckout
 *
 * Used to produce a Function that can be implemented by the integrator how they see fit.
 * The user will most likely call this function when the user clicks a "Pay" button.
 */
declare const CreateCheckoutConfig: z.ZodObject<{
    provider: z.ZodUnion<[z.ZodLiteral<"II">, z.ZodLiteral<"NFID">, z.ZodLiteral<"PLUG">]>;
    domain: z.ZodString;
    closure: z.ZodObject<{
        window: z.ZodAny;
        basket: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            value: z.ZodNumber;
            token: z.ZodUnion<[z.ZodLiteral<"TEST">, z.ZodLiteral<"ICP">]>;
        }, "strip", z.ZodTypeAny, {
            description: string;
            value: number;
            name: string;
            token: "TEST" | "ICP";
        }, {
            description: string;
            value: number;
            name: string;
            token: "TEST" | "ICP";
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        window?: any;
        basket?: {
            description: string;
            value: number;
            name: string;
            token: "TEST" | "ICP";
        }[] | undefined;
    }, {
        window?: any;
        basket?: {
            description: string;
            value: number;
            name: string;
            token: "TEST" | "ICP";
        }[] | undefined;
    }>;
}, "strict", z.ZodTypeAny, {
    provider: "II" | "NFID" | "PLUG";
    domain: string;
    closure: {
        window?: any;
        basket?: {
            description: string;
            value: number;
            name: string;
            token: "TEST" | "ICP";
        }[] | undefined;
    };
}, {
    provider: "II" | "NFID" | "PLUG";
    domain: string;
    closure: {
        window?: any;
        basket?: {
            description: string;
            value: number;
            name: string;
            token: "TEST" | "ICP";
        }[] | undefined;
    };
}>;
export type CreateCheckoutConfig = z.infer<typeof CreateCheckoutConfig>;
declare const CreateCheckout: z.ZodFunction<z.ZodTuple<[z.ZodObject<{
    provider: z.ZodUnion<[z.ZodLiteral<"II">, z.ZodLiteral<"NFID">, z.ZodLiteral<"PLUG">]>;
    domain: z.ZodString;
    closure: z.ZodObject<{
        window: z.ZodAny;
        basket: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            value: z.ZodNumber;
            token: z.ZodUnion<[z.ZodLiteral<"TEST">, z.ZodLiteral<"ICP">]>;
        }, "strip", z.ZodTypeAny, {
            description: string;
            value: number;
            name: string;
            token: "TEST" | "ICP";
        }, {
            description: string;
            value: number;
            name: string;
            token: "TEST" | "ICP";
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        window?: any;
        basket?: {
            description: string;
            value: number;
            name: string;
            token: "TEST" | "ICP";
        }[] | undefined;
    }, {
        window?: any;
        basket?: {
            description: string;
            value: number;
            name: string;
            token: "TEST" | "ICP";
        }[] | undefined;
    }>;
}, "strict", z.ZodTypeAny, {
    provider: "II" | "NFID" | "PLUG";
    domain: string;
    closure: {
        window?: any;
        basket?: {
            description: string;
            value: number;
            name: string;
            token: "TEST" | "ICP";
        }[] | undefined;
    };
}, {
    provider: "II" | "NFID" | "PLUG";
    domain: string;
    closure: {
        window?: any;
        basket?: {
            description: string;
            value: number;
            name: string;
            token: "TEST" | "ICP";
        }[] | undefined;
    };
}>], z.ZodUnknown>, z.ZodFunction<z.ZodTuple<[z.ZodArray<z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    value: z.ZodNumber;
    token: z.ZodUnion<[z.ZodLiteral<"TEST">, z.ZodLiteral<"ICP">]>;
}, "strip", z.ZodTypeAny, {
    description: string;
    value: number;
    name: string;
    token: "TEST" | "ICP";
}, {
    description: string;
    value: number;
    name: string;
    token: "TEST" | "ICP";
}>, "many">], z.ZodUnknown>, z.ZodBoolean>>;
export type CreateCheckout = z.infer<typeof CreateCheckout>;
export {};
