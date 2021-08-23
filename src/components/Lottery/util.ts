import cogoToast from 'cogo-toast';

export function notify(type: 'success' | 'error' | 'errorWithHash', msg: string, hideAfterSec: number = 120, txHash?: string) {
    let cogoType: string = type;
    if (type === 'error') {
      msg = msg.replaceAll('Failed to decrypt the following error message: ', '');
      msg = msg.replace(/\. Decryption error of the error message:.+?/, '');
    }

    let onClick = () => {
      hide();
    };
    if (type === 'errorWithHash') {
      cogoType = 'warn';
      onClick = () => {
        const url = `https://secretnodes.com/secret/chains/secret-2/transactions/${txHash}`;
        const win = window.open(url, '_blank');
        win.focus();
        hide();
      };
    }

    const { hide } = cogoToast[cogoType](msg, {
      toastContainerID:'notifications_container', 
      hideAfter: hideAfterSec,
      onClick,
    });
}