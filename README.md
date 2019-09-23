# Tog Node.js Client

Node JS client library that implements the [Tog specification](https://github.com/escaletech/tog) for feature flags over Redis.

## Usage

```sh
$ npm install tog
```

```js
const TogClient = require('tog')

const tog = new TogClient('redis://127.0.0.1:6379')
```

## API reference

See the [API reference](https://escaletech.github.io/tog-node/TogClient.html).
