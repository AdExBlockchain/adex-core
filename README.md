# AdEx Core

This repository contains the Ethereum-based core of the AdEx Network. This includes facilitating registering publishers, advertisers and the exchange that allows them to bid and pay to each other.

## Instructions

```
git clone --recursive https://github.com/AdExBlockchain/adex-core
cd adex-core

# if you missed --recursive for some reason :)
# git submodule update --init --recursive

yarn install
yarn test

```

## Components in mainnet (v1)

``adex-token.eth`` - ERC20 token of AdEx

``adex-registry.eth`` - the registry contract of AdEx - handles accounts, ad units, ad slots and others

``adex-exchange.eth`` - the on-chain advertising exchange

## NEO Port

This repository, namely the ADXRegistry and ADXExchange smart contracts will be ported the [NEO Smart Economy](https://neo.org) (see [Smart Contract docs](http://docs.neo.org/en-us/sc/introduction.html)). We consider NEO to be a great alternative to Ethereum because of the smart contract system that allows more stable languages such as C# to be used for writing smart contracts, and the general engineering direction of the project.

The AdEx Core will still be available and maintained for Ethereum.

## Documentation

- [ADXRegistry](/docs/registry.md)
- [ADXExchange](/docs/exchange.md)
