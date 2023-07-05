# v2-contracts

## Contracts
-   [IDO](https://github.com/fck-foundation/v2-contracts/blob/main/docs/IDO.md)
-   [FCK V2 migration swapper](https://github.com/fck-foundation/v2-contracts/blob/main/docs/swap_to_v2.md)

## Project structure

-   `contracts` - source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts.
-   `scripts` - scripts used by the project, mainly the deployment scripts.

## How to use

### Build

`npx blueprint build` or `yarn blueprint build`

### Test

`npx blueprint test` or `yarn blueprint test`

### Deploy or run another script

`npx blueprint run` or `yarn blueprint run`

# License
MIT
