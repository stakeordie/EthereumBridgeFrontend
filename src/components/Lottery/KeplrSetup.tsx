import { Dispatch, useContext, useEffect } from "react";
import { BroadcastMode, SigningCosmWasmClient } from "secretjs";
import { ClientDispatchContext } from "../../stores/lottery-context/ClientContext"

export default () => {
    const clientDispatchState = useContext(ClientDispatchContext);

    useEffect(() => {
        setupKeplr(clientDispatchState);
    }, [])

    return null
}

export 

 
const setupKeplr = async (setClient: any) => {
    // Define sleep 
    const sleep = (ms: number) => new Promise((accept) => setTimeout(accept, ms));
  
    // Wait for Keplr to be injected to the page
    while (
      !window.keplr &&
      !window.getOfflineSigner &&
      !window.getEnigmaUtils
    ) {
      await sleep(10);
    }
  
    // Use a custom chain with Keplr.
    // On mainnet we don't need this (`experimentalSuggestChain`).
    // This works well with `enigmampc/secret-network-sw-dev`:
    //     - https://hub.docker.com/r/enigmampc/secret-network-sw-dev
    //     - Run a local chain: `docker run -it --rm -p 26657:26657 -p 26656:26656 -p 1337:1337 -v $(shell pwd):/root/code --name secretdev enigmampc/secret-network-sw-dev`
    //     - `alias secretcli='docker exec -it secretdev secretcli'`
    //     - Store a contract: `docker exec -it secretdev secretcli tx compute store /root/code/contract.wasm.gz --from a --gas 10000000 -b block -y`
    // On holodeck, set:
    //     1. CHAIN_ID = "holodeck-2"
    //     2. rpc = "ttp://bootstrap.secrettestnet.io:26657"
    //     3. rest = "https://bootstrap.secrettestnet.io"
    //     4. chainName = Whatever you like
    // For more examples, go to: https://github.com/chainapsis/keplr-example/blob/master/src/main.js
    await window.keplr.experimentalSuggestChain({
      chainId: process.env.CHAIN_ID,
      chainName: "Local Secret Chain",
      rpc: "https://bootstrap.secrettestnet.io:26667" || "https://chainofsecrets.secrettestnet.io:26667",
      rest: "https://bootstrap.secrettestnet.io" || "https://chainofsecrets.secrettestnet.io",
      bip44: {
        coinType: 529,
      },
      coinType: 529,
      stakeCurrency: {
        coinDenom: "SCRT",
        coinMinimalDenom: "uscrt",
        coinDecimals: 6,
      },
      bech32Config: {
        bech32PrefixAccAddr: "secret",
        bech32PrefixAccPub: "secretpub",
        bech32PrefixValAddr: "secretvaloper",
        bech32PrefixValPub: "secretvaloperpub",
        bech32PrefixConsAddr: "secretvalcons",
        bech32PrefixConsPub: "secretvalconspub",
      },
      currencies: [
        {
          coinDenom: "SCRT",
          coinMinimalDenom: "uscrt",
          coinDecimals: 6,
        },
      ],
      feeCurrencies: [
        {
          coinDenom: "SCRT",
          coinMinimalDenom: "uscrt",
          coinDecimals: 6,
        },
      ],
      gasPriceStep: {
        low: 0.3,
        average: 0.45,
        high: 0.6,
      },
      features: ["secretwasm"],
    });
  
    // Enable Keplr.
    // This pops-up a window for the user to allow keplr access to the webpage.
    await window.keplr.enable(process.env.CHAIN_ID);
  
    // Setup SecrtJS with Keplr's OfflineSigner
    // This pops-up a window for the user to sign on each tx we sent
    const keplrOfflineSigner = window.getOfflineSigner(process.env.CHAIN_ID);
    const accounts = await keplrOfflineSigner.getAccounts();

    const execute = await new SigningCosmWasmClient(
      "https://bootstrap.secrettestnet.io" || "https://chainofsecrets.secrettestnet.io", // holodeck - https://bootstrap.secrettestnet.io; mainnet - user your LCD/REST provider
      accounts[0].address,
      window.getOfflineSigner(process.env.CHAIN_ID),
      window.getEnigmaUtils(process.env.CHAIN_ID),
      {
        // 300k - Max gas units we're willing to use for init
        init: {
          amount: [{ amount: "500000", denom: "uscrt" }],
          gas: "10000000",
        },
        // 300k - Max gas units we're willing to use for exec
        exec: {
          amount: [{ amount: "500000", denom: "uscrt" }],
          gas: "10000000",
        },
      },
      BroadcastMode.Sync
    )
  
    const accountData = await execute.getAccount(accounts[0].address);
  
    if (!accountData) return
  
    setClient({
      execute,
      accountData: {
        address: accountData.address,
        balance: accountData.balance[0].amount
      }
    })
  }
  
  declare global {
    interface Window { keplr: any, getOfflineSigner: any, getEnigmaUtils: any }
  }