import React, { useState, createContext } from "react";
import { SigningCosmWasmClient } from "secretjs";

export const ClientContext = createContext<IClientState | null>(null);
export const ClientDispatchContext = createContext<Function>(() => null);

export default (props: any) => {
    const [ClientState, setClientState] = useState<IClientState | null>(null) 

    return (
        <ClientContext.Provider value={ClientState}>
             <ClientDispatchContext.Provider value={setClientState}>
                {props.children}
             </ClientDispatchContext.Provider>
        </ClientContext.Provider>
    );
  }


  export interface IClientState {
    execute: SigningCosmWasmClient,
    accountData: {
      address: string,
      balance: string
    }
  }