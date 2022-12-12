(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.quark = global.quark || {}, global.quark.validate = {})));
})(this, (function (exports) { 'use strict';

    var util;
    (function (util) {
        util.assertEqual = (val) => val;
        function assertIs(_arg) { }
        util.assertIs = assertIs;
        function assertNever(_x) {
            throw new Error();
        }
        util.assertNever = assertNever;
        util.arrayToEnum = (items) => {
            const obj = {};
            for (const item of items) {
                obj[item] = item;
            }
            return obj;
        };
        util.getValidEnumValues = (obj) => {
            const validKeys = util.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
            const filtered = {};
            for (const k of validKeys) {
                filtered[k] = obj[k];
            }
            return util.objectValues(filtered);
        };
        util.objectValues = (obj) => {
            return util.objectKeys(obj).map(function (e) {
                return obj[e];
            });
        };
        util.objectKeys = typeof Object.keys === "function" // eslint-disable-line ban/ban
            ? (obj) => Object.keys(obj) // eslint-disable-line ban/ban
            : (object) => {
                const keys = [];
                for (const key in object) {
                    if (Object.prototype.hasOwnProperty.call(object, key)) {
                        keys.push(key);
                    }
                }
                return keys;
            };
        util.find = (arr, checker) => {
            for (const item of arr) {
                if (checker(item))
                    return item;
            }
            return undefined;
        };
        util.isInteger = typeof Number.isInteger === "function"
            ? (val) => Number.isInteger(val) // eslint-disable-line ban/ban
            : (val) => typeof val === "number" && isFinite(val) && Math.floor(val) === val;
        function joinValues(array, separator = " | ") {
            return array
                .map((val) => (typeof val === "string" ? `'${val}'` : val))
                .join(separator);
        }
        util.joinValues = joinValues;
        util.jsonStringifyReplacer = (_, value) => {
            if (typeof value === "bigint") {
                return value.toString();
            }
            return value;
        };
    })(util || (util = {}));
    const ZodParsedType = util.arrayToEnum([
        "string",
        "nan",
        "number",
        "integer",
        "float",
        "boolean",
        "date",
        "bigint",
        "symbol",
        "function",
        "undefined",
        "null",
        "array",
        "object",
        "unknown",
        "promise",
        "void",
        "never",
        "map",
        "set",
    ]);
    const getParsedType = (data) => {
        const t = typeof data;
        switch (t) {
            case "undefined":
                return ZodParsedType.undefined;
            case "string":
                return ZodParsedType.string;
            case "number":
                return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
            case "boolean":
                return ZodParsedType.boolean;
            case "function":
                return ZodParsedType.function;
            case "bigint":
                return ZodParsedType.bigint;
            case "symbol":
                return ZodParsedType.symbol;
            case "object":
                if (Array.isArray(data)) {
                    return ZodParsedType.array;
                }
                if (data === null) {
                    return ZodParsedType.null;
                }
                if (data.then &&
                    typeof data.then === "function" &&
                    data.catch &&
                    typeof data.catch === "function") {
                    return ZodParsedType.promise;
                }
                if (typeof Map !== "undefined" && data instanceof Map) {
                    return ZodParsedType.map;
                }
                if (typeof Set !== "undefined" && data instanceof Set) {
                    return ZodParsedType.set;
                }
                if (typeof Date !== "undefined" && data instanceof Date) {
                    return ZodParsedType.date;
                }
                return ZodParsedType.object;
            default:
                return ZodParsedType.unknown;
        }
    };

    const ZodIssueCode = util.arrayToEnum([
        "invalid_type",
        "invalid_literal",
        "custom",
        "invalid_union",
        "invalid_union_discriminator",
        "invalid_enum_value",
        "unrecognized_keys",
        "invalid_arguments",
        "invalid_return_type",
        "invalid_date",
        "invalid_string",
        "too_small",
        "too_big",
        "invalid_intersection_types",
        "not_multiple_of",
        "not_finite",
    ]);
    const quotelessJson = (obj) => {
        const json = JSON.stringify(obj, null, 2);
        return json.replace(/"([^"]+)":/g, "$1:");
    };
    class ZodError extends Error {
        constructor(issues) {
            super();
            this.issues = [];
            this.addIssue = (sub) => {
                this.issues = [...this.issues, sub];
            };
            this.addIssues = (subs = []) => {
                this.issues = [...this.issues, ...subs];
            };
            const actualProto = new.target.prototype;
            if (Object.setPrototypeOf) {
                // eslint-disable-next-line ban/ban
                Object.setPrototypeOf(this, actualProto);
            }
            else {
                this.__proto__ = actualProto;
            }
            this.name = "ZodError";
            this.issues = issues;
        }
        get errors() {
            return this.issues;
        }
        format(_mapper) {
            const mapper = _mapper ||
                function (issue) {
                    return issue.message;
                };
            const fieldErrors = { _errors: [] };
            const processError = (error) => {
                for (const issue of error.issues) {
                    if (issue.code === "invalid_union") {
                        issue.unionErrors.map(processError);
                    }
                    else if (issue.code === "invalid_return_type") {
                        processError(issue.returnTypeError);
                    }
                    else if (issue.code === "invalid_arguments") {
                        processError(issue.argumentsError);
                    }
                    else if (issue.path.length === 0) {
                        fieldErrors._errors.push(mapper(issue));
                    }
                    else {
                        let curr = fieldErrors;
                        let i = 0;
                        while (i < issue.path.length) {
                            const el = issue.path[i];
                            const terminal = i === issue.path.length - 1;
                            if (!terminal) {
                                curr[el] = curr[el] || { _errors: [] };
                                // if (typeof el === "string") {
                                //   curr[el] = curr[el] || { _errors: [] };
                                // } else if (typeof el === "number") {
                                //   const errorArray: any = [];
                                //   errorArray._errors = [];
                                //   curr[el] = curr[el] || errorArray;
                                // }
                            }
                            else {
                                curr[el] = curr[el] || { _errors: [] };
                                curr[el]._errors.push(mapper(issue));
                            }
                            curr = curr[el];
                            i++;
                        }
                    }
                }
            };
            processError(this);
            return fieldErrors;
        }
        toString() {
            return this.message;
        }
        get message() {
            return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
        }
        get isEmpty() {
            return this.issues.length === 0;
        }
        flatten(mapper = (issue) => issue.message) {
            const fieldErrors = {};
            const formErrors = [];
            for (const sub of this.issues) {
                if (sub.path.length > 0) {
                    fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
                    fieldErrors[sub.path[0]].push(mapper(sub));
                }
                else {
                    formErrors.push(mapper(sub));
                }
            }
            return { formErrors, fieldErrors };
        }
        get formErrors() {
            return this.flatten();
        }
    }
    ZodError.create = (issues) => {
        const error = new ZodError(issues);
        return error;
    };

    const errorMap = (issue, _ctx) => {
        let message;
        switch (issue.code) {
            case ZodIssueCode.invalid_type:
                if (issue.received === ZodParsedType.undefined) {
                    message = "Required";
                }
                else {
                    message = `Expected ${issue.expected}, received ${issue.received}`;
                }
                break;
            case ZodIssueCode.invalid_literal:
                message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
                break;
            case ZodIssueCode.unrecognized_keys:
                message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
                break;
            case ZodIssueCode.invalid_union:
                message = `Invalid input`;
                break;
            case ZodIssueCode.invalid_union_discriminator:
                message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
                break;
            case ZodIssueCode.invalid_enum_value:
                message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
                break;
            case ZodIssueCode.invalid_arguments:
                message = `Invalid function arguments`;
                break;
            case ZodIssueCode.invalid_return_type:
                message = `Invalid function return type`;
                break;
            case ZodIssueCode.invalid_date:
                message = `Invalid date`;
                break;
            case ZodIssueCode.invalid_string:
                if (typeof issue.validation === "object") {
                    if ("startsWith" in issue.validation) {
                        message = `Invalid input: must start with "${issue.validation.startsWith}"`;
                    }
                    else if ("endsWith" in issue.validation) {
                        message = `Invalid input: must end with "${issue.validation.endsWith}"`;
                    }
                    else {
                        util.assertNever(issue.validation);
                    }
                }
                else if (issue.validation !== "regex") {
                    message = `Invalid ${issue.validation}`;
                }
                else {
                    message = "Invalid";
                }
                break;
            case ZodIssueCode.too_small:
                if (issue.type === "array")
                    message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
                else if (issue.type === "string")
                    message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
                else if (issue.type === "number")
                    message = `Number must be ${issue.exact
                    ? `exactly equal to `
                    : issue.inclusive
                        ? `greater than or equal to `
                        : `greater than `}${issue.minimum}`;
                else if (issue.type === "date")
                    message = `Date must be ${issue.exact
                    ? `exactly equal to `
                    : issue.inclusive
                        ? `greater than or equal to `
                        : `greater than `}${new Date(issue.minimum)}`;
                else
                    message = "Invalid input";
                break;
            case ZodIssueCode.too_big:
                if (issue.type === "array")
                    message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
                else if (issue.type === "string")
                    message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
                else if (issue.type === "number")
                    message = `Number must be ${issue.exact
                    ? `exactly`
                    : issue.inclusive
                        ? `less than or equal to`
                        : `less than`} ${issue.maximum}`;
                else if (issue.type === "date")
                    message = `Date must be ${issue.exact
                    ? `exactly`
                    : issue.inclusive
                        ? `smaller than or equal to`
                        : `smaller than`} ${new Date(issue.maximum)}`;
                else
                    message = "Invalid input";
                break;
            case ZodIssueCode.custom:
                message = `Invalid input`;
                break;
            case ZodIssueCode.invalid_intersection_types:
                message = `Intersection results could not be merged`;
                break;
            case ZodIssueCode.not_multiple_of:
                message = `Number must be a multiple of ${issue.multipleOf}`;
                break;
            case ZodIssueCode.not_finite:
                message = "Number must be finite";
                break;
            default:
                message = _ctx.defaultError;
                util.assertNever(issue);
        }
        return { message };
    };

    let overrideErrorMap = errorMap;
    function setErrorMap(map) {
        overrideErrorMap = map;
    }
    function getErrorMap() {
        return overrideErrorMap;
    }

    const makeIssue = (params) => {
        const { data, path, errorMaps, issueData } = params;
        const fullPath = [...path, ...(issueData.path || [])];
        const fullIssue = {
            ...issueData,
            path: fullPath,
        };
        let errorMessage = "";
        const maps = errorMaps
            .filter((m) => !!m)
            .slice()
            .reverse();
        for (const map of maps) {
            errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
        }
        return {
            ...issueData,
            path: fullPath,
            message: issueData.message || errorMessage,
        };
    };
    const EMPTY_PATH = [];
    function addIssueToContext(ctx, issueData) {
        const issue = makeIssue({
            issueData: issueData,
            data: ctx.data,
            path: ctx.path,
            errorMaps: [
                ctx.common.contextualErrorMap,
                ctx.schemaErrorMap,
                getErrorMap(),
                errorMap, // then global default map
            ].filter((x) => !!x),
        });
        ctx.common.issues.push(issue);
    }
    class ParseStatus {
        constructor() {
            this.value = "valid";
        }
        dirty() {
            if (this.value === "valid")
                this.value = "dirty";
        }
        abort() {
            if (this.value !== "aborted")
                this.value = "aborted";
        }
        static mergeArray(status, results) {
            const arrayValue = [];
            for (const s of results) {
                if (s.status === "aborted")
                    return INVALID;
                if (s.status === "dirty")
                    status.dirty();
                arrayValue.push(s.value);
            }
            return { status: status.value, value: arrayValue };
        }
        static async mergeObjectAsync(status, pairs) {
            const syncPairs = [];
            for (const pair of pairs) {
                syncPairs.push({
                    key: await pair.key,
                    value: await pair.value,
                });
            }
            return ParseStatus.mergeObjectSync(status, syncPairs);
        }
        static mergeObjectSync(status, pairs) {
            const finalObject = {};
            for (const pair of pairs) {
                const { key, value } = pair;
                if (key.status === "aborted")
                    return INVALID;
                if (value.status === "aborted")
                    return INVALID;
                if (key.status === "dirty")
                    status.dirty();
                if (value.status === "dirty")
                    status.dirty();
                if (typeof value.value !== "undefined" || pair.alwaysSet) {
                    finalObject[key.value] = value.value;
                }
            }
            return { status: status.value, value: finalObject };
        }
    }
    const INVALID = Object.freeze({
        status: "aborted",
    });
    const DIRTY = (value) => ({ status: "dirty", value });
    const OK = (value) => ({ status: "valid", value });
    const isAborted = (x) => x.status === "aborted";
    const isDirty = (x) => x.status === "dirty";
    const isValid = (x) => x.status === "valid";
    const isAsync = (x) => typeof Promise !== undefined && x instanceof Promise;

    var errorUtil;
    (function (errorUtil) {
        errorUtil.errToObj = (message) => typeof message === "string" ? { message } : message || {};
        errorUtil.toString = (message) => typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;
    })(errorUtil || (errorUtil = {}));

    class ParseInputLazyPath {
        constructor(parent, value, path, key) {
            this.parent = parent;
            this.data = value;
            this._path = path;
            this._key = key;
        }
        get path() {
            return this._path.concat(this._key);
        }
    }
    const handleResult = (ctx, result) => {
        if (isValid(result)) {
            return { success: true, data: result.value };
        }
        else {
            if (!ctx.common.issues.length) {
                throw new Error("Validation failed but no issues detected.");
            }
            const error = new ZodError(ctx.common.issues);
            return { success: false, error };
        }
    };
    function processCreateParams(params) {
        if (!params)
            return {};
        const { errorMap, invalid_type_error, required_error, description } = params;
        if (errorMap && (invalid_type_error || required_error)) {
            throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
        }
        if (errorMap)
            return { errorMap: errorMap, description };
        const customMap = (iss, ctx) => {
            if (iss.code !== "invalid_type")
                return { message: ctx.defaultError };
            if (typeof ctx.data === "undefined") {
                return { message: required_error !== null && required_error !== void 0 ? required_error : ctx.defaultError };
            }
            return { message: invalid_type_error !== null && invalid_type_error !== void 0 ? invalid_type_error : ctx.defaultError };
        };
        return { errorMap: customMap, description };
    }
    class ZodType {
        constructor(def) {
            /** Alias of safeParseAsync */
            this.spa = this.safeParseAsync;
            this._def = def;
            this.parse = this.parse.bind(this);
            this.safeParse = this.safeParse.bind(this);
            this.parseAsync = this.parseAsync.bind(this);
            this.safeParseAsync = this.safeParseAsync.bind(this);
            this.spa = this.spa.bind(this);
            this.refine = this.refine.bind(this);
            this.refinement = this.refinement.bind(this);
            this.superRefine = this.superRefine.bind(this);
            this.optional = this.optional.bind(this);
            this.nullable = this.nullable.bind(this);
            this.nullish = this.nullish.bind(this);
            this.array = this.array.bind(this);
            this.promise = this.promise.bind(this);
            this.or = this.or.bind(this);
            this.and = this.and.bind(this);
            this.transform = this.transform.bind(this);
            this.brand = this.brand.bind(this);
            this.default = this.default.bind(this);
            this.catch = this.catch.bind(this);
            this.describe = this.describe.bind(this);
            this.pipe = this.pipe.bind(this);
            this.isNullable = this.isNullable.bind(this);
            this.isOptional = this.isOptional.bind(this);
        }
        get description() {
            return this._def.description;
        }
        _getType(input) {
            return getParsedType(input.data);
        }
        _getOrReturnCtx(input, ctx) {
            return (ctx || {
                common: input.parent.common,
                data: input.data,
                parsedType: getParsedType(input.data),
                schemaErrorMap: this._def.errorMap,
                path: input.path,
                parent: input.parent,
            });
        }
        _processInputParams(input) {
            return {
                status: new ParseStatus(),
                ctx: {
                    common: input.parent.common,
                    data: input.data,
                    parsedType: getParsedType(input.data),
                    schemaErrorMap: this._def.errorMap,
                    path: input.path,
                    parent: input.parent,
                },
            };
        }
        _parseSync(input) {
            const result = this._parse(input);
            if (isAsync(result)) {
                throw new Error("Synchronous parse encountered promise.");
            }
            return result;
        }
        _parseAsync(input) {
            const result = this._parse(input);
            return Promise.resolve(result);
        }
        parse(data, params) {
            const result = this.safeParse(data, params);
            if (result.success)
                return result.data;
            throw result.error;
        }
        safeParse(data, params) {
            var _a;
            const ctx = {
                common: {
                    issues: [],
                    async: (_a = params === null || params === void 0 ? void 0 : params.async) !== null && _a !== void 0 ? _a : false,
                    contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
                },
                path: (params === null || params === void 0 ? void 0 : params.path) || [],
                schemaErrorMap: this._def.errorMap,
                parent: null,
                data,
                parsedType: getParsedType(data),
            };
            const result = this._parseSync({ data, path: ctx.path, parent: ctx });
            return handleResult(ctx, result);
        }
        async parseAsync(data, params) {
            const result = await this.safeParseAsync(data, params);
            if (result.success)
                return result.data;
            throw result.error;
        }
        async safeParseAsync(data, params) {
            const ctx = {
                common: {
                    issues: [],
                    contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
                    async: true,
                },
                path: (params === null || params === void 0 ? void 0 : params.path) || [],
                schemaErrorMap: this._def.errorMap,
                parent: null,
                data,
                parsedType: getParsedType(data),
            };
            const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
            const result = await (isAsync(maybeAsyncResult)
                ? maybeAsyncResult
                : Promise.resolve(maybeAsyncResult));
            return handleResult(ctx, result);
        }
        refine(check, message) {
            const getIssueProperties = (val) => {
                if (typeof message === "string" || typeof message === "undefined") {
                    return { message };
                }
                else if (typeof message === "function") {
                    return message(val);
                }
                else {
                    return message;
                }
            };
            return this._refinement((val, ctx) => {
                const result = check(val);
                const setError = () => ctx.addIssue({
                    code: ZodIssueCode.custom,
                    ...getIssueProperties(val),
                });
                if (typeof Promise !== "undefined" && result instanceof Promise) {
                    return result.then((data) => {
                        if (!data) {
                            setError();
                            return false;
                        }
                        else {
                            return true;
                        }
                    });
                }
                if (!result) {
                    setError();
                    return false;
                }
                else {
                    return true;
                }
            });
        }
        refinement(check, refinementData) {
            return this._refinement((val, ctx) => {
                if (!check(val)) {
                    ctx.addIssue(typeof refinementData === "function"
                        ? refinementData(val, ctx)
                        : refinementData);
                    return false;
                }
                else {
                    return true;
                }
            });
        }
        _refinement(refinement) {
            return new ZodEffects({
                schema: this,
                typeName: ZodFirstPartyTypeKind.ZodEffects,
                effect: { type: "refinement", refinement },
            });
        }
        superRefine(refinement) {
            return this._refinement(refinement);
        }
        optional() {
            return ZodOptional.create(this);
        }
        nullable() {
            return ZodNullable.create(this);
        }
        nullish() {
            return this.optional().nullable();
        }
        array() {
            return ZodArray.create(this);
        }
        promise() {
            return ZodPromise.create(this);
        }
        or(option) {
            return ZodUnion.create([this, option]);
        }
        and(incoming) {
            return ZodIntersection.create(this, incoming);
        }
        transform(transform) {
            return new ZodEffects({
                schema: this,
                typeName: ZodFirstPartyTypeKind.ZodEffects,
                effect: { type: "transform", transform },
            });
        }
        default(def) {
            const defaultValueFunc = typeof def === "function" ? def : () => def;
            return new ZodDefault({
                innerType: this,
                defaultValue: defaultValueFunc,
                typeName: ZodFirstPartyTypeKind.ZodDefault,
            });
        }
        brand() {
            return new ZodBranded({
                typeName: ZodFirstPartyTypeKind.ZodBranded,
                type: this,
                ...processCreateParams(undefined),
            });
        }
        catch(def) {
            const defaultValueFunc = typeof def === "function" ? def : () => def;
            return new ZodCatch({
                innerType: this,
                defaultValue: defaultValueFunc,
                typeName: ZodFirstPartyTypeKind.ZodCatch,
            });
        }
        describe(description) {
            const This = this.constructor;
            return new This({
                ...this._def,
                description,
            });
        }
        pipe(target) {
            return ZodPipeline.create(this, target);
        }
        isOptional() {
            return this.safeParse(undefined).success;
        }
        isNullable() {
            return this.safeParse(null).success;
        }
    }
    const cuidRegex = /^c[^\s-]{8,}$/i;
    const uuidRegex = /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;
    // from https://stackoverflow.com/a/46181/1550155
    // old version: too slow, didn't support unicode
    // const emailRegex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
    // eslint-disable-next-line
    const emailRegex = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@((?!-)([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})(?<!-)$/i;
    // interface IsDateStringOptions extends StringDateOptions {
    /**
     * Match any configuration
     */
    // any?: boolean;
    // }
    // Adapted from https://stackoverflow.com/a/3143231
    const datetimeRegex = (args) => {
        if (args.precision) {
            if (args.offset) {
                return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{${args.precision}}(([+-]\\d{2}:\\d{2})|Z)$`);
            }
            else {
                return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{${args.precision}}Z$`);
            }
        }
        else if (args.precision === 0) {
            if (args.offset) {
                return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(([+-]\\d{2}:\\d{2})|Z)$`);
            }
            else {
                return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$`);
            }
        }
        else {
            if (args.offset) {
                return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?(([+-]\\d{2}:\\d{2})|Z)$`);
            }
            else {
                return new RegExp(`^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$`);
            }
        }
    };
    class ZodString extends ZodType {
        constructor() {
            super(...arguments);
            this._regex = (regex, validation, message) => this.refinement((data) => regex.test(data), {
                validation,
                code: ZodIssueCode.invalid_string,
                ...errorUtil.errToObj(message),
            });
            /**
             * @deprecated Use z.string().min(1) instead.
             * @see {@link ZodString.min}
             */
            this.nonempty = (message) => this.min(1, errorUtil.errToObj(message));
            this.trim = () => new ZodString({
                ...this._def,
                checks: [...this._def.checks, { kind: "trim" }],
            });
        }
        _parse(input) {
            if (this._def.coerce) {
                input.data = String(input.data);
            }
            const parsedType = this._getType(input);
            if (parsedType !== ZodParsedType.string) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.string,
                    received: ctx.parsedType,
                }
                //
                );
                return INVALID;
            }
            const status = new ParseStatus();
            let ctx = undefined;
            for (const check of this._def.checks) {
                if (check.kind === "min") {
                    if (input.data.length < check.value) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_small,
                            minimum: check.value,
                            type: "string",
                            inclusive: true,
                            exact: false,
                            message: check.message,
                        });
                        status.dirty();
                    }
                }
                else if (check.kind === "max") {
                    if (input.data.length > check.value) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_big,
                            maximum: check.value,
                            type: "string",
                            inclusive: true,
                            exact: false,
                            message: check.message,
                        });
                        status.dirty();
                    }
                }
                else if (check.kind === "length") {
                    const tooBig = input.data.length > check.value;
                    const tooSmall = input.data.length < check.value;
                    if (tooBig || tooSmall) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        if (tooBig) {
                            addIssueToContext(ctx, {
                                code: ZodIssueCode.too_big,
                                maximum: check.value,
                                type: "string",
                                inclusive: true,
                                exact: true,
                                message: check.message,
                            });
                        }
                        else if (tooSmall) {
                            addIssueToContext(ctx, {
                                code: ZodIssueCode.too_small,
                                minimum: check.value,
                                type: "string",
                                inclusive: true,
                                exact: true,
                                message: check.message,
                            });
                        }
                        status.dirty();
                    }
                }
                else if (check.kind === "email") {
                    if (!emailRegex.test(input.data)) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            validation: "email",
                            code: ZodIssueCode.invalid_string,
                            message: check.message,
                        });
                        status.dirty();
                    }
                }
                else if (check.kind === "uuid") {
                    if (!uuidRegex.test(input.data)) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            validation: "uuid",
                            code: ZodIssueCode.invalid_string,
                            message: check.message,
                        });
                        status.dirty();
                    }
                }
                else if (check.kind === "cuid") {
                    if (!cuidRegex.test(input.data)) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            validation: "cuid",
                            code: ZodIssueCode.invalid_string,
                            message: check.message,
                        });
                        status.dirty();
                    }
                }
                else if (check.kind === "url") {
                    try {
                        new URL(input.data);
                    }
                    catch (_a) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            validation: "url",
                            code: ZodIssueCode.invalid_string,
                            message: check.message,
                        });
                        status.dirty();
                    }
                }
                else if (check.kind === "regex") {
                    check.regex.lastIndex = 0;
                    const testResult = check.regex.test(input.data);
                    if (!testResult) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            validation: "regex",
                            code: ZodIssueCode.invalid_string,
                            message: check.message,
                        });
                        status.dirty();
                    }
                }
                else if (check.kind === "trim") {
                    input.data = input.data.trim();
                }
                else if (check.kind === "startsWith") {
                    if (!input.data.startsWith(check.value)) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.invalid_string,
                            validation: { startsWith: check.value },
                            message: check.message,
                        });
                        status.dirty();
                    }
                }
                else if (check.kind === "endsWith") {
                    if (!input.data.endsWith(check.value)) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.invalid_string,
                            validation: { endsWith: check.value },
                            message: check.message,
                        });
                        status.dirty();
                    }
                }
                else if (check.kind === "datetime") {
                    const regex = datetimeRegex(check);
                    if (!regex.test(input.data)) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.invalid_string,
                            validation: "datetime",
                            message: check.message,
                        });
                        status.dirty();
                    }
                }
                else {
                    util.assertNever(check);
                }
            }
            return { status: status.value, value: input.data };
        }
        _addCheck(check) {
            return new ZodString({
                ...this._def,
                checks: [...this._def.checks, check],
            });
        }
        email(message) {
            return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
        }
        url(message) {
            return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
        }
        uuid(message) {
            return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
        }
        cuid(message) {
            return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
        }
        datetime(options) {
            var _a;
            if (typeof options === "string") {
                return this._addCheck({
                    kind: "datetime",
                    precision: null,
                    offset: false,
                    message: options,
                });
            }
            return this._addCheck({
                kind: "datetime",
                precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
                offset: (_a = options === null || options === void 0 ? void 0 : options.offset) !== null && _a !== void 0 ? _a : false,
                ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message),
            });
        }
        regex(regex, message) {
            return this._addCheck({
                kind: "regex",
                regex: regex,
                ...errorUtil.errToObj(message),
            });
        }
        startsWith(value, message) {
            return this._addCheck({
                kind: "startsWith",
                value: value,
                ...errorUtil.errToObj(message),
            });
        }
        endsWith(value, message) {
            return this._addCheck({
                kind: "endsWith",
                value: value,
                ...errorUtil.errToObj(message),
            });
        }
        min(minLength, message) {
            return this._addCheck({
                kind: "min",
                value: minLength,
                ...errorUtil.errToObj(message),
            });
        }
        max(maxLength, message) {
            return this._addCheck({
                kind: "max",
                value: maxLength,
                ...errorUtil.errToObj(message),
            });
        }
        length(len, message) {
            return this._addCheck({
                kind: "length",
                value: len,
                ...errorUtil.errToObj(message),
            });
        }
        get isDatetime() {
            return !!this._def.checks.find((ch) => ch.kind === "datetime");
        }
        get isEmail() {
            return !!this._def.checks.find((ch) => ch.kind === "email");
        }
        get isURL() {
            return !!this._def.checks.find((ch) => ch.kind === "url");
        }
        get isUUID() {
            return !!this._def.checks.find((ch) => ch.kind === "uuid");
        }
        get isCUID() {
            return !!this._def.checks.find((ch) => ch.kind === "cuid");
        }
        get minLength() {
            let min = null;
            for (const ch of this._def.checks) {
                if (ch.kind === "min") {
                    if (min === null || ch.value > min)
                        min = ch.value;
                }
            }
            return min;
        }
        get maxLength() {
            let max = null;
            for (const ch of this._def.checks) {
                if (ch.kind === "max") {
                    if (max === null || ch.value < max)
                        max = ch.value;
                }
            }
            return max;
        }
    }
    ZodString.create = (params) => {
        var _a;
        return new ZodString({
            checks: [],
            typeName: ZodFirstPartyTypeKind.ZodString,
            coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
            ...processCreateParams(params),
        });
    };
    // https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034
    function floatSafeRemainder(val, step) {
        const valDecCount = (val.toString().split(".")[1] || "").length;
        const stepDecCount = (step.toString().split(".")[1] || "").length;
        const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
        const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
        const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
        return (valInt % stepInt) / Math.pow(10, decCount);
    }
    class ZodNumber extends ZodType {
        constructor() {
            super(...arguments);
            this.min = this.gte;
            this.max = this.lte;
            this.step = this.multipleOf;
        }
        _parse(input) {
            if (this._def.coerce) {
                input.data = Number(input.data);
            }
            const parsedType = this._getType(input);
            if (parsedType !== ZodParsedType.number) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.number,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            let ctx = undefined;
            const status = new ParseStatus();
            for (const check of this._def.checks) {
                if (check.kind === "int") {
                    if (!util.isInteger(input.data)) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.invalid_type,
                            expected: "integer",
                            received: "float",
                            message: check.message,
                        });
                        status.dirty();
                    }
                }
                else if (check.kind === "min") {
                    const tooSmall = check.inclusive
                        ? input.data < check.value
                        : input.data <= check.value;
                    if (tooSmall) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_small,
                            minimum: check.value,
                            type: "number",
                            inclusive: check.inclusive,
                            exact: false,
                            message: check.message,
                        });
                        status.dirty();
                    }
                }
                else if (check.kind === "max") {
                    const tooBig = check.inclusive
                        ? input.data > check.value
                        : input.data >= check.value;
                    if (tooBig) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_big,
                            maximum: check.value,
                            type: "number",
                            inclusive: check.inclusive,
                            exact: false,
                            message: check.message,
                        });
                        status.dirty();
                    }
                }
                else if (check.kind === "multipleOf") {
                    if (floatSafeRemainder(input.data, check.value) !== 0) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.not_multiple_of,
                            multipleOf: check.value,
                            message: check.message,
                        });
                        status.dirty();
                    }
                }
                else if (check.kind === "finite") {
                    if (!Number.isFinite(input.data)) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.not_finite,
                            message: check.message,
                        });
                        status.dirty();
                    }
                }
                else {
                    util.assertNever(check);
                }
            }
            return { status: status.value, value: input.data };
        }
        gte(value, message) {
            return this.setLimit("min", value, true, errorUtil.toString(message));
        }
        gt(value, message) {
            return this.setLimit("min", value, false, errorUtil.toString(message));
        }
        lte(value, message) {
            return this.setLimit("max", value, true, errorUtil.toString(message));
        }
        lt(value, message) {
            return this.setLimit("max", value, false, errorUtil.toString(message));
        }
        setLimit(kind, value, inclusive, message) {
            return new ZodNumber({
                ...this._def,
                checks: [
                    ...this._def.checks,
                    {
                        kind,
                        value,
                        inclusive,
                        message: errorUtil.toString(message),
                    },
                ],
            });
        }
        _addCheck(check) {
            return new ZodNumber({
                ...this._def,
                checks: [...this._def.checks, check],
            });
        }
        int(message) {
            return this._addCheck({
                kind: "int",
                message: errorUtil.toString(message),
            });
        }
        positive(message) {
            return this._addCheck({
                kind: "min",
                value: 0,
                inclusive: false,
                message: errorUtil.toString(message),
            });
        }
        negative(message) {
            return this._addCheck({
                kind: "max",
                value: 0,
                inclusive: false,
                message: errorUtil.toString(message),
            });
        }
        nonpositive(message) {
            return this._addCheck({
                kind: "max",
                value: 0,
                inclusive: true,
                message: errorUtil.toString(message),
            });
        }
        nonnegative(message) {
            return this._addCheck({
                kind: "min",
                value: 0,
                inclusive: true,
                message: errorUtil.toString(message),
            });
        }
        multipleOf(value, message) {
            return this._addCheck({
                kind: "multipleOf",
                value: value,
                message: errorUtil.toString(message),
            });
        }
        finite(message) {
            return this._addCheck({
                kind: "finite",
                message: errorUtil.toString(message),
            });
        }
        get minValue() {
            let min = null;
            for (const ch of this._def.checks) {
                if (ch.kind === "min") {
                    if (min === null || ch.value > min)
                        min = ch.value;
                }
            }
            return min;
        }
        get maxValue() {
            let max = null;
            for (const ch of this._def.checks) {
                if (ch.kind === "max") {
                    if (max === null || ch.value < max)
                        max = ch.value;
                }
            }
            return max;
        }
        get isInt() {
            return !!this._def.checks.find((ch) => ch.kind === "int");
        }
    }
    ZodNumber.create = (params) => {
        return new ZodNumber({
            checks: [],
            typeName: ZodFirstPartyTypeKind.ZodNumber,
            coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
            ...processCreateParams(params),
        });
    };
    class ZodBigInt extends ZodType {
        _parse(input) {
            if (this._def.coerce) {
                input.data = BigInt(input.data);
            }
            const parsedType = this._getType(input);
            if (parsedType !== ZodParsedType.bigint) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.bigint,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            return OK(input.data);
        }
    }
    ZodBigInt.create = (params) => {
        var _a;
        return new ZodBigInt({
            typeName: ZodFirstPartyTypeKind.ZodBigInt,
            coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
            ...processCreateParams(params),
        });
    };
    class ZodBoolean extends ZodType {
        _parse(input) {
            if (this._def.coerce) {
                input.data = Boolean(input.data);
            }
            const parsedType = this._getType(input);
            if (parsedType !== ZodParsedType.boolean) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.boolean,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            return OK(input.data);
        }
    }
    ZodBoolean.create = (params) => {
        return new ZodBoolean({
            typeName: ZodFirstPartyTypeKind.ZodBoolean,
            coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
            ...processCreateParams(params),
        });
    };
    class ZodDate extends ZodType {
        _parse(input) {
            if (this._def.coerce) {
                input.data = new Date(input.data);
            }
            const parsedType = this._getType(input);
            if (parsedType !== ZodParsedType.date) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.date,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            if (isNaN(input.data.getTime())) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_date,
                });
                return INVALID;
            }
            const status = new ParseStatus();
            let ctx = undefined;
            for (const check of this._def.checks) {
                if (check.kind === "min") {
                    if (input.data.getTime() < check.value) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_small,
                            message: check.message,
                            inclusive: true,
                            exact: false,
                            minimum: check.value,
                            type: "date",
                        });
                        status.dirty();
                    }
                }
                else if (check.kind === "max") {
                    if (input.data.getTime() > check.value) {
                        ctx = this._getOrReturnCtx(input, ctx);
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_big,
                            message: check.message,
                            inclusive: true,
                            exact: false,
                            maximum: check.value,
                            type: "date",
                        });
                        status.dirty();
                    }
                }
                else {
                    util.assertNever(check);
                }
            }
            return {
                status: status.value,
                value: new Date(input.data.getTime()),
            };
        }
        _addCheck(check) {
            return new ZodDate({
                ...this._def,
                checks: [...this._def.checks, check],
            });
        }
        min(minDate, message) {
            return this._addCheck({
                kind: "min",
                value: minDate.getTime(),
                message: errorUtil.toString(message),
            });
        }
        max(maxDate, message) {
            return this._addCheck({
                kind: "max",
                value: maxDate.getTime(),
                message: errorUtil.toString(message),
            });
        }
        get minDate() {
            let min = null;
            for (const ch of this._def.checks) {
                if (ch.kind === "min") {
                    if (min === null || ch.value > min)
                        min = ch.value;
                }
            }
            return min != null ? new Date(min) : null;
        }
        get maxDate() {
            let max = null;
            for (const ch of this._def.checks) {
                if (ch.kind === "max") {
                    if (max === null || ch.value < max)
                        max = ch.value;
                }
            }
            return max != null ? new Date(max) : null;
        }
    }
    ZodDate.create = (params) => {
        return new ZodDate({
            checks: [],
            coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
            typeName: ZodFirstPartyTypeKind.ZodDate,
            ...processCreateParams(params),
        });
    };
    class ZodSymbol extends ZodType {
        _parse(input) {
            const parsedType = this._getType(input);
            if (parsedType !== ZodParsedType.symbol) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.symbol,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            return OK(input.data);
        }
    }
    ZodSymbol.create = (params) => {
        return new ZodSymbol({
            typeName: ZodFirstPartyTypeKind.ZodSymbol,
            ...processCreateParams(params),
        });
    };
    class ZodUndefined extends ZodType {
        _parse(input) {
            const parsedType = this._getType(input);
            if (parsedType !== ZodParsedType.undefined) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.undefined,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            return OK(input.data);
        }
    }
    ZodUndefined.create = (params) => {
        return new ZodUndefined({
            typeName: ZodFirstPartyTypeKind.ZodUndefined,
            ...processCreateParams(params),
        });
    };
    class ZodNull extends ZodType {
        _parse(input) {
            const parsedType = this._getType(input);
            if (parsedType !== ZodParsedType.null) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.null,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            return OK(input.data);
        }
    }
    ZodNull.create = (params) => {
        return new ZodNull({
            typeName: ZodFirstPartyTypeKind.ZodNull,
            ...processCreateParams(params),
        });
    };
    class ZodAny extends ZodType {
        constructor() {
            super(...arguments);
            // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.
            this._any = true;
        }
        _parse(input) {
            return OK(input.data);
        }
    }
    ZodAny.create = (params) => {
        return new ZodAny({
            typeName: ZodFirstPartyTypeKind.ZodAny,
            ...processCreateParams(params),
        });
    };
    class ZodUnknown extends ZodType {
        constructor() {
            super(...arguments);
            // required
            this._unknown = true;
        }
        _parse(input) {
            return OK(input.data);
        }
    }
    ZodUnknown.create = (params) => {
        return new ZodUnknown({
            typeName: ZodFirstPartyTypeKind.ZodUnknown,
            ...processCreateParams(params),
        });
    };
    class ZodNever extends ZodType {
        _parse(input) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.never,
                received: ctx.parsedType,
            });
            return INVALID;
        }
    }
    ZodNever.create = (params) => {
        return new ZodNever({
            typeName: ZodFirstPartyTypeKind.ZodNever,
            ...processCreateParams(params),
        });
    };
    class ZodVoid extends ZodType {
        _parse(input) {
            const parsedType = this._getType(input);
            if (parsedType !== ZodParsedType.undefined) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.void,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            return OK(input.data);
        }
    }
    ZodVoid.create = (params) => {
        return new ZodVoid({
            typeName: ZodFirstPartyTypeKind.ZodVoid,
            ...processCreateParams(params),
        });
    };
    class ZodArray extends ZodType {
        _parse(input) {
            const { ctx, status } = this._processInputParams(input);
            const def = this._def;
            if (ctx.parsedType !== ZodParsedType.array) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.array,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            if (def.exactLength !== null) {
                const tooBig = ctx.data.length > def.exactLength.value;
                const tooSmall = ctx.data.length < def.exactLength.value;
                if (tooBig || tooSmall) {
                    addIssueToContext(ctx, {
                        code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
                        minimum: (tooSmall ? def.exactLength.value : undefined),
                        maximum: (tooBig ? def.exactLength.value : undefined),
                        type: "array",
                        inclusive: true,
                        exact: true,
                        message: def.exactLength.message,
                    });
                    status.dirty();
                }
            }
            if (def.minLength !== null) {
                if (ctx.data.length < def.minLength.value) {
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: def.minLength.value,
                        type: "array",
                        inclusive: true,
                        exact: false,
                        message: def.minLength.message,
                    });
                    status.dirty();
                }
            }
            if (def.maxLength !== null) {
                if (ctx.data.length > def.maxLength.value) {
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: def.maxLength.value,
                        type: "array",
                        inclusive: true,
                        exact: false,
                        message: def.maxLength.message,
                    });
                    status.dirty();
                }
            }
            if (ctx.common.async) {
                return Promise.all(ctx.data.map((item, i) => {
                    return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
                })).then((result) => {
                    return ParseStatus.mergeArray(status, result);
                });
            }
            const result = ctx.data.map((item, i) => {
                return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
            });
            return ParseStatus.mergeArray(status, result);
        }
        get element() {
            return this._def.type;
        }
        min(minLength, message) {
            return new ZodArray({
                ...this._def,
                minLength: { value: minLength, message: errorUtil.toString(message) },
            });
        }
        max(maxLength, message) {
            return new ZodArray({
                ...this._def,
                maxLength: { value: maxLength, message: errorUtil.toString(message) },
            });
        }
        length(len, message) {
            return new ZodArray({
                ...this._def,
                exactLength: { value: len, message: errorUtil.toString(message) },
            });
        }
        nonempty(message) {
            return this.min(1, message);
        }
    }
    ZodArray.create = (schema, params) => {
        return new ZodArray({
            type: schema,
            minLength: null,
            maxLength: null,
            exactLength: null,
            typeName: ZodFirstPartyTypeKind.ZodArray,
            ...processCreateParams(params),
        });
    };
    /////////////////////////////////////////
    /////////////////////////////////////////
    //////////                     //////////
    //////////      ZodObject      //////////
    //////////                     //////////
    /////////////////////////////////////////
    /////////////////////////////////////////
    var objectUtil;
    (function (objectUtil) {
        objectUtil.mergeShapes = (first, second) => {
            return {
                ...first,
                ...second, // second overwrites first
            };
        };
    })(objectUtil || (objectUtil = {}));
    const AugmentFactory = (def) => (augmentation) => {
        return new ZodObject({
            ...def,
            shape: () => ({
                ...def.shape(),
                ...augmentation,
            }),
        });
    };
    function deepPartialify(schema) {
        if (schema instanceof ZodObject) {
            const newShape = {};
            for (const key in schema.shape) {
                const fieldSchema = schema.shape[key];
                newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
            }
            return new ZodObject({
                ...schema._def,
                shape: () => newShape,
            });
        }
        else if (schema instanceof ZodArray) {
            return ZodArray.create(deepPartialify(schema.element));
        }
        else if (schema instanceof ZodOptional) {
            return ZodOptional.create(deepPartialify(schema.unwrap()));
        }
        else if (schema instanceof ZodNullable) {
            return ZodNullable.create(deepPartialify(schema.unwrap()));
        }
        else if (schema instanceof ZodTuple) {
            return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
        }
        else {
            return schema;
        }
    }
    class ZodObject extends ZodType {
        constructor() {
            super(...arguments);
            this._cached = null;
            /**
             * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
             * If you want to pass through unknown properties, use `.passthrough()` instead.
             */
            this.nonstrict = this.passthrough;
            this.augment = AugmentFactory(this._def);
            this.extend = AugmentFactory(this._def);
        }
        _getCached() {
            if (this._cached !== null)
                return this._cached;
            const shape = this._def.shape();
            const keys = util.objectKeys(shape);
            return (this._cached = { shape, keys });
        }
        _parse(input) {
            const parsedType = this._getType(input);
            if (parsedType !== ZodParsedType.object) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.object,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            const { status, ctx } = this._processInputParams(input);
            const { shape, keys: shapeKeys } = this._getCached();
            const extraKeys = [];
            if (!(this._def.catchall instanceof ZodNever &&
                this._def.unknownKeys === "strip")) {
                for (const key in ctx.data) {
                    if (!shapeKeys.includes(key)) {
                        extraKeys.push(key);
                    }
                }
            }
            const pairs = [];
            for (const key of shapeKeys) {
                const keyValidator = shape[key];
                const value = ctx.data[key];
                pairs.push({
                    key: { status: "valid", value: key },
                    value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
                    alwaysSet: key in ctx.data,
                });
            }
            if (this._def.catchall instanceof ZodNever) {
                const unknownKeys = this._def.unknownKeys;
                if (unknownKeys === "passthrough") {
                    for (const key of extraKeys) {
                        pairs.push({
                            key: { status: "valid", value: key },
                            value: { status: "valid", value: ctx.data[key] },
                        });
                    }
                }
                else if (unknownKeys === "strict") {
                    if (extraKeys.length > 0) {
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.unrecognized_keys,
                            keys: extraKeys,
                        });
                        status.dirty();
                    }
                }
                else if (unknownKeys === "strip") ;
                else {
                    throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
                }
            }
            else {
                // run catchall validation
                const catchall = this._def.catchall;
                for (const key of extraKeys) {
                    const value = ctx.data[key];
                    pairs.push({
                        key: { status: "valid", value: key },
                        value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key) //, ctx.child(key), value, getParsedType(value)
                        ),
                        alwaysSet: key in ctx.data,
                    });
                }
            }
            if (ctx.common.async) {
                return Promise.resolve()
                    .then(async () => {
                    const syncPairs = [];
                    for (const pair of pairs) {
                        const key = await pair.key;
                        syncPairs.push({
                            key,
                            value: await pair.value,
                            alwaysSet: pair.alwaysSet,
                        });
                    }
                    return syncPairs;
                })
                    .then((syncPairs) => {
                    return ParseStatus.mergeObjectSync(status, syncPairs);
                });
            }
            else {
                return ParseStatus.mergeObjectSync(status, pairs);
            }
        }
        get shape() {
            return this._def.shape();
        }
        strict(message) {
            errorUtil.errToObj;
            return new ZodObject({
                ...this._def,
                unknownKeys: "strict",
                ...(message !== undefined
                    ? {
                        errorMap: (issue, ctx) => {
                            var _a, _b, _c, _d;
                            const defaultError = (_c = (_b = (_a = this._def).errorMap) === null || _b === void 0 ? void 0 : _b.call(_a, issue, ctx).message) !== null && _c !== void 0 ? _c : ctx.defaultError;
                            if (issue.code === "unrecognized_keys")
                                return {
                                    message: (_d = errorUtil.errToObj(message).message) !== null && _d !== void 0 ? _d : defaultError,
                                };
                            return {
                                message: defaultError,
                            };
                        },
                    }
                    : {}),
            });
        }
        strip() {
            return new ZodObject({
                ...this._def,
                unknownKeys: "strip",
            });
        }
        passthrough() {
            return new ZodObject({
                ...this._def,
                unknownKeys: "passthrough",
            });
        }
        setKey(key, schema) {
            return this.augment({ [key]: schema });
        }
        /**
         * Prior to zod@1.0.12 there was a bug in the
         * inferred type of merged objects. Please
         * upgrade if you are experiencing issues.
         */
        merge(merging) {
            // const mergedShape = objectUtil.mergeShapes(
            //   this._def.shape(),
            //   merging._def.shape()
            // );
            const merged = new ZodObject({
                unknownKeys: merging._def.unknownKeys,
                catchall: merging._def.catchall,
                shape: () => objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
                typeName: ZodFirstPartyTypeKind.ZodObject,
            });
            return merged;
        }
        catchall(index) {
            return new ZodObject({
                ...this._def,
                catchall: index,
            });
        }
        pick(mask) {
            const shape = {};
            util.objectKeys(mask).map((key) => {
                // only add to shape if key corresponds to an element of the current shape
                if (this.shape[key])
                    shape[key] = this.shape[key];
            });
            return new ZodObject({
                ...this._def,
                shape: () => shape,
            });
        }
        omit(mask) {
            const shape = {};
            util.objectKeys(this.shape).map((key) => {
                if (util.objectKeys(mask).indexOf(key) === -1) {
                    shape[key] = this.shape[key];
                }
            });
            return new ZodObject({
                ...this._def,
                shape: () => shape,
            });
        }
        deepPartial() {
            return deepPartialify(this);
        }
        partial(mask) {
            const newShape = {};
            if (mask) {
                util.objectKeys(this.shape).map((key) => {
                    if (util.objectKeys(mask).indexOf(key) === -1) {
                        newShape[key] = this.shape[key];
                    }
                    else {
                        newShape[key] = this.shape[key].optional();
                    }
                });
                return new ZodObject({
                    ...this._def,
                    shape: () => newShape,
                });
            }
            else {
                for (const key in this.shape) {
                    const fieldSchema = this.shape[key];
                    newShape[key] = fieldSchema.optional();
                }
            }
            return new ZodObject({
                ...this._def,
                shape: () => newShape,
            });
        }
        required(mask) {
            const newShape = {};
            if (mask) {
                util.objectKeys(this.shape).map((key) => {
                    if (util.objectKeys(mask).indexOf(key) === -1) {
                        newShape[key] = this.shape[key];
                    }
                    else {
                        const fieldSchema = this.shape[key];
                        let newField = fieldSchema;
                        while (newField instanceof ZodOptional) {
                            newField = newField._def.innerType;
                        }
                        newShape[key] = newField;
                    }
                });
            }
            else {
                for (const key in this.shape) {
                    const fieldSchema = this.shape[key];
                    let newField = fieldSchema;
                    while (newField instanceof ZodOptional) {
                        newField = newField._def.innerType;
                    }
                    newShape[key] = newField;
                }
            }
            return new ZodObject({
                ...this._def,
                shape: () => newShape,
            });
        }
        keyof() {
            return createZodEnum(util.objectKeys(this.shape));
        }
    }
    ZodObject.create = (shape, params) => {
        return new ZodObject({
            shape: () => shape,
            unknownKeys: "strip",
            catchall: ZodNever.create(),
            typeName: ZodFirstPartyTypeKind.ZodObject,
            ...processCreateParams(params),
        });
    };
    ZodObject.strictCreate = (shape, params) => {
        return new ZodObject({
            shape: () => shape,
            unknownKeys: "strict",
            catchall: ZodNever.create(),
            typeName: ZodFirstPartyTypeKind.ZodObject,
            ...processCreateParams(params),
        });
    };
    ZodObject.lazycreate = (shape, params) => {
        return new ZodObject({
            shape,
            unknownKeys: "strip",
            catchall: ZodNever.create(),
            typeName: ZodFirstPartyTypeKind.ZodObject,
            ...processCreateParams(params),
        });
    };
    class ZodUnion extends ZodType {
        _parse(input) {
            const { ctx } = this._processInputParams(input);
            const options = this._def.options;
            function handleResults(results) {
                // return first issue-free validation if it exists
                for (const result of results) {
                    if (result.result.status === "valid") {
                        return result.result;
                    }
                }
                for (const result of results) {
                    if (result.result.status === "dirty") {
                        // add issues from dirty option
                        ctx.common.issues.push(...result.ctx.common.issues);
                        return result.result;
                    }
                }
                // return invalid
                const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_union,
                    unionErrors,
                });
                return INVALID;
            }
            if (ctx.common.async) {
                return Promise.all(options.map(async (option) => {
                    const childCtx = {
                        ...ctx,
                        common: {
                            ...ctx.common,
                            issues: [],
                        },
                        parent: null,
                    };
                    return {
                        result: await option._parseAsync({
                            data: ctx.data,
                            path: ctx.path,
                            parent: childCtx,
                        }),
                        ctx: childCtx,
                    };
                })).then(handleResults);
            }
            else {
                let dirty = undefined;
                const issues = [];
                for (const option of options) {
                    const childCtx = {
                        ...ctx,
                        common: {
                            ...ctx.common,
                            issues: [],
                        },
                        parent: null,
                    };
                    const result = option._parseSync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: childCtx,
                    });
                    if (result.status === "valid") {
                        return result;
                    }
                    else if (result.status === "dirty" && !dirty) {
                        dirty = { result, ctx: childCtx };
                    }
                    if (childCtx.common.issues.length) {
                        issues.push(childCtx.common.issues);
                    }
                }
                if (dirty) {
                    ctx.common.issues.push(...dirty.ctx.common.issues);
                    return dirty.result;
                }
                const unionErrors = issues.map((issues) => new ZodError(issues));
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_union,
                    unionErrors,
                });
                return INVALID;
            }
        }
        get options() {
            return this._def.options;
        }
    }
    ZodUnion.create = (types, params) => {
        return new ZodUnion({
            options: types,
            typeName: ZodFirstPartyTypeKind.ZodUnion,
            ...processCreateParams(params),
        });
    };
    /////////////////////////////////////////////////////
    /////////////////////////////////////////////////////
    //////////                                 //////////
    //////////      ZodDiscriminatedUnion      //////////
    //////////                                 //////////
    /////////////////////////////////////////////////////
    /////////////////////////////////////////////////////
    const getDiscriminator = (type) => {
        if (type instanceof ZodLazy) {
            return getDiscriminator(type.schema);
        }
        else if (type instanceof ZodEffects) {
            return getDiscriminator(type.innerType());
        }
        else if (type instanceof ZodLiteral) {
            return [type.value];
        }
        else if (type instanceof ZodEnum) {
            return type.options;
        }
        else if (type instanceof ZodNativeEnum) {
            // eslint-disable-next-line ban/ban
            return Object.keys(type.enum);
        }
        else if (type instanceof ZodDefault) {
            return getDiscriminator(type._def.innerType);
        }
        else if (type instanceof ZodUndefined) {
            return [undefined];
        }
        else if (type instanceof ZodNull) {
            return [null];
        }
        else {
            return null;
        }
    };
    class ZodDiscriminatedUnion extends ZodType {
        _parse(input) {
            const { ctx } = this._processInputParams(input);
            if (ctx.parsedType !== ZodParsedType.object) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.object,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            const discriminator = this.discriminator;
            const discriminatorValue = ctx.data[discriminator];
            const option = this.optionsMap.get(discriminatorValue);
            if (!option) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_union_discriminator,
                    options: Array.from(this.optionsMap.keys()),
                    path: [discriminator],
                });
                return INVALID;
            }
            if (ctx.common.async) {
                return option._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
            }
            else {
                return option._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
            }
        }
        get discriminator() {
            return this._def.discriminator;
        }
        get options() {
            return this._def.options;
        }
        get optionsMap() {
            return this._def.optionsMap;
        }
        /**
         * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
         * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
         * have a different value for each object in the union.
         * @param discriminator the name of the discriminator property
         * @param types an array of object schemas
         * @param params
         */
        static create(discriminator, options, params) {
            // Get all the valid discriminator values
            const optionsMap = new Map();
            // try {
            for (const type of options) {
                const discriminatorValues = getDiscriminator(type.shape[discriminator]);
                if (!discriminatorValues) {
                    throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
                }
                for (const value of discriminatorValues) {
                    if (optionsMap.has(value)) {
                        throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
                    }
                    optionsMap.set(value, type);
                }
            }
            return new ZodDiscriminatedUnion({
                typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
                discriminator,
                options,
                optionsMap,
                ...processCreateParams(params),
            });
        }
    }
    function mergeValues(a, b) {
        const aType = getParsedType(a);
        const bType = getParsedType(b);
        if (a === b) {
            return { valid: true, data: a };
        }
        else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
            const bKeys = util.objectKeys(b);
            const sharedKeys = util
                .objectKeys(a)
                .filter((key) => bKeys.indexOf(key) !== -1);
            const newObj = { ...a, ...b };
            for (const key of sharedKeys) {
                const sharedValue = mergeValues(a[key], b[key]);
                if (!sharedValue.valid) {
                    return { valid: false };
                }
                newObj[key] = sharedValue.data;
            }
            return { valid: true, data: newObj };
        }
        else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
            if (a.length !== b.length) {
                return { valid: false };
            }
            const newArray = [];
            for (let index = 0; index < a.length; index++) {
                const itemA = a[index];
                const itemB = b[index];
                const sharedValue = mergeValues(itemA, itemB);
                if (!sharedValue.valid) {
                    return { valid: false };
                }
                newArray.push(sharedValue.data);
            }
            return { valid: true, data: newArray };
        }
        else if (aType === ZodParsedType.date &&
            bType === ZodParsedType.date &&
            +a === +b) {
            return { valid: true, data: a };
        }
        else {
            return { valid: false };
        }
    }
    class ZodIntersection extends ZodType {
        _parse(input) {
            const { status, ctx } = this._processInputParams(input);
            const handleParsed = (parsedLeft, parsedRight) => {
                if (isAborted(parsedLeft) || isAborted(parsedRight)) {
                    return INVALID;
                }
                const merged = mergeValues(parsedLeft.value, parsedRight.value);
                if (!merged.valid) {
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_intersection_types,
                    });
                    return INVALID;
                }
                if (isDirty(parsedLeft) || isDirty(parsedRight)) {
                    status.dirty();
                }
                return { status: status.value, value: merged.data };
            };
            if (ctx.common.async) {
                return Promise.all([
                    this._def.left._parseAsync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: ctx,
                    }),
                    this._def.right._parseAsync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: ctx,
                    }),
                ]).then(([left, right]) => handleParsed(left, right));
            }
            else {
                return handleParsed(this._def.left._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                }), this._def.right._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                }));
            }
        }
    }
    ZodIntersection.create = (left, right, params) => {
        return new ZodIntersection({
            left: left,
            right: right,
            typeName: ZodFirstPartyTypeKind.ZodIntersection,
            ...processCreateParams(params),
        });
    };
    class ZodTuple extends ZodType {
        _parse(input) {
            const { status, ctx } = this._processInputParams(input);
            if (ctx.parsedType !== ZodParsedType.array) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.array,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            if (ctx.data.length < this._def.items.length) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: this._def.items.length,
                    inclusive: true,
                    exact: false,
                    type: "array",
                });
                return INVALID;
            }
            const rest = this._def.rest;
            if (!rest && ctx.data.length > this._def.items.length) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: this._def.items.length,
                    inclusive: true,
                    exact: false,
                    type: "array",
                });
                status.dirty();
            }
            const items = ctx.data
                .map((item, itemIndex) => {
                const schema = this._def.items[itemIndex] || this._def.rest;
                if (!schema)
                    return null;
                return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
            })
                .filter((x) => !!x); // filter nulls
            if (ctx.common.async) {
                return Promise.all(items).then((results) => {
                    return ParseStatus.mergeArray(status, results);
                });
            }
            else {
                return ParseStatus.mergeArray(status, items);
            }
        }
        get items() {
            return this._def.items;
        }
        rest(rest) {
            return new ZodTuple({
                ...this._def,
                rest,
            });
        }
    }
    ZodTuple.create = (schemas, params) => {
        if (!Array.isArray(schemas)) {
            throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
        }
        return new ZodTuple({
            items: schemas,
            typeName: ZodFirstPartyTypeKind.ZodTuple,
            rest: null,
            ...processCreateParams(params),
        });
    };
    class ZodRecord extends ZodType {
        get keySchema() {
            return this._def.keyType;
        }
        get valueSchema() {
            return this._def.valueType;
        }
        _parse(input) {
            const { status, ctx } = this._processInputParams(input);
            if (ctx.parsedType !== ZodParsedType.object) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.object,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            const pairs = [];
            const keyType = this._def.keyType;
            const valueType = this._def.valueType;
            for (const key in ctx.data) {
                pairs.push({
                    key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
                    value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
                });
            }
            if (ctx.common.async) {
                return ParseStatus.mergeObjectAsync(status, pairs);
            }
            else {
                return ParseStatus.mergeObjectSync(status, pairs);
            }
        }
        get element() {
            return this._def.valueType;
        }
        static create(first, second, third) {
            if (second instanceof ZodType) {
                return new ZodRecord({
                    keyType: first,
                    valueType: second,
                    typeName: ZodFirstPartyTypeKind.ZodRecord,
                    ...processCreateParams(third),
                });
            }
            return new ZodRecord({
                keyType: ZodString.create(),
                valueType: first,
                typeName: ZodFirstPartyTypeKind.ZodRecord,
                ...processCreateParams(second),
            });
        }
    }
    class ZodMap extends ZodType {
        _parse(input) {
            const { status, ctx } = this._processInputParams(input);
            if (ctx.parsedType !== ZodParsedType.map) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.map,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            const keyType = this._def.keyType;
            const valueType = this._def.valueType;
            const pairs = [...ctx.data.entries()].map(([key, value], index) => {
                return {
                    key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
                    value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"])),
                };
            });
            if (ctx.common.async) {
                const finalMap = new Map();
                return Promise.resolve().then(async () => {
                    for (const pair of pairs) {
                        const key = await pair.key;
                        const value = await pair.value;
                        if (key.status === "aborted" || value.status === "aborted") {
                            return INVALID;
                        }
                        if (key.status === "dirty" || value.status === "dirty") {
                            status.dirty();
                        }
                        finalMap.set(key.value, value.value);
                    }
                    return { status: status.value, value: finalMap };
                });
            }
            else {
                const finalMap = new Map();
                for (const pair of pairs) {
                    const key = pair.key;
                    const value = pair.value;
                    if (key.status === "aborted" || value.status === "aborted") {
                        return INVALID;
                    }
                    if (key.status === "dirty" || value.status === "dirty") {
                        status.dirty();
                    }
                    finalMap.set(key.value, value.value);
                }
                return { status: status.value, value: finalMap };
            }
        }
    }
    ZodMap.create = (keyType, valueType, params) => {
        return new ZodMap({
            valueType,
            keyType,
            typeName: ZodFirstPartyTypeKind.ZodMap,
            ...processCreateParams(params),
        });
    };
    class ZodSet extends ZodType {
        _parse(input) {
            const { status, ctx } = this._processInputParams(input);
            if (ctx.parsedType !== ZodParsedType.set) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.set,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            const def = this._def;
            if (def.minSize !== null) {
                if (ctx.data.size < def.minSize.value) {
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: def.minSize.value,
                        type: "set",
                        inclusive: true,
                        exact: false,
                        message: def.minSize.message,
                    });
                    status.dirty();
                }
            }
            if (def.maxSize !== null) {
                if (ctx.data.size > def.maxSize.value) {
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: def.maxSize.value,
                        type: "set",
                        inclusive: true,
                        exact: false,
                        message: def.maxSize.message,
                    });
                    status.dirty();
                }
            }
            const valueType = this._def.valueType;
            function finalizeSet(elements) {
                const parsedSet = new Set();
                for (const element of elements) {
                    if (element.status === "aborted")
                        return INVALID;
                    if (element.status === "dirty")
                        status.dirty();
                    parsedSet.add(element.value);
                }
                return { status: status.value, value: parsedSet };
            }
            const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
            if (ctx.common.async) {
                return Promise.all(elements).then((elements) => finalizeSet(elements));
            }
            else {
                return finalizeSet(elements);
            }
        }
        min(minSize, message) {
            return new ZodSet({
                ...this._def,
                minSize: { value: minSize, message: errorUtil.toString(message) },
            });
        }
        max(maxSize, message) {
            return new ZodSet({
                ...this._def,
                maxSize: { value: maxSize, message: errorUtil.toString(message) },
            });
        }
        size(size, message) {
            return this.min(size, message).max(size, message);
        }
        nonempty(message) {
            return this.min(1, message);
        }
    }
    ZodSet.create = (valueType, params) => {
        return new ZodSet({
            valueType,
            minSize: null,
            maxSize: null,
            typeName: ZodFirstPartyTypeKind.ZodSet,
            ...processCreateParams(params),
        });
    };
    class ZodFunction extends ZodType {
        constructor() {
            super(...arguments);
            this.validate = this.implement;
        }
        _parse(input) {
            const { ctx } = this._processInputParams(input);
            if (ctx.parsedType !== ZodParsedType.function) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.function,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            function makeArgsIssue(args, error) {
                return makeIssue({
                    data: args,
                    path: ctx.path,
                    errorMaps: [
                        ctx.common.contextualErrorMap,
                        ctx.schemaErrorMap,
                        getErrorMap(),
                        errorMap,
                    ].filter((x) => !!x),
                    issueData: {
                        code: ZodIssueCode.invalid_arguments,
                        argumentsError: error,
                    },
                });
            }
            function makeReturnsIssue(returns, error) {
                return makeIssue({
                    data: returns,
                    path: ctx.path,
                    errorMaps: [
                        ctx.common.contextualErrorMap,
                        ctx.schemaErrorMap,
                        getErrorMap(),
                        errorMap,
                    ].filter((x) => !!x),
                    issueData: {
                        code: ZodIssueCode.invalid_return_type,
                        returnTypeError: error,
                    },
                });
            }
            const params = { errorMap: ctx.common.contextualErrorMap };
            const fn = ctx.data;
            if (this._def.returns instanceof ZodPromise) {
                return OK(async (...args) => {
                    const error = new ZodError([]);
                    const parsedArgs = await this._def.args
                        .parseAsync(args, params)
                        .catch((e) => {
                        error.addIssue(makeArgsIssue(args, e));
                        throw error;
                    });
                    const result = await fn(...parsedArgs);
                    const parsedReturns = await this._def.returns._def.type
                        .parseAsync(result, params)
                        .catch((e) => {
                        error.addIssue(makeReturnsIssue(result, e));
                        throw error;
                    });
                    return parsedReturns;
                });
            }
            else {
                return OK((...args) => {
                    const parsedArgs = this._def.args.safeParse(args, params);
                    if (!parsedArgs.success) {
                        throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
                    }
                    const result = fn(...parsedArgs.data);
                    const parsedReturns = this._def.returns.safeParse(result, params);
                    if (!parsedReturns.success) {
                        throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
                    }
                    return parsedReturns.data;
                });
            }
        }
        parameters() {
            return this._def.args;
        }
        returnType() {
            return this._def.returns;
        }
        args(...items) {
            return new ZodFunction({
                ...this._def,
                args: ZodTuple.create(items).rest(ZodUnknown.create()),
            });
        }
        returns(returnType) {
            return new ZodFunction({
                ...this._def,
                returns: returnType,
            });
        }
        implement(func) {
            const validatedFunc = this.parse(func);
            return validatedFunc;
        }
        strictImplement(func) {
            const validatedFunc = this.parse(func);
            return validatedFunc;
        }
        static create(args, returns, params) {
            return new ZodFunction({
                args: (args
                    ? args
                    : ZodTuple.create([]).rest(ZodUnknown.create())),
                returns: returns || ZodUnknown.create(),
                typeName: ZodFirstPartyTypeKind.ZodFunction,
                ...processCreateParams(params),
            });
        }
    }
    class ZodLazy extends ZodType {
        get schema() {
            return this._def.getter();
        }
        _parse(input) {
            const { ctx } = this._processInputParams(input);
            const lazySchema = this._def.getter();
            return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
        }
    }
    ZodLazy.create = (getter, params) => {
        return new ZodLazy({
            getter: getter,
            typeName: ZodFirstPartyTypeKind.ZodLazy,
            ...processCreateParams(params),
        });
    };
    class ZodLiteral extends ZodType {
        _parse(input) {
            if (input.data !== this._def.value) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_literal,
                    expected: this._def.value,
                });
                return INVALID;
            }
            return { status: "valid", value: input.data };
        }
        get value() {
            return this._def.value;
        }
    }
    ZodLiteral.create = (value, params) => {
        return new ZodLiteral({
            value: value,
            typeName: ZodFirstPartyTypeKind.ZodLiteral,
            ...processCreateParams(params),
        });
    };
    function createZodEnum(values, params) {
        return new ZodEnum({
            values: values,
            typeName: ZodFirstPartyTypeKind.ZodEnum,
            ...processCreateParams(params),
        });
    }
    class ZodEnum extends ZodType {
        _parse(input) {
            if (typeof input.data !== "string") {
                const ctx = this._getOrReturnCtx(input);
                const expectedValues = this._def.values;
                addIssueToContext(ctx, {
                    expected: util.joinValues(expectedValues),
                    received: ctx.parsedType,
                    code: ZodIssueCode.invalid_type,
                });
                return INVALID;
            }
            if (this._def.values.indexOf(input.data) === -1) {
                const ctx = this._getOrReturnCtx(input);
                const expectedValues = this._def.values;
                addIssueToContext(ctx, {
                    received: ctx.data,
                    code: ZodIssueCode.invalid_enum_value,
                    options: expectedValues,
                });
                return INVALID;
            }
            return OK(input.data);
        }
        get options() {
            return this._def.values;
        }
        get enum() {
            const enumValues = {};
            for (const val of this._def.values) {
                enumValues[val] = val;
            }
            return enumValues;
        }
        get Values() {
            const enumValues = {};
            for (const val of this._def.values) {
                enumValues[val] = val;
            }
            return enumValues;
        }
        get Enum() {
            const enumValues = {};
            for (const val of this._def.values) {
                enumValues[val] = val;
            }
            return enumValues;
        }
    }
    ZodEnum.create = createZodEnum;
    class ZodNativeEnum extends ZodType {
        _parse(input) {
            const nativeEnumValues = util.getValidEnumValues(this._def.values);
            const ctx = this._getOrReturnCtx(input);
            if (ctx.parsedType !== ZodParsedType.string &&
                ctx.parsedType !== ZodParsedType.number) {
                const expectedValues = util.objectValues(nativeEnumValues);
                addIssueToContext(ctx, {
                    expected: util.joinValues(expectedValues),
                    received: ctx.parsedType,
                    code: ZodIssueCode.invalid_type,
                });
                return INVALID;
            }
            if (nativeEnumValues.indexOf(input.data) === -1) {
                const expectedValues = util.objectValues(nativeEnumValues);
                addIssueToContext(ctx, {
                    received: ctx.data,
                    code: ZodIssueCode.invalid_enum_value,
                    options: expectedValues,
                });
                return INVALID;
            }
            return OK(input.data);
        }
        get enum() {
            return this._def.values;
        }
    }
    ZodNativeEnum.create = (values, params) => {
        return new ZodNativeEnum({
            values: values,
            typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
            ...processCreateParams(params),
        });
    };
    class ZodPromise extends ZodType {
        _parse(input) {
            const { ctx } = this._processInputParams(input);
            if (ctx.parsedType !== ZodParsedType.promise &&
                ctx.common.async === false) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.promise,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            const promisified = ctx.parsedType === ZodParsedType.promise
                ? ctx.data
                : Promise.resolve(ctx.data);
            return OK(promisified.then((data) => {
                return this._def.type.parseAsync(data, {
                    path: ctx.path,
                    errorMap: ctx.common.contextualErrorMap,
                });
            }));
        }
    }
    ZodPromise.create = (schema, params) => {
        return new ZodPromise({
            type: schema,
            typeName: ZodFirstPartyTypeKind.ZodPromise,
            ...processCreateParams(params),
        });
    };
    class ZodEffects extends ZodType {
        innerType() {
            return this._def.schema;
        }
        sourceType() {
            return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects
                ? this._def.schema.sourceType()
                : this._def.schema;
        }
        _parse(input) {
            const { status, ctx } = this._processInputParams(input);
            const effect = this._def.effect || null;
            if (effect.type === "preprocess") {
                const processed = effect.transform(ctx.data);
                if (ctx.common.async) {
                    return Promise.resolve(processed).then((processed) => {
                        return this._def.schema._parseAsync({
                            data: processed,
                            path: ctx.path,
                            parent: ctx,
                        });
                    });
                }
                else {
                    return this._def.schema._parseSync({
                        data: processed,
                        path: ctx.path,
                        parent: ctx,
                    });
                }
            }
            const checkCtx = {
                addIssue: (arg) => {
                    addIssueToContext(ctx, arg);
                    if (arg.fatal) {
                        status.abort();
                    }
                    else {
                        status.dirty();
                    }
                },
                get path() {
                    return ctx.path;
                },
            };
            checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
            if (effect.type === "refinement") {
                const executeRefinement = (acc
                // effect: RefinementEffect<any>
                ) => {
                    const result = effect.refinement(acc, checkCtx);
                    if (ctx.common.async) {
                        return Promise.resolve(result);
                    }
                    if (result instanceof Promise) {
                        throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
                    }
                    return acc;
                };
                if (ctx.common.async === false) {
                    const inner = this._def.schema._parseSync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: ctx,
                    });
                    if (inner.status === "aborted")
                        return INVALID;
                    if (inner.status === "dirty")
                        status.dirty();
                    // return value is ignored
                    executeRefinement(inner.value);
                    return { status: status.value, value: inner.value };
                }
                else {
                    return this._def.schema
                        ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })
                        .then((inner) => {
                        if (inner.status === "aborted")
                            return INVALID;
                        if (inner.status === "dirty")
                            status.dirty();
                        return executeRefinement(inner.value).then(() => {
                            return { status: status.value, value: inner.value };
                        });
                    });
                }
            }
            if (effect.type === "transform") {
                if (ctx.common.async === false) {
                    const base = this._def.schema._parseSync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: ctx,
                    });
                    // if (base.status === "aborted") return INVALID;
                    // if (base.status === "dirty") {
                    //   return { status: "dirty", value: base.value };
                    // }
                    if (!isValid(base))
                        return base;
                    const result = effect.transform(base.value, checkCtx);
                    if (result instanceof Promise) {
                        throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
                    }
                    return { status: status.value, value: result };
                }
                else {
                    return this._def.schema
                        ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })
                        .then((base) => {
                        if (!isValid(base))
                            return base;
                        // if (base.status === "aborted") return INVALID;
                        // if (base.status === "dirty") {
                        //   return { status: "dirty", value: base.value };
                        // }
                        return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({ status: status.value, value: result }));
                    });
                }
            }
            util.assertNever(effect);
        }
    }
    ZodEffects.create = (schema, effect, params) => {
        return new ZodEffects({
            schema,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect,
            ...processCreateParams(params),
        });
    };
    ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
        return new ZodEffects({
            schema,
            effect: { type: "preprocess", transform: preprocess },
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            ...processCreateParams(params),
        });
    };
    class ZodOptional extends ZodType {
        _parse(input) {
            const parsedType = this._getType(input);
            if (parsedType === ZodParsedType.undefined) {
                return OK(undefined);
            }
            return this._def.innerType._parse(input);
        }
        unwrap() {
            return this._def.innerType;
        }
    }
    ZodOptional.create = (type, params) => {
        return new ZodOptional({
            innerType: type,
            typeName: ZodFirstPartyTypeKind.ZodOptional,
            ...processCreateParams(params),
        });
    };
    class ZodNullable extends ZodType {
        _parse(input) {
            const parsedType = this._getType(input);
            if (parsedType === ZodParsedType.null) {
                return OK(null);
            }
            return this._def.innerType._parse(input);
        }
        unwrap() {
            return this._def.innerType;
        }
    }
    ZodNullable.create = (type, params) => {
        return new ZodNullable({
            innerType: type,
            typeName: ZodFirstPartyTypeKind.ZodNullable,
            ...processCreateParams(params),
        });
    };
    class ZodDefault extends ZodType {
        _parse(input) {
            const { ctx } = this._processInputParams(input);
            let data = ctx.data;
            if (ctx.parsedType === ZodParsedType.undefined) {
                data = this._def.defaultValue();
            }
            return this._def.innerType._parse({
                data,
                path: ctx.path,
                parent: ctx,
            });
        }
        removeDefault() {
            return this._def.innerType;
        }
    }
    ZodDefault.create = (type, params) => {
        return new ZodDefault({
            innerType: type,
            typeName: ZodFirstPartyTypeKind.ZodDefault,
            defaultValue: typeof params.default === "function"
                ? params.default
                : () => params.default,
            ...processCreateParams(params),
        });
    };
    class ZodCatch extends ZodType {
        _parse(input) {
            const { ctx } = this._processInputParams(input);
            const result = this._def.innerType._parse({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
            if (isAsync(result)) {
                return result.then((result) => {
                    return {
                        status: "valid",
                        value: result.status === "valid" ? result.value : this._def.defaultValue(),
                    };
                });
            }
            else {
                return {
                    status: "valid",
                    value: result.status === "valid" ? result.value : this._def.defaultValue(),
                };
            }
        }
        removeDefault() {
            return this._def.innerType;
        }
    }
    ZodCatch.create = (type, params) => {
        return new ZodCatch({
            innerType: type,
            typeName: ZodFirstPartyTypeKind.ZodCatch,
            defaultValue: typeof params.default === "function"
                ? params.default
                : () => params.default,
            ...processCreateParams(params),
        });
    };
    class ZodNaN extends ZodType {
        _parse(input) {
            const parsedType = this._getType(input);
            if (parsedType !== ZodParsedType.nan) {
                const ctx = this._getOrReturnCtx(input);
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_type,
                    expected: ZodParsedType.nan,
                    received: ctx.parsedType,
                });
                return INVALID;
            }
            return { status: "valid", value: input.data };
        }
    }
    ZodNaN.create = (params) => {
        return new ZodNaN({
            typeName: ZodFirstPartyTypeKind.ZodNaN,
            ...processCreateParams(params),
        });
    };
    const BRAND = Symbol("zod_brand");
    class ZodBranded extends ZodType {
        _parse(input) {
            const { ctx } = this._processInputParams(input);
            const data = ctx.data;
            return this._def.type._parse({
                data,
                path: ctx.path,
                parent: ctx,
            });
        }
        unwrap() {
            return this._def.type;
        }
    }
    class ZodPipeline extends ZodType {
        _parse(input) {
            const { status, ctx } = this._processInputParams(input);
            if (ctx.common.async) {
                const handleAsync = async () => {
                    const inResult = await this._def.in._parseAsync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: ctx,
                    });
                    if (inResult.status === "aborted")
                        return INVALID;
                    if (inResult.status === "dirty") {
                        status.dirty();
                        return DIRTY(inResult.value);
                    }
                    else {
                        return this._def.out._parseAsync({
                            data: inResult.value,
                            path: ctx.path,
                            parent: ctx,
                        });
                    }
                };
                return handleAsync();
            }
            else {
                const inResult = this._def.in._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (inResult.status === "aborted")
                    return INVALID;
                if (inResult.status === "dirty") {
                    status.dirty();
                    return {
                        status: "dirty",
                        value: inResult.value,
                    };
                }
                else {
                    return this._def.out._parseSync({
                        data: inResult.value,
                        path: ctx.path,
                        parent: ctx,
                    });
                }
            }
        }
        static create(a, b) {
            return new ZodPipeline({
                in: a,
                out: b,
                typeName: ZodFirstPartyTypeKind.ZodPipeline,
            });
        }
    }
    const custom = (check, params = {}, fatal) => {
        if (check)
            return ZodAny.create().superRefine((data, ctx) => {
                if (!check(data)) {
                    const p = typeof params === "function" ? params(data) : params;
                    const p2 = typeof p === "string" ? { message: p } : p;
                    ctx.addIssue({ code: "custom", ...p2, fatal });
                }
            });
        return ZodAny.create();
    };
    const late = {
        object: ZodObject.lazycreate,
    };
    var ZodFirstPartyTypeKind;
    (function (ZodFirstPartyTypeKind) {
        ZodFirstPartyTypeKind["ZodString"] = "ZodString";
        ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
        ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
        ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
        ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
        ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
        ZodFirstPartyTypeKind["ZodSymbol"] = "ZodSymbol";
        ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
        ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
        ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
        ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
        ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
        ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
        ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
        ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
        ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
        ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
        ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
        ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
        ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
        ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
        ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
        ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
        ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
        ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
        ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
        ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
        ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
        ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
        ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
        ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
        ZodFirstPartyTypeKind["ZodCatch"] = "ZodCatch";
        ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
        ZodFirstPartyTypeKind["ZodBranded"] = "ZodBranded";
        ZodFirstPartyTypeKind["ZodPipeline"] = "ZodPipeline";
    })(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
    const instanceOfType = (
    // const instanceOfType = <T extends new (...args: any[]) => any>(
    cls, params = {
        message: `Input not instance of ${cls.name}`,
    }) => custom((data) => data instanceof cls, params, true);
    const stringType = ZodString.create;
    const numberType = ZodNumber.create;
    const nanType = ZodNaN.create;
    const bigIntType = ZodBigInt.create;
    const booleanType = ZodBoolean.create;
    const dateType = ZodDate.create;
    const symbolType = ZodSymbol.create;
    const undefinedType = ZodUndefined.create;
    const nullType = ZodNull.create;
    const anyType = ZodAny.create;
    const unknownType = ZodUnknown.create;
    const neverType = ZodNever.create;
    const voidType = ZodVoid.create;
    const arrayType = ZodArray.create;
    const objectType = ZodObject.create;
    const strictObjectType = ZodObject.strictCreate;
    const unionType = ZodUnion.create;
    const discriminatedUnionType = ZodDiscriminatedUnion.create;
    const intersectionType = ZodIntersection.create;
    const tupleType = ZodTuple.create;
    const recordType = ZodRecord.create;
    const mapType = ZodMap.create;
    const setType = ZodSet.create;
    const functionType = ZodFunction.create;
    const lazyType = ZodLazy.create;
    const literalType = ZodLiteral.create;
    const enumType = ZodEnum.create;
    const nativeEnumType = ZodNativeEnum.create;
    const promiseType = ZodPromise.create;
    const effectsType = ZodEffects.create;
    const optionalType = ZodOptional.create;
    const nullableType = ZodNullable.create;
    const preprocessType = ZodEffects.createWithPreprocess;
    const pipelineType = ZodPipeline.create;
    const ostring = () => stringType().optional();
    const onumber = () => numberType().optional();
    const oboolean = () => booleanType().optional();
    const coerce = {
        string: ((arg) => ZodString.create({ ...arg, coerce: true })),
        number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
        boolean: ((arg) => ZodBoolean.create({ ...arg, coerce: true })),
        bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
        date: ((arg) => ZodDate.create({ ...arg, coerce: true })),
    };
    const NEVER = INVALID;

    var mod = /*#__PURE__*/Object.freeze({
        __proto__: null,
        defaultErrorMap: errorMap,
        setErrorMap: setErrorMap,
        getErrorMap: getErrorMap,
        makeIssue: makeIssue,
        EMPTY_PATH: EMPTY_PATH,
        addIssueToContext: addIssueToContext,
        ParseStatus: ParseStatus,
        INVALID: INVALID,
        DIRTY: DIRTY,
        OK: OK,
        isAborted: isAborted,
        isDirty: isDirty,
        isValid: isValid,
        isAsync: isAsync,
        get util () { return util; },
        ZodParsedType: ZodParsedType,
        getParsedType: getParsedType,
        ZodType: ZodType,
        ZodString: ZodString,
        ZodNumber: ZodNumber,
        ZodBigInt: ZodBigInt,
        ZodBoolean: ZodBoolean,
        ZodDate: ZodDate,
        ZodSymbol: ZodSymbol,
        ZodUndefined: ZodUndefined,
        ZodNull: ZodNull,
        ZodAny: ZodAny,
        ZodUnknown: ZodUnknown,
        ZodNever: ZodNever,
        ZodVoid: ZodVoid,
        ZodArray: ZodArray,
        get objectUtil () { return objectUtil; },
        ZodObject: ZodObject,
        ZodUnion: ZodUnion,
        ZodDiscriminatedUnion: ZodDiscriminatedUnion,
        ZodIntersection: ZodIntersection,
        ZodTuple: ZodTuple,
        ZodRecord: ZodRecord,
        ZodMap: ZodMap,
        ZodSet: ZodSet,
        ZodFunction: ZodFunction,
        ZodLazy: ZodLazy,
        ZodLiteral: ZodLiteral,
        ZodEnum: ZodEnum,
        ZodNativeEnum: ZodNativeEnum,
        ZodPromise: ZodPromise,
        ZodEffects: ZodEffects,
        ZodTransformer: ZodEffects,
        ZodOptional: ZodOptional,
        ZodNullable: ZodNullable,
        ZodDefault: ZodDefault,
        ZodCatch: ZodCatch,
        ZodNaN: ZodNaN,
        BRAND: BRAND,
        ZodBranded: ZodBranded,
        ZodPipeline: ZodPipeline,
        custom: custom,
        Schema: ZodType,
        ZodSchema: ZodType,
        late: late,
        get ZodFirstPartyTypeKind () { return ZodFirstPartyTypeKind; },
        coerce: coerce,
        any: anyType,
        array: arrayType,
        bigint: bigIntType,
        boolean: booleanType,
        date: dateType,
        discriminatedUnion: discriminatedUnionType,
        effect: effectsType,
        'enum': enumType,
        'function': functionType,
        'instanceof': instanceOfType,
        intersection: intersectionType,
        lazy: lazyType,
        literal: literalType,
        map: mapType,
        nan: nanType,
        nativeEnum: nativeEnumType,
        never: neverType,
        'null': nullType,
        nullable: nullableType,
        number: numberType,
        object: objectType,
        oboolean: oboolean,
        onumber: onumber,
        optional: optionalType,
        ostring: ostring,
        pipeline: pipelineType,
        preprocess: preprocessType,
        promise: promiseType,
        record: recordType,
        set: setType,
        strictObject: strictObjectType,
        string: stringType,
        symbol: symbolType,
        transformer: effectsType,
        tuple: tupleType,
        'undefined': undefinedType,
        union: unionType,
        unknown: unknownType,
        'void': voidType,
        NEVER: NEVER,
        ZodIssueCode: ZodIssueCode,
        quotelessJson: quotelessJson,
        ZodError: ZodError
    });

    const DESCRIPTION = {
        PROVIDER: "This can be either a wallet or an identity provider. The user will only be able to connect with this provider on Quark's Checkout page",
        INTEGRATOR: "The Quark Address of the integrator. This address will receive the payment upon a successful checkout",
        NOTIFY: {
            PRINCIPAL_ID: "The Principal ID of the canister that receives the callback from Quark to notify the payment result",
            METHOD: "The name of the canister method that is called from Quark to notify the payment result",
        },
        BAKSET: {
            NAME: "The name of the basket item.",
            DESCRIPTION: "Optional description of the basket item.",
        },
    };
    const II = mod.literal("II", { description: "Internet Identity" });
    const NFID = mod.literal("NFID", { description: "Non-Fungible Identity" });
    const PLUG = mod.literal("PLUG", { description: "Plug wallet" });
    const PROVIDERS = [II, NFID, PLUG];
    const printProviders = () => PROVIDERS.map(p => p.value).join(", ");
    const Provider = mod.union([II, NFID, PLUG], {
        description: DESCRIPTION.PROVIDER,
        invalid_type_error: "Invalid provider",
        required_error: `Config.provider is required. Expected Provider as String. Choose between: ${printProviders()}`,
    });
    const Integrator = mod
        .string({
        description: DESCRIPTION.INTEGRATOR,
        invalid_type_error: "Invalid integrator. Expected Principal ID as String",
        required_error: "Config.integrator is required",
    })
        .uuid({ message: "Invalid Principal ID" });
    const Domain = mod
        .string({
        description: "The domain of the Quark website",
        required_error: "Config.domain is required",
    })
        .url({ message: "Invalid url" })
        .startsWith("https://", { message: "Must provide secure URL" })
        .endsWith(".ic0.app", { message: "Only .ic0.app domains allowed" });
    // .args() is `MessageEvent.data`
    // See: https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent/data
    const Callback = mod.function().args(mod.any()).returns(mod.any());
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
    const Principal = mod
        .string({
        description: DESCRIPTION.NOTIFY.PRINCIPAL_ID,
        required_error: "Config.notify.principalId is required",
    })
        .uuid({ message: "Invalid Principal ID" });
    const MethodName = mod.string({
        description: DESCRIPTION.NOTIFY.METHOD,
        required_error: "Config.notify.method is required",
    });
    const Notify = mod
        .object({
        principalId: Principal,
        methodName: MethodName,
    })
        .required()
        .strict();
    /**
     * Config
     *
     * A config to initialize Quark on the integrator's website.
     */
    const Config = mod
        .object({
        provider: Provider,
        integrator: Integrator,
        domain: Domain,
        callback: Callback,
        notify: Notify,
    })
        .required()
        .strict();
    /**
     * Tokens
     */
    const TEST = mod.literal("TEST", {
        description: "Quark Test Token. Used for development on testnets",
    });
    const ICP = mod.literal("ICP", {
        description: "Internet Computer Token. Used for production on mainnet",
    });
    /**
     * BasketItem
     */
    const Name = mod
        .string({
        description: DESCRIPTION.BAKSET.NAME,
        required_error: "Basket.name is required",
    })
        .min(1, { message: "Basket.name must be at least 1 character long" })
        .max(100, { message: "Basket.name must be at most 100 characters long" });
    const Description = mod
        .string({
        description: DESCRIPTION.BAKSET.DESCRIPTION,
    })
        .min(1, { message: "Basket.description must be at least 1 character long" })
        .max(100, {
        message: "Basket.description must be at most 100 characters long",
    });
    const Value = mod
        .number({
        description: "Number of tokens to pay for this Basket item.",
        invalid_type_error: "Invalid Basket.value Type. Expected Number",
        required_error: "Basket.value is required",
    })
        .min(1, { message: "Basket.value must be at least 1" });
    const Token = mod.union([TEST, ICP], {
        description: "Type of token used to pay for this Basket item.",
        invalid_type_error: "Invalid Basket.token Type. Expected String",
        required_error: "Basket.token is required",
    });
    const BasketItem = mod
        .object({
        name: Name,
        description: Description.optional(),
        value: Value,
        token: Token,
    })
        .required();
    /**
     * Basket
     *
     * The basket is an array of items that the end-user has selected to pay for.
     * The name, description and price of each item is shown on the Quark website
     * upon Checkout.
     */
    const Basket = BasketItem.array();
    /**
     * Checkout
     */
    const Checkout = mod.function().args(Basket).returns(mod.boolean());
    /**
     * Because the `basket` and `window` can only be assigned by the user's browser, we need to
     * use a closure to create a Checkout function with all necessary values to send to the Quark window.
     */
    const Closure = mod.object({
        window: mod.any(),
        basket: Basket.optional(),
    });
    /**
     * CreateCheckout
     *
     * Used to produce a Function that can be implemented by the integrator how they see fit.
     * The user will most likely call this function when the user clicks a "Pay" button.
     */
    const CreateCheckoutConfig = mod
        .object({
        provider: Provider,
        domain: Domain,
        closure: Closure,
    })
        .required()
        .strict();
    mod.function().args(CreateCheckoutConfig).returns(Checkout);

    function config(c) {
        const r = Config.parse(c);
        console.log("🚀 ~ file: validate.ts:5 ~ config ~ r", r);
        return r;
    }
    function basket(b) {
        const r = Basket.parse(b);
        console.log("🚀 ~ file: validate.ts:5 ~ config ~ r", r);
        return r;
    }
    const validate = { config, basket };

    exports.validate = validate;

}));
//# sourceMappingURL=quark.validate.umd.js.map
