import React, { useState, createContext, useContext, useEffect } from "react";
import getConfigs, { IConfigs } from "../../pages/SecretLottery/api/getConfigs";
import { ClientContext } from "./ClientContext";

export const ConfigsContext = createContext<IConfigs | null>(null);
export const ConfigsDispatchContext = createContext<Function>(() => null);

export default (props: any) => {
    const [ConfigsState, setConfigsState] = useState<IConfigs | null>(null) 
    const client = useContext(ClientContext);
    useEffect(() => {
      getConfigsTrigger(client)
      setInterval(() => {
          getConfigsTrigger(client)
      }, 30000); // check 30 seconds
  }, [client])

  async function getConfigsTrigger(client:any){
    const re = await getConfigs(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS)
      setConfigsState(re)
  }

    return (
        <ConfigsContext.Provider value={ConfigsState}>
             <ConfigsDispatchContext.Provider value={setConfigsState}>
                {props.children}
             </ConfigsDispatchContext.Provider>
        </ConfigsContext.Provider>
    );
  }
