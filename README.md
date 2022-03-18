# quark.js

Quark integration script

## Installation

TODO

## Usage

```js
const { checkout } = init({
  authProvider: "ii",
  domain: "https://ebgyc-nqaaa-aaaaf-qad6q-cai.ic0.app",
  notify: {
    principalId: "jsl3u-sqaaa-aaaaa-danil-cai",
    methodName: "callback",
  },
  payee: "rno2w-sqaaa-aaaaa-aaacq-cai",
  callback: event => {
    if (event.type === "checkoutComplete") {
      if (event.data.result === "Accepted") {
        checkoutComplete()
      } else {
        checkoutFailed()
      }
    }
  },
})

const basket = [
  {
    name: "Spoon",
    description: "Use this for your soup",
    value: 10000000,
    valueType: "ICP",
  },
]
checkout(basket)
```

## Publishing

```sh
npm run build
npm publish
```
