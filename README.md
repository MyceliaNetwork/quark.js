# quark.js

Quark integration script

## Installation

```sh
npm i -S @departurelabs/quark.js
```

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
    token: "ICP",
  },
]
checkout(basket)
```

_PLEASE NOTE_: BigInts cannot be serialized client-side and thus we do not
support them in the checkout. You'll need to cast them to Numbers in stead.

## Publishing

```sh
npm run build
npm publish
```
