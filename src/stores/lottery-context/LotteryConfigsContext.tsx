import React, { useState, createContext } from "react";
import { IConfigs } from "../../pages/SecretLottery/api/getConfigs";

export const ConfigsContext = createContext<IConfigs | null>(null);
export const ConfigsDispatchContext = createContext<Function>(() => null);

export default (props: any) => {
    const [ConfigsState, setConfigsState] = useState<IConfigs | null>(null) 

    return (
        <ConfigsContext.Provider value={ConfigsState}>
             <ConfigsDispatchContext.Provider value={setConfigsState}>
                {props.children}
             </ConfigsDispatchContext.Provider>
        </ConfigsContext.Provider>
    );
  }