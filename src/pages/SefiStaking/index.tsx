import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Box } from 'grommet';
import { BaseContainer, PageContainer } from 'components';
import { observer } from 'mobx-react-lite';
import { useStores } from 'stores';
import * as styles from '../EthBridge/styles.styl';
// import { IColumn, Table } from '../../components/Table';
// import { ERC20Select } from '../Exchange/ERC20Select';
import EarnRow from '../../components/Earn/EarnRow';
import { rewardsDepositKey, rewardsKey } from '../../stores/UserStore';
import {
  displayHumanizedBalance,
  divDecimals,
  fixUnlockToken,
  formatWithTwoDecimals,
  humanizeBalance,
  sleep,
  truncateAddressString,
  unlockToken,
} from '../../utils';
import { InfoModalEarn } from '../../components/InfoModalEarn';
import EarnInfoBox from '../../components/Earn/EarnInfoBox';
import { IRewardPool, ITokenInfo } from '../../stores/interfaces';
import Loader from 'react-loader-spinner';
import { Text } from 'components/Base';
import * as thisStyles from './styles.styl';
import cn from 'classnames';
import { ethMethodsSefi, web3 } from '../../blockchain-bridge/eth';
import { CheckClaimModal } from '../../components/Earn/ClaimToken/CheckClaim';
import { claimErc, claimScrt } from '../../components/Earn/ClaimToken/utils';
import { unlockJsx, wrongViewingKey } from 'pages/Swap/utils';
import BigNumber from 'bignumber.js';
import { SwapToken, SwapTokenMap, TokenMapfromITokenInfo } from 'pages/TokenModal/types/SwapToken';
import ProposalLayout from 'components/ProposalLayout';
import { notify } from '../../blockchain-bridge/scrt/utils';
const Web3 = require("web3");

const sefiAddr = "0x773258b03c730f84af10dfcb1bfaa7487558b8ac";
const abi = {
  constant: true,
  inputs: [],
  name: "totalSupply",
  outputs: [
    {
      name: "",
      type: "uint256",
    },
  ],
  type: "function",
};

// // Get ERC20 Token contract instance
// let contract = new web3.eth.Contract(abi).at(sefiAddr);

// // Call function
// contract.totalSupply((error, totalSupply) => {
//   console.log("Total Supply: " + totalSupply.toString());
// });
function SefiBalance(props: { address: string; sefiBalance: string | JSX.Element; isEth?: boolean }) {
  const src_img = props.isEth ? '/static/eth.png' : '/static/scrt.svg';

  return (
    <div className={cn(thisStyles.balanceContainer)}>
      <img className={styles.imgToken} style={{ height: 18 }} src={src_img} alt={'scrt'} />
      <button className={cn(thisStyles.balanceButton)}>
        <Text>{truncateAddressString(props.address, 10)}</Text>
      </button>
      <div className={cn(thisStyles.balanceAmount)}>
        {props.sefiBalance ? (
          <Text>
            {props.sefiBalance} {'SEFI'}
          </Text>
        ) : (
          <Loader type="ThreeDots" color="#00BFFF" height="1em" width="1em" />
        )}
      </div>
    </div>
  );
}

export interface RewardData {
  reward: IRewardPool;
  token: ITokenInfo;
}

