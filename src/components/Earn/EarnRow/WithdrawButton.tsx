import { emergencyRedeem } from '../../../blockchain-bridge/scrt';
import React, { useEffect, useState } from 'react';
import { valueToDecimals } from '../../../utils';
import cn from 'classnames';
import * as styles from './styles.styl';
import { Button } from 'semantic-ui-react';
import { useStores } from 'stores';

const WithdrawButton = ({ props, value, changeValue }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const amount = Number(value).toFixed(6);
  const { theme, user } = useStores();

  const [fee, setFee] = useState({
    amount: [{ amount: '750000', denom: 'uscrt' }],
    gas: '750000'
  } as any)

  const activeProposals = user.numOfActiveProposals;
  const rewardsContact = props.token.rewardsContract;
  const newPoolContract = process.env.SEFI_STAKING_CONTRACT;
  const staticGasFee = 40000;

  const setGasFee = () => {

    if (rewardsContact === newPoolContract && activeProposals > 0) {
      let fee = {
        amount: [{ amount: 750000 + (staticGasFee * activeProposals), denom: 'uscrt' }],
        gas: 750000 + (staticGasFee * activeProposals),
      };
      setFee(fee);
    }

  }

  useEffect(() => {

    setGasFee();

  }, [activeProposals]);

  return (
    <Button
      loading={loading}
      className={`${styles.button} ${styles[theme.currentTheme]}`}
      onClick={async () => {
        setLoading(true);
        await emergencyRedeem({
          secretjs: props.userStore.secretjsSend,
          address: props.token.rewardsContract,
          fee,
        })
          .then(_ => {
            props.userStore.updateScrtBalance();
            props.notify('success', `Removed ${amount} s${props.token.display_props.symbol} from the rewards contract`);
            changeValue({
              target: {
                value: '0.0',
              },
            });
          })
          .catch(reason => {
            props.notify('error', `Failed to withdraw: ${reason}`);
            console.log(`Failed to withdraw: ${reason}`);
            setLoading(false);
          });
        //TODO FIX THIS
        await Promise.all([
          props.userStore.refreshTokenBalanceByAddress(props.token.rewardsContract),
          props.userStore.refreshRewardsBalances('', props.token.rewardsContract),
        ]).catch(() => setLoading(false));
        setLoading(false);
      }}
    >
      Withdraw
    </Button>
  );
};

export default WithdrawButton;
