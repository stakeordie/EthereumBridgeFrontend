import { Dispatch, useContext, useEffect } from "react";
import { BroadcastMode, SigningCosmWasmClient } from "secretjs";
import { useStores } from "stores";
import { ClientDispatchContext } from "../../stores/lottery-context/ClientContext"

export default () => {
    const clientDispatchState = useContext(ClientDispatchContext);
    const {user}=useStores();
    useEffect(() => {
        setupKeplr(clientDispatchState);
    }, [])

    return null
}

export 

 
const setupKeplr = async (setClient: any) => {
  //TODO : Pass app properties to this context
}
  
  declare global {
    interface Window { keplr: any, getOfflineSigner: any, getEnigmaUtils: any }
  }