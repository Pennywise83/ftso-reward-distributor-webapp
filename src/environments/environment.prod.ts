// This file contains the chain configurations. Fill with the corract contract addresses.
// This one is used for the production build
export const environment = {
  production: true,
  availableChains: [
    {
      "chainId": 14,
      "name": "Flare",
      "nativeSymbol": "FLR",
      "wrappedSymbol": "WFLR",
      "blockExplorerUrl": "https://flare-explorer.flare.network/",
      "contractAddress": "0x171eB1f854A7e542D88d6f6fb8827C83236C1937"
    },
    {
      "chainId": 19,
      "name": "Songbird",
      "nativeSymbol": "SGB",
      "wrappedSymbol": "WSGB",
      "blockExplorerUrl": "https://songbird-explorer.flare.network/",
      "contractAddress": "0xc2826E4Ed912fB1EAC94c2Ce97e4111780Cd85be"
    },
    {
      "chainId": 16,
      "name": "Coston",
      "nativeSymbol": "CFLR",
      "wrappedSymbol": "WCFLR",
      "blockExplorerUrl": "https://coston-explorer.flare.network/",
      "contractAddress": "0xc98fbA33De5DC14f691aa4Ad3dEA047c0C1a3886"
    },
    {
      "chainId": 114,
      "name": "Coston2",
      "nativeSymbol": "C2FLR",
      "wrappedSymbol": "WC2FLR",
      "blockExplorerUrl": "https://coston2-explorer.flare.network/",
      "contractAddress": "0x171eB1f854A7e542D88d6f6fb8827C83236C1937"
    }
  ]
};
