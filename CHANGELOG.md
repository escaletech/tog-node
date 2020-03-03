# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.3.6](https://github.com/escaletech/tog-node/compare/v0.3.5...v0.3.6) (2020-03-03)


### Bug Fixes

* consider all redis nodes when listing flags ([9f6dd84](https://github.com/escaletech/tog-node/commit/9f6dd8452156edbe243f90499c3dd261739933ca))

### [0.3.5](https://github.com/escaletech/tog-node/compare/v0.3.4...v0.3.5) (2020-03-03)


### Features

* add cluster support to session client ([5f80f60](https://github.com/escaletech/tog-node/commit/5f80f6062e7fbcb04a6fe26c9ac29467a5471fe9))

### [0.3.4](https://github.com/escaletech/tog-node/compare/v0.3.3...v0.3.4) (2020-03-03)


### Features

* add cluster support as an option ([c3900e5](https://github.com/escaletech/tog-node/commit/c3900e55cf8f92a68a49f7ac3f9b5f8f4eae4175))

### [0.3.3](https://github.com/escaletech/tog-node/compare/v0.3.2...v0.3.3) (2020-03-03)


### Features

* adopt redis client that supports cluster ([09a5270](https://github.com/escaletech/tog-node/commit/09a5270eb521447099d396fcbff5cc4267fc5a4f))

### [0.3.2](https://github.com/escaletech/tog-node/compare/v0.3.1...v0.3.2) (2020-03-02)


### Bug Fixes

* fix flag parsing, along with broken test ([8257f96](https://github.com/escaletech/tog-node/commit/8257f962dddd26a76566e5f539c6a8b526425096))

### [0.3.1](https://github.com/escaletech/tog-node/compare/v0.3.0...v0.3.1) (2020-03-02)


### Bug Fixes

* correct NPM package ([ffeb584](https://github.com/escaletech/tog-node/commit/ffeb5840b0e95f1c5e2e18077c90e5900c93fcb9))

## [0.3.0](https://github.com/escaletech/tog-node/compare/v0.2.0...v0.3.0) (2020-03-02)


### ⚠ BREAKING CHANGES

* separate clients for flags and sessions
* all keys have changed, to prevent mixing up with
older ones.

### Features

* adopt version 0.2 of specification ([384cab6](https://github.com/escaletech/tog-node/commit/384cab6f28fe80a39207fe81c0a4d1afa13b4b4a))
* allow flags to be deleted ([dbb7304](https://github.com/escaletech/tog-node/commit/dbb73048bfa073af937e22066f8b0562b162e01b))
* prefix keys with tog version ([8dd0809](https://github.com/escaletech/tog-node/commit/8dd0809093dbacca5b8672de0480f82d3808ca8a))
* separate clients for flags and sessions ([241d9b8](https://github.com/escaletech/tog-node/commit/241d9b86c618ff8b3897a6671ab891095dde5d54))


### Bug Fixes

* add specific error for when a flag cannot be found ([8f9d259](https://github.com/escaletech/tog-node/commit/8f9d2599fedcc6b35012a32f3d2b053535ac430f))
* resolve set-value vulnerability ([5f8aaff](https://github.com/escaletech/tog-node/commit/5f8aaff6f633b1aac6d72cfe404bab1a3f5036f8))
