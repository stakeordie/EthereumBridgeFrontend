import React, { useState, createContext } from "react";

export const BalancesContext = createContext<IBalances | null>(null);
export const BalancesDispatchContext = createContext<Function>(() => null);

export default (props: any) => {
    const [BalancesState, setBalancesState] = useState<IBalances | null>(null) 

    return (
        <BalancesContext.Provider value={BalancesState}>
             <BalancesDispatchContext.Provider value={setBalancesState}>
                {props.children}
             </BalancesDispatchContext.Provider>
        </BalancesContext.Provider>
    );
  }

  export interface IBalances {
    native: number,
    SEFI: number | null
  }