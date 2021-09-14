import { Redeem } from '../../../blockchain-bridge/scrt';
import React, { useEffect, useState } from 'react';
import { SigningCosmWasmClient } from 'secretjs';
import cn from 'classnames';
import * as styles from './styles.styl';
import { Button, Icon, Popup } from 'semantic-ui-react';
import { useStores } from 'stores';
import { AsyncSender } from '../../../blockchain-bridge/scrt/asyncSender';
import { unlockToken } from 'utils';
import { unlockJsx } from 'pages/Swap/utils';

const ClaimButton = (props: {
  secretjs: AsyncSender;
  balance: string;
  unlockPopupText: string;
  rewardsContract: string;
  contract: string;
  available: string;
  symbol: string;
  notify: Function;
  rewardsToken?: string;
}) => {
  
  const { user,theme } = useStores();
  const [loading, setLoading] = useState<boolean>(false);
  const [fee, setFee] = useState({
    amount: [{ amount: '750000', denom: 'uscrt' }],
    gas: '750000'
  } as any)

  const displayAvailable = () => {
    if (props.available === unlockToken) {
      return (<div className={`${styles.create_viewingkey} ${styles[theme.currentTheme]}`}>
        {
          unlockJsx({
          onClick: async () => {
            await user.keplrWallet.suggestToken(user.chainId, props.contract);
            // TODO trigger balance refresh if this was an "advanced set" that didn't
            // result in an on-chain transaction
            await user.updateBalanceForSymbol(props.symbol);
            await user.updateScrtBalance();
          },
        })
        }
        {
          (props.balance?.includes(unlockToken))&&
          <Popup
            content={props.unlockPopupText}
            className={styles.iconinfo__popup}
            trigger={ 
              <Icon
                  className={styles.icon_info}
                  name="info"
                  circular
                  size="tiny"
                />
            }
          />
        }
      </div>)
    }else{
      return <strong>{props?.available}</strong>
    }
  }

  const activeProposals = user.numOfActiveProposals;
  const { rewardsContract } = props;
  const newPoolContract = process.env.SEFI_STAKING_CONTRACT;
  const staticGasFee = 40000;

  const setGasFee = () => {

    if (rewardsContract === newPoolContract && activeProposals > 0) {
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
    <>
    <div 
      className={`${styles.claim_label} ${styles[theme.currentTheme]}`}
    >
      {displayAvailable()}<span style={{marginLeft:'10px'}}>{props.rewardsToken}</span>
    </div>
    {
      process.env.IS_MAINTENANCE === 'true'
        ? <> </>
        :<Button
        loading={loading}
        className={`${styles.button} ${styles[theme.currentTheme]}`}
        disabled={typeof props.available === 'undefined' || props.available === '0'}
        onClick={async () => {
          setLoading(true);
          try {
            await Redeem({
              secretjs: props.secretjs,
              address: props.contract,
              amount: '0',
              fee,
            });
  
            props.notify('success', `Claimed ${props.available} ${props.rewardsToken}`);
          } catch (reason) {
            props.notify('error', `Failed to claim: ${reason}`);
            console.error(`Failed to claim: ${reason}`);
          }
          await Promise.all([
            await user.updateBalanceForSymbol(props.symbol),
            await user.updateBalanceForSymbol(props.rewardsToken || 'sSCRT'),
            await user.refreshRewardsBalances(props.symbol),
            await user.updateScrtBalance()
          ]);
          setLoading(false);
        }}
      >
        Claim
      </Button>
    }
    
    </>
  );
};

export default ClaimButton;
