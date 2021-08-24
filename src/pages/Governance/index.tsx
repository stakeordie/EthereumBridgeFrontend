import React, { useEffect, useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { Box } from 'grommet';
import moment from 'moment';
import { PageContainer } from 'components/PageContainer';
import { BaseContainer } from 'components/BaseContainer';
import { useStores } from 'stores';
import { observer } from 'mobx-react';
import { Button, Popup } from 'semantic-ui-react';
import { ProposalRow } from 'components/ProposalRow';
import SpinnerLineHor from '../../ui/Spinner/SpinnerLineHor';
import './style.scss';
import { calculateAPY, RewardsToken } from 'components/Earn/EarnRow';
import { unlockJsx } from 'pages/Swap/utils';
import { unlockToken, zeroDecimalsFormatter } from 'utils';
import { rewardsDepositKey } from 'stores/UserStore';
import { numberFormatter } from '../../utils/formatNumber'
import { HowItWorksModal } from './HowItWorksModal';


export const Governance = observer(() => {

  const newRewardsContract = process.env.SEFI_STAKING_CONTRACT;

  // SwapPageWrapper is necessary to get the user store from mobx 🤷‍♂️
  let { user, theme, tokens } = useStores();
  let query = new URLSearchParams(useLocation().search);
  const [rewardToken, setRewardToken] = React.useState<RewardsToken>(undefined);
  const [totalLocked, setTotalLocked] = React.useState(0.0);
  const [votingPower, setVotingPower] = React.useState(undefined);

  const filters = ['all', 'active', "passed", "failed"];

  const [proposals, setProposals] = useState([]);

  const [filtered, setFiltered] = useState(proposals);

  // Get the actual filter on click button
  const [selectedFilter, setSelectedFilter] = useState('all');

  const [amounts, setAmounts] = React.useState({} as any);

  

  function setFilter(filter: string): void { setSelectedFilter(filter) }

  const getProporsalsByStatus = (proposals: Array<any>, status: string) => {
    if (selectedFilter === 'all') {
      setFiltered(proposals);
    } else {
      const filter = proposals.filter((proposal => proposal.currentStatus.includes(status)));
      const sortedData = filter.sort((a, b) => b.end_date - a.end_date);
      setFiltered(sortedData);
    }
  }

  const countStatus = (status: string) => {
    if (status == 'all') {
      return proposals.length;
    } else {
      return proposals.filter(e => e.currentStatus === status.trim()).length;
    }
  }

  const apyString = (token: RewardsToken) => {
    const apy = Number(calculateAPY(token, Number(token.rewardsPrice), Number(token.price)));
    if (isNaN(apy) || 0 > apy) {
      return `∞%`;
    }
    const apyStr = zeroDecimalsFormatter.format(Number(apy));

    //Hotfix of big % number
    const apyWOCommas = apyStr.replace(/,/g, '')
    const MAX_LENGHT = 6;
    if (apyWOCommas.length > MAX_LENGHT) {
      const abrev = apyWOCommas?.substring(0, MAX_LENGHT)
      const abrevFormatted = zeroDecimalsFormatter.format(Number(abrev));
      const elevation = apyWOCommas.length - MAX_LENGHT;

      return `${abrevFormatted}e${elevation} %`;

    }
    return `${apyStr}%`;
  };

  async function createSefiViewingKey() {
    try {
      await user.keplrWallet?.suggestToken(user.chainId, process.env.SEFI_STAKING_CONTRACT);
      await user.updateBalanceForSymbol('SEFI');
      await user.refreshRewardsBalances('SEFI');
      await user.updateScrtBalance();
    } catch (e) {
      console.error("Error at creating new viewing key ", e)
    }
  }

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const calculateVotingPower = (!votingPower || !totalLocked) ? 0 : ((votingPower / totalLocked) * 100);
  const totalVotingPower = calculateVotingPower.toFixed(2);

  const calculateState = (prop) => {
    let endDate = moment.unix(prop.end_date)
    let now = moment();

    if (prop.status === 'in progress' && endDate > now) {
      return 'active'
    } else if (prop.status === 'in progress' && endDate <= now) {
      return 'tally in progress';
    } else if (prop.status === 'failed' && prop.valid === true) {
      return 'failed';
    } else if (prop.status === 'failed' && prop.valid === false) {
      return 'failed';
    } else if (prop.status === 'passed') {
      return 'passed';
    }
    return '';
  }

  async function getBalance(contract) {
    const result = await user.getSnip20Balance(contract);
    if (result === 'Unlock') {
      return null;
    }
    return result;
  }

  const theMinimum = amounts.minimumStake;

  useEffect(() => {
    (async () => {
      const proposals = await user.getProposals();
      const orderProposal = proposals.sort((a, b) => b.end_date - a.end_date).map((proposal,i)=>{
        return {
          ...proposal,
          index:proposals.length-i,
          currentStatus:calculateState(proposal)
        }
      })
      setProposals(orderProposal);
      getProporsalsByStatus(orderProposal, selectedFilter);
    })();
  }, [])

  useEffect(() => {
    getProporsalsByStatus(proposals, selectedFilter);
  }, [selectedFilter])

  //fetch total locked and Staking APY
  useEffect(() => {
    (async () => {
      const sefi_reward_token = await user.getRewardToken(process.env.SEFI_STAKING_CONTRACT)
      const { total_locked } = await user?.secretjs?.queryContractSmart(process.env.SEFI_STAKING_CONTRACT, { "total_locked": {} })
      const totalLocked = total_locked?.amount;
      const convertTotalLocked = totalLocked / (Math.pow(10, 6));

      setRewardToken(sefi_reward_token)
      setTotalLocked(convertTotalLocked)

    })();

  }, [tokens.allData])

  //update voting power
  useEffect(() => {
    (async (a) => {
      if (a) {
        await user.refreshTokenBalanceByAddress(a.lockedAssetAddress);
        await user.refreshRewardsBalances('', newRewardsContract);
        setVotingPower(user.balanceRewards[rewardsDepositKey(newRewardsContract)]); //SEFI Staking
      }

    })(rewardToken);

  }, [rewardToken])

  useEffect(() => {
    (async () => {
      const balance = await getBalance(newRewardsContract);
      const minimumStake = await user.getMinimumStake();
      setAmounts({
        balance: parseInt(balance) / 1e6,
        minimumStake: parseInt(minimumStake) / 1e6
      });
    })();
  }, [])

  return (
    <BaseContainer>
      <PageContainer>
        <Box
          className={`${theme.currentTheme}`}
          pad={{ horizontal: '136px', top: 'small' }}
          style={{ alignItems: 'center' }}
        >
          {/* <div className='governance '> */}
          <div className='hero-governance'>

            <div className='column-stats'>
              <div className="stats-apy">
                {(rewardToken) ? <h1>{apyString(rewardToken)}</h1> : <SpinnerLineHor />}
                <div>
                  <p>Staking APY</p>
                </div>
              </div>
              <div className={votingPower && (votingPower?.includes(unlockToken) || !votingPower) ? 'stats-power' : 'stats-power-loaded'}>
                <div>
                  {
                    votingPower ?
                      (votingPower) && (votingPower?.includes(unlockToken) || !votingPower)
                        ? unlockJsx({ onClick: createSefiViewingKey })
                        : <h1>{numberFormatter(votingPower, 2)}
                          <span className='pink'> SEFI </span>
                          <span>({totalVotingPower} %)</span>
                        </h1>
                      :
                      <SpinnerLineHor />
                  }
                </div>
                <div>
                  <p>My Voting Power</p>
                </div>
              </div>
              <div className="stats-voting">
                {
                  totalLocked ?
                    <h1>{numberFormatter(totalLocked, 2)} <span className='pink'> SEFI</span></h1>
                    : <SpinnerLineHor />
                }
                <p>Total Voting Power</p>
              </div>
            </div>

            <div className='buttons'>
              <div className='buttons-container'>
                {
                  votingPower === undefined || votingPower === '0' ?
                    <>
                      <Popup
                        // className="icon-info__popup"
                        content='You need SEFI to participate in SecretSwap governance'
                        trigger={<a>
                          <Button
                            disabled
                            className='g-button'
                          >
                            Participate in Governance
                          </Button>
                        </a>}
                      />
                    </>
                    :
                    (<Link to='/sefistaking'>
                      <Button
                        className='g-button'
                      >
                        Participate in Governance
                      </Button>
                    </Link>
                    )
                }
                {
                  amounts.minimumStake > amounts.balance || votingPower === undefined
                    ?
                    <Popup
                      style={{ color: 'red' }}
                      content={
                        votingPower === undefined ?
                          `You need staked SEFI to create a proposal.`
                          :
                          `You don't have the minimum staked SEFI to create a proposal. Minimum is ${theMinimum} SEFI.`
                      }

                      trigger={<a>
                        <Button
                          disabled
                          className='g-button--outline'
                        >
                          Create Proposal
                        </Button>
                      </a>}
                    />
                    :
                    <Link to="/proposal">
                      <Button
                        className='g-button--outline'
                      >
                        Create Proposal
                      </Button>
                    </Link>

                }
                <HowItWorksModal />
              </div>
            </div>
          </div>

          <div className='content-governance'>
            <div className='column content-governance__title'>
              <h3>{capitalizeFirstLetter(selectedFilter)} Proposals</h3>
              <div className='filters'>
                {
                  filters.map((filter, i) => {
                    return (
                      <Button
                        key={`${i}${filter}`}
                        onClick={() => { setFilter(filter) }}
                        className={
                          (filter === selectedFilter)
                            ? 'active filter-button'
                            : 'filter-button'
                        }
                      >
                        {capitalizeFirstLetter(filter)}
                        {` (${countStatus(filter)})`}
                      </Button>
                    )
                  })
                }
              </div>
            </div>
            <div className='list-proposal'>
              {

                filtered.map((p) => {
                  return (
                    <ProposalRow
                      key={p.id}
                      index={p.index}
                      address={p.address}
                      theme={theme}
                      title={p.title}
                      endTime={p.end_date}
                      status={p.status}
                      id={p.id}
                      finalized={p.finalized}
                      valid={p.valid}
                      currentStatus={p.currentStatus}
                      votingPercentaje={p.voting_percentaje}
                      totalLocked={totalLocked}
                    />
                  )
                })

              }
            </div>
          </div>
          {/* </div> */}
        </Box>
      </PageContainer>
    </BaseContainer >
  );
});
