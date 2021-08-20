import { observer } from 'mobx-react';
import { useContext, useEffect } from 'react';
import { useStores } from 'stores';
import { ClientDispatchContext } from '../../stores/lottery-context/ClientContext';

export const KeplrSetup = observer(() => {
  const clientDispatchState = useContext(ClientDispatchContext);
  const { user } = useStores();

  useEffect(() => {
    clientDispatchState({
      execute: user.secretjsSend,
      query: user.secretjs,
      accountData: {
        address: user.address,
        balance: user.balanceSCRT,
      },
    });
  }, [clientDispatchState, user.address, user.balanceSCRT, user.secretjs, user.secretjsSend]);
  return null;
});

export default KeplrSetup;
declare global {
  interface Window {
    keplr: any;
    getOfflineSigner: any;
    getEnigmaUtils: any;
  }
}
