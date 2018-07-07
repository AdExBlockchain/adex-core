# AdEx Core

This repository contains the Ethereum-based core of the AdEx Network, written in Solidity. This includes facilitating registering publishers, advertisers and the exchange that allows them to bid and pay to each other.

## Instructions

```
git clone --recursive https://github.com/AdExBlockchain/adex-core
cd adex-core

# if you missed --recursive for some reason :)
# git submodule update --init --recursive

yarn install
yarn test

```

## Components on mainnet

``adex-token.eth`` - ERC20 token of AdEx

``adex-exchange.eth`` - the on-chain advertising exchange

**NOTICE: adex-exchange is currently running the v1 contracts. It will soon be updated to v2**

## Ports

This repository, namely the ADXExchange smart contract might be ported to other blockchains that support smart contracts in a way similar to Ethereum. The platforms considered at the moment are Ethermint (see https://github.com/AdExNetwork/adex-core/issues/12), RSK and NEO.

The AdEx Core will still be available and maintained for Ethereum.

## Documentation

- [ADXRegistry](/docs/registry.md)
- [ADXExchange](/docs/exchange.md)
