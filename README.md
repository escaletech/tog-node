# Tog Node.js Client

Node JS client library that implements the [Tog specification](https://github.com/escaletech/tog) for feature flags over Redis.

## Usage

```sh
$ npm install tog-node
```

For details, see the full [API reference](https://escaletech.github.io/tog-node/modules/_index_.html).

### For using sessions

[`SessionClient` reference](https://escaletech.github.io/tog-node/classes/_index_.sessionclient.html)

```js
const { SessionClient } = require('tog-node')

const sessions = new SessionClient('redis://127.0.0.1:6379')

// wherever you whish to retrieve a session
const session = await sessions.session('my_app', 'session-123-xyz', ["session traits 1","session traits 2"])

const buttonColor = session.flags['blue-button'] ? 'blue' : 'red'
```

### For managing flags

[`FlagClient` reference](https://escaletech.github.io/tog-node/classes/_index_.flagclient.html)

```js
const { FlagClient } = require('tog-node')

const flags = new FlagClient('redis://127.0.0.1:6379')

const allFlags = await flags.listFlags('my_app')

const oneFlag = await flags.getFlag('my_app', 'blue-button')

await flags.saveFlag({
  namespace: 'my_app',
  name: 'blue-button',
  description: 'Makes the call-to-action button blue',
  rollout: [
    { value: false}
    { percentage: 30, value: true } // will be `true` for 30% of users
    { traits:["beta","power_user"], percentage: 60, value true} // for sessions that match both traits "beta" and "power_user", 60% of the chances will be true
  ]
})

const deleted = await flags.deleteFlag('my_app', 'blue-button')
```
