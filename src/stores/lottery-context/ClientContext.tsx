import React, { useState, createContext } from "react";
import { CosmWasmClient, SigningCosmWasmClient } from "secretjs";

export const ClientContext = createContext<IClientState >(null);
export const ClientDispatchContext = createContext<Function>(() => null);

export default (props: any) => {
    const [ClientState, setClientState] = useState<IClientState>(null) 

    return (
        <ClientContext.Provider value={ClientState}>
             <ClientDispatchContext.Provider value={setClientState}>
                {props.children}
             </ClientDispatchContext.Provider>
        </ClientContext.Provider>
    );
  }


  export interface IClientState {
    execute: SigningCosmWasmClient | null,
    query:CosmWasmClient,
    accountData: {
      address: string,
      balance: string
    }
  }