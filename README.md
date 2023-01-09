# Ftso Reward Distributor Webapp

This project was created to offer an user interface for the [ftso-reward-distributor](https://github.com/alexdupre/ftso-reward-distributor) Smart Contract developed by [alexdupre](https://github.com/alexdupre).

The Smart Contract is currently deployed to Coston, Coston2, Songbird and Flare network.

`RewardDistributorFactory`
| Chain    | Address                                      |
|----------| -------------------------------------------- |
| Coston   | [0xc98fbA33De5DC14f691aa4Ad3dEA047c0C1a3886](https://coston-explorer.flare.network/address/0xc98fbA33De5DC14f691aa4Ad3dEA047c0C1a3886) |
| Coston2  | [0x171eB1f854A7e542D88d6f6fb8827C83236C1937](https://coston2-explorer.flare.network/address/0x171eB1f854A7e542D88d6f6fb8827C83236C1937) |
| Songbird | [0xc2826E4Ed912fB1EAC94c2Ce97e4111780Cd85be](https://songbird-explorer.flare.network/address/0xc2826E4Ed912fB1EAC94c2Ce97e4111780Cd85be) |
| Flare    | [0x171eB1f854A7e542D88d6f6fb8827C83236C1937](https://flare-explorer.flare.network/address/0x171eB1f854A7e542D88d6f6fb8827C83236C1937) |

## Typechain

The project depends on typechain to give typed interfaces to the smart contracts. 
The json ABI are located in `src/contracts-abi` directory. To build the TS interfaces run `npm run generate-types`.


## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.