export const SeFiStakingPage = observer(() => {
  const { user, tokens, rewards, userMetamask,theme } = useStores();

  const [filteredTokens, setFilteredTokens] = useState<ITokenInfo[]>([]);
  const [earnings,setEarnings] = useState('0');
  const [sefiBalance, _setSefiBalance] = useState<string | JSX.Element>('');

  function setSefiBalance(balance: string) {
    if (balance === unlockToken) {
      balance = unlockJsx({
        onClick: async () => {
          await user.keplrWallet.suggestToken(user.chainId, process.env.SCRT_GOV_TOKEN_ADDRESS);
          await user.updateBalanceForSymbol('SEFI');
          setSefiBalance(user.balanceToken['SEFI']);
        },
      });
      _setSefiBalance(balance);
    } else if (balance === fixUnlockToken) {
      _setSefiBalance(wrongViewingKey);
    } else {
      _setSefiBalance(balance);
    }
  }



  const [sefiBalanceErc, setSefiBalanceErc] = useState<string>(undefined);
  const [rewardsData, setRewardsData] = useState<RewardData[]>([]);
  
  useEffect(() => {
    const asyncWrapper = async () => {
      while (rewards.isPending) {
        await sleep(100);
      }
      const mappedRewards = rewards.allData
        .filter(rewards => filteredTokens.find(element => element.dst_address === rewards.inc_token.address))
        .map(reward => {
          return { reward, token: filteredTokens.find(element => element.dst_address === reward.inc_token.address) };
        });
      
      
      setRewardsData(mappedRewards);
    };
    asyncWrapper().then(() => {});
  }, [filteredTokens, rewards, rewards.data]);

  const testSetTokens = useCallback(() => {
    const asyncWrapper = async () => {
      if (tokens.allData.length > 0) {
        await sleep(500);
        setFilteredTokens(tokens.tokensUsageSync('LPSTAKING'));
      }
    };
    asyncWrapper();
  }, [tokens, tokens.allData]);

  useEffect(() => {
    testSetTokens();
  }, [testSetTokens]);

  useEffect(() => {
    (async () => {
      if (userMetamask.ethAddress) {
        const balanceResult = await ethMethodsSefi.checkGovBalance(userMetamask.ethAddress);

        const asBigNumber = new BigNumber(balanceResult);
        if (asBigNumber.isNaN()) {
          setSefiBalanceErc(balanceResult);
        } else {
          setSefiBalanceErc(displayHumanizedBalance(humanizeBalance(asBigNumber, 6), null, 6));
        }
      }
    })();
  }, [userMetamask, userMetamask.ethAddress]);

  useEffect(() => {
    const refreshSefi = async () => {
      // if (filteredTokens.length <= 0) {
      //   return;
      // }
      while (!user.secretjs || tokens.isPending) {
        await sleep(100);
      }
      await user.updateBalanceForSymbol('SEFI');
      //await Promise.all(filteredTokens.map(token => user.updateBalanceForSymbol(token.display_props.symbol)));
      setSefiBalance(user.balanceToken['SEFI']);
    };

    refreshSefi().then(() => {});
  }, []);

  useEffect(() => {
    rewards.init({
      isLocal: true,
      sorter: 'none',
      pollingInterval: 20000,
    });
    rewards.fetch();
    tokens.init();
  }, []);


  return (
    <ProposalLayout>
      <div className={styles.sefistakin_page}>
            {rewardsData
              .slice()
              .sort((a, b) => {
                /* SEFI first */
                if (a.reward.inc_token.symbol === 'SEFI') {
                  return -1;
                }

                return 0;
              })
              .filter(rewardToken => (process.env.TEST_COINS ? true : !rewardToken.reward.hidden))
              //@ts-ignore
              .map((rewardToken,i) => {
                if (Number(rewardToken.reward.deadline) < 2_000_000) {
                  return null;
                }
                
                const rewardsToken = {
                  rewardsContract: rewardToken.reward.pool_address,
                  lockedAsset: rewardToken.reward.inc_token.symbol,
                  lockedAssetAddress: rewardToken.token.dst_address,
                  totalLockedRewards: divDecimals(
                    Number(rewardToken.reward.total_locked) * Number(rewardToken.reward.inc_token.price),
                    rewardToken.reward.inc_token.decimals,
                  ),
                  rewardsDecimals: String(rewardToken.reward.rewards_token.decimals),
                  rewards: user.balanceRewards[rewardsKey(rewardToken.reward.pool_address)],
                  deposit: user.balanceRewards[rewardsDepositKey(rewardToken.reward.pool_address)],
                  balance: user.balanceToken[rewardToken.token.dst_address],
                  decimals: rewardToken.token.decimals,
                  name: rewardToken.token.name,
                  price: String(rewardToken.reward.inc_token.price),
                  rewardsPrice: String(rewardToken.reward.rewards_token.price),
                  display_props: rewardToken.token.display_props,
                  remainingLockedRewards: rewardToken.reward.pending_rewards,
                  deadline: Number(rewardToken.reward.deadline),
                  rewardsSymbol: 'SEFI',
                };

                if(rewardToken.reward.pool_address === process.env.SEFI_STAKING_CONTRACT){
                    return (
                      <EarnRow
                        notify={notify}
                        key={`${rewardToken.reward.inc_token.symbol}-${i}`}
                        userStore={user}
                        token={rewardsToken}
                        callToAction="Sefi Earnings"
                        theme={theme}
                        isSefiStaking={true}
                      />
                    );
                }
              })}
          <InfoModalEarn />
      </div>
        
    </ProposalLayout>
  );
});

export default SeFiStakingPage
