import { Config, Basket } from "../../src/schemas";
declare function config(c: Config): {
    provider: "II" | "NFID" | "PLUG";
    integrator: string;
    domain: string;
    callback: (args_0: any, ...args_1: unknown[]) => any;
    notify: {
        principalId: string;
        methodName: string;
    };
};
declare function basket(b: Basket): {
    description: string;
    value: number;
    name: string;
    token: "TEST" | "ICP";
}[];
declare const validate: {
    config: typeof config;
    basket: typeof basket;
};
export { validate };
