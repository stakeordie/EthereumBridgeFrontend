import React, { useEffect, useState } from 'react';
import { Box } from 'grommet';
import { PageContainer } from 'components/PageContainer';
import { BaseContainer } from 'components/BaseContainer';
import { useStores } from 'stores';
import { observer } from 'mobx-react';
import './style.scss';
import WithdrawButton from './WithdrawButton';
import EarnButton from './EarnButton';
import { sleep, unlockToken } from 'utils';
import { notify, Redeem } from '../../blockchain-bridge/scrt';
import { DepositRewards } from '../../blockchain-bridge/scrt';
import ScrtTokenBalanceSingleLine from 'components/Earn/EarnRow/ScrtTokenBalanceSingleLine';
import SpinnerDashes from 'ui/Spinner/SpinnerDashes';

const MIGRATED_AMOUNT_KEY = '___sw_migrated_amount';

export const Migration = observer(() => {
  const newRewardsContract = process.env.SEFI_STAKING_CONTRACT;
  const oldRewardsContract = process.env.SEFI_STAKING_OLD_CONTRACT;

  const { theme, user, rewards } = useStores();

  const [isWithdrawDisabled, setWithdrawDisabled] = useState(false);
  const [isEarnDisabled, setEarnDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState({} as any);

  const { oldBalance, newBalance } = balances;

  const fee = {
    amount: [{ amount: '750000', denom: 'uscrt' }],
    gas: '750000',
  };

  async function updateWithdrawButtonState() {
    const balance = await getBalance(oldRewardsContract);
    if (balance) {
      const theBalance = parseInt(balance);
      if (theBalance <= 0) setWithdrawDisabled(true);
    } else {
      setWithdrawDisabled(false);
    }
  }

  function updateEarnButtonState() {
    const balance = localStorage.getItem(MIGRATED_AMOUNT_KEY);
    if (!balance) {
      setEarnDisabled(true);
    } else {
      setEarnDisabled(false);
    }
  }

  async function updateButtonsStates() {
    await updateWithdrawButtonState();
    updateEarnButtonState();
  }

  async function initRewards() {
    rewards.init({
      isLocal: true,
      sorter: 'none',
      pollingInterval: 20000,
    });

    rewards.fetch();

    while (rewards.isPending) {
      await sleep(100);
    }

    await updateButtonsStates();
  }

  async function getBalance(contract) {
    const result = await user.getSnip20Balance(contract);
    if (result === 'Unlock') {
      return null;
    }
    return result;
  }

  async function withdraw() {
    const pool = rewards.allData.find(it => it.pool_address === oldRewardsContract);

    if (pool) {
      let balance = await getBalance(oldRewardsContract);

      if (!balance) {
        await user.keplrWallet.suggestToken(process.env.CHAIN_ID, oldRewardsContract);
        balance = await getBalance(oldRewardsContract);
      }

      await Redeem({
        secretjs: user.secretjsSend,
        address: oldRewardsContract,
        amount: balance,
        fee
      }).then(() => {
        const formattedBalance = Number(balance) / Math.pow(10, pool.rewards_token.decimals);
        notify('success', `Removed ${formattedBalance} s${pool.rewards_token.symbol} from the expired pool`);
        localStorage.setItem(MIGRATED_AMOUNT_KEY, balance);
        return updateButtonsStates();
      }).catch(reason => {
        notify('error', `Failed to withdraw: ${reason}`);
      });
    }
  }

  async function deposit() {
    const balance = localStorage.getItem(MIGRATED_AMOUNT_KEY);

    if (!balance) return;

    const pool = rewards.allData.find(it => it.pool_address === newRewardsContract);

    if (pool) {
      await user.keplrWallet.suggestToken(process.env.CHAIN_ID, newRewardsContract);

      await DepositRewards({
        secretjs: user.secretjsSend,
        recipient: newRewardsContract,
        address: pool.rewards_token.address,
        amount: balance,
        fee
      })
      .then(() => {
        const formattedBalance = Number(balance) / Math.pow(10, pool.rewards_token.decimals);
        notify('success', `Staked ${formattedBalance} s${pool.rewards_token.symbol} in the new pool`);
        localStorage.removeItem(MIGRATED_AMOUNT_KEY);
        return updateButtonsStates();
      })
      .catch(reason => {
        notify('error', `Failed to deposit: ${reason}`);
      });
    }
  }

  const getAllBalances = async () => {
    setLoading(true);
    const Oldbalance = await getBalance(oldRewardsContract);
    if (!Oldbalance) return;
    const newBalance = await getBalance(newRewardsContract);
    if (!newBalance) return;
    setBalances({
      oldBalance: (parseInt(Oldbalance) / 1e6).toFixed(2),
      newBalance: (parseInt(newBalance) / 1e6).toFixed(2)
    });
    setLoading(false);
  }

  useEffect(() => {
    initRewards();
    getAllBalances();
  }, []);

  return (
    <BaseContainer>
      <PageContainer>
        <Box
          className={`migration ${theme.currentTheme}`}
          pad={{ horizontal: '136px', top: 'small' }}
        >
          <div className="steps steps--top">

            <div className="steps__instructions">

              <h1>Migrate Your Tokens</h1>

              <p>SecretSwap SEFI Staking pool has been upgraded.<br/>Please follow
              the steps below to migrate your tokens and continue to earn rewards.</p>

            </div>

            <div>&nbsp;</div>

            <div className="steps__pool">
              <div>
                <img src="/static/sefi.png" alt="sefi logo" />
                <span>SEFI Staking</span>
              </div>
            </div>

          </div>

          <div className="steps">

            <div className={`box ${theme.currentTheme}`}>
              <h2>Step 1</h2>
              <div className="data">
                <p>Staked in old pool: &nbsp;</p>
                <span> {loading ? <SpinnerDashes /> : `${oldBalance} SEFI`}</span>
              </div>
              <h4>Withdraw tokens from expired pools</h4>
              <WithdrawButton
                withdraw={withdraw}
                isDisabled={isWithdrawDisabled || loading}
              />
            </div>

            <img src="/static/arrow-right.svg" alt="arrow right icon" />

            <div className={`box ${theme.currentTheme}`}>
              <h2>Step 2</h2>
              <div className="data">
                <p>Staked in new pool: &nbsp;</p>
                <span> {loading ? <SpinnerDashes /> : `${newBalance} SEFI`}</span>
              </div>
              <h4>Earn rewards in new pools</h4>
              <EarnButton
                deposit={deposit}
                isDisabled={isEarnDisabled || loading}
              />
            </div>

          </div>

        </Box>
      </PageContainer>
    </BaseContainer >
  );
});
