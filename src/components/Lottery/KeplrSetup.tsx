import { observer } from 'mobx-react';
import { useContext, useEffect } from 'react';
import { useStores } from 'stores';
import { ClientDispatchContext } from '../../stores/lottery-context/ClientContext';

export const KeplrSetup = observer(() => {
  const { user,lottery } = useStores();

  useEffect(() => {

    lottery.setClient(user.secretjsSend,user.secretjs,user.address,user.balanceSCRT);

  }, [user.address, user.balanceSCRT, user.secretjs, user.secretjsSend]);
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
