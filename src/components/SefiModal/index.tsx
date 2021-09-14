import React, { useEffect } from 'react';
import { Modal } from 'semantic-ui-react'; 
import { getFeeForExecute, GetSnip20Params, notify, Snip20TokenInfo } from '../../blockchain-bridge';
import { CosmWasmClient } from 'secretjs';
import LocalStorageTokens from '../../blockchain-bridge/scrt/CustomTokens';
import Loader from 'react-loader-spinner'; 
import { ExitIcon } from '../../ui/Icons/ExitIcon';
import {SefiModalState} from './types/SefiModalState';
import {SefiData} from './types/SefiData';
import General from './General State';
import Claim from './Claim/Claim';
import ClaimCashback from './Claim/ClaimCashback';
import Loading from './Loading'
import Confirmation from './Confirmation/Confirmation'
import ConfirmationCashback from './Confirmation/ConfirmationCashback'
import  './styles.scss';
import { BigNumber } from 'bignumber.js';
import { ITokenInfo } from 'stores/interfaces';
import { Tokens } from 'stores/Tokens';
import { rewardsDepositKey, rewardsKey, UserStoreEx } from 'stores/UserStore';
import { SwapToken, SwapTokenMap, TokenMapfromITokenInfo } from 'pages/TokenModal/types/SwapToken';
import { canonicalizeBalance, displayHumanizedBalance, divDecimals, fixUnlockToken, formatWithTwoDecimals, humanizeBalance, sleep, unlockToken } from 'utils';
import { getNativeBalance, storeTxResultLocally, wrongViewingKey } from './utils';
import axios from 'axios'
import { claimErc, claimInfoErc, ClaimInfoResponse, claimInfoScrt, claimScrt } from './utils_claim';
import numeral from 'numeral'
import { UserStoreMetamask } from 'stores/UserStoreMetamask';
import { web3 } from '../../blockchain-bridge/eth';
import { useStores } from 'stores';
import cogoToast from 'cogo-toast';
import { RewardsToken } from 'components/Earn/EarnRow';


export const SefiModal = (props: {
  user: UserStoreEx;
  tokens: Tokens;
  metaMask: UserStoreMetamask;
})=>{
  const [open, setOpen] = React.useState(false);
  const [status, setStatus] = React.useState<SefiModalState>(SefiModalState.GENERAL);
  const [hasViewingKey, setHasViewingKey] = React.useState<Boolean>(false);
  const [token, setToken] = React.useState<SwapToken>(undefined);
  const [data ,setData] = React.useState<SefiData>({
    balance:'—',
    unclaimed:'—',
    cashback_balance:'—',
    apys:[],
    expected_sefi:0.0,
    sefi_price: 0.0,
    sefi_in_circulation : '—',
    total_supply: '1bn'
  });
  const [claimInfo,setClaimInfo] = React.useState<{
    eth:any;
    scrt:any;
  }>(undefined)
  const [unclaimedAmount,setUnclaimedAmout] = React.useState<number>(0.0);
  const {user,rewards,theme} = useStores();


  async function getSefiToken(){
    const tokens: ITokenInfo[] = [...(await props.tokens.tokensUsage('SWAP'))];
    // convert to token map for swap
    const swapTokens: SwapTokenMap = TokenMapfromITokenInfo(tokens); // [...TokenMapfromITokenInfo(tokens), ...loadTokensFromList('secret-2')];
    
    let SEFItoken;
    swapTokens.forEach((st)=>{
      if(st.symbol === 'SEFI'){
        SEFItoken = st;
      }
    })
    return SEFItoken;
  };

  async function getSefiBalance(token : SwapToken){
    let balance = await refreshTokenBalance(token);
    if(JSON.stringify(balance).includes('View')){
      return balance
    }else{
      const humanizedBalance = displayHumanizedBalance(
        humanizeBalance(new BigNumber(balance as BigNumber), token.decimals),
        BigNumber.ROUND_DOWN,)
      return humanizedBalance;
    }
  };
  async function refreshTokenBalance(token: SwapToken) {
    let userBalancePromise; //balance.includes(unlockToken)
    if (token.identifier.toLowerCase() !== 'uscrt') {
      // todo: move this inside getTokenBalance?
      const tokenAddress = token?.address;

      if (!tokenAddress) {
        console.log('refreshTokenBalance: Cannot find token address for symbol', token.symbol);
        return {};
      }

      let balance = await props.user.getSnip20Balance(tokenAddress);

      if (balance === unlockToken) {
        setHasViewingKey(false);

      } else if (balance === fixUnlockToken) {
        userBalancePromise = wrongViewingKey;
      } else {
        setHasViewingKey(true)
        userBalancePromise = new BigNumber(balance);
      }
    } else {
      userBalancePromise = await getNativeBalance(props.user.address, props.user.secretjsSend);
    }

    return userBalancePromise ;
  }
  async function getSefiPrice(){
    const time = new Date().getTime();

    const statsData = await axios({
        method: 'get',
        url: 'https://storage.googleapis.com/astronaut/sefi.json?time=' + time
    });
    return parseFloat(statsData.data.price);
  }
  async function getCirculationSEFI(){
    const INITIAL_SEFI = 100000000;
    const CURRENT_BLOCK = await props.user.secretjs.getHeight()
    const INITIAL_BLOCK = 2830000;
    const SEFI_PER_BLOCK = 94.368341;
    let totalSefi = INITIAL_SEFI + ((CURRENT_BLOCK - INITIAL_BLOCK) * SEFI_PER_BLOCK) 
    
    return totalSefi;
  }

  const loadSRCTClaimInfo = async () => {
    console.log('Load SRCT claim');
    try {
      if (props.user.address) {
        const infoSrct = await claimInfoScrt(props.user.secretjs, props.user.address)
        while (!props.user.secretjs) {
          await sleep(100);
        }
        return infoSrct;
      }else{
        props.user.signIn();
        return undefined;
      }
    } catch (error) {
      console.error("Error at loading SRCT claim info",error)
      return undefined;
    }
  };
  const loadETHClaimInfo = async () => {
    console.log('Load ETH claim');
    try {
      if (props.metaMask.ethAddress) {
        const infoErc = await claimInfoErc(props.metaMask.ethAddress);
        while (!props.user.secretjs) {
          await sleep(100);
        }
        return infoErc;
      }else{
        console.log('Meta mask sigin now');
        await props.metaMask.signIn();
        return undefined;
      }
    } catch (error) {
      console.error("Error at loading ETH claim info",error)
      return undefined;
    }
  };
  async function getClaimInfo ():Promise<any>{
    const ethClaimInfo = await loadETHClaimInfo();
    const scrtClaimInfo = await loadSRCTClaimInfo();
    return {scrtClaimInfo,ethClaimInfo}
  };
  async function createSefiViewingKey() {
    try {
      setOpen(false);
      await props.user.keplrWallet.suggestToken(props.user.chainId, token.address);
      await props.user.updateScrtBalance();
      setHasViewingKey(true)
    } catch (e) {
      console.error("Error at creating new viewing key ",e)
    }
    
  }
  async function createCSHBKViewingKey() {
    try {
      setOpen(false);
      await props.user.keplrWallet.suggestToken(props.user.chainId, process.env.CSHBK_CONTRACT);
      await props.user.updateCSHBKBalance();
      setHasViewingKey(true)
    } catch (e) {
      console.error("Error at creating new viewing key ",e)
    }
    
  }
  function getFloatFormat(number) {
    let result;
    switch (number.toFixed(0).toString().length) {
        case 1:
        case 2:
        case 4:
        case 7:
        case 10:
            result = '(0.00a)';
            break;
        case 5:
        case 8:
        case 11:
            result = '(0.0a)';
            break;
        case 3:
        case 6:
        case 9:
        default:
            result = '(0a)';
    }
    return result;
  }
  function getData():any {
    getSefiToken().then(async(token : SwapToken)=>{
      setToken(token)
      let balance,unclaimed= undefined;
      let apys:RewardsToken[];
      //Get sefi balance here
      try {
        balance = await getSefiBalance(token);
        balance = balance.toString().replace(",","")
        balance = formatWithTwoDecimals(balance);
      } catch (error) {
        console.error("Error at getting SEFI balance")
      }
      //Load unclaimed 
      try {
        const {scrtClaimInfo,ethClaimInfo} = await getClaimInfo();
        const totalUnclaimed = parseFloat(divDecimals(scrtClaimInfo?.amount?.toString() || 0, 6)) + parseFloat(divDecimals(ethClaimInfo?.amount?.toString() || 0, 6));
        unclaimed = numeral(totalUnclaimed).format(getFloatFormat(totalUnclaimed)).toString().toUpperCase()
        setClaimInfo({
          eth:ethClaimInfo,
          scrt:scrtClaimInfo,
        })
      } catch (error) {
        console.error("Error at fetch unclaimed SEFI",error)
      }
      const price = await getSefiPrice()
      const price_formatted = numeral(price).format('$0.00');
      const sefi_circulation =  await getCirculationSEFI();
      const total_sefi_circulation = numeral(sefi_circulation).format(getFloatFormat(sefi_circulation)).toString().toUpperCase()
      
      //Load APY's info
      try {
          apys =  await getAPYsInfo();
        
      } catch (error) {
        console.error("Error at fetch unclaimed SEFI",error)
        
      }
      setData({
        ...data,
        balance: balance || "—",
        cashback_balance: user.balanceCSHBK || '0.0',
        expected_sefi: user.expectedSEFIFromCSHBK,
        sefi_price:price_formatted,
        unclaimed: unclaimed,
        apys: apys,
        sefi_in_circulation: total_sefi_circulation,
      })
    });
  }
  const onClaimSefi = ()=>{
    console.log("Moving to Claim");
    setStatus(SefiModalState.CONFIRMATION);
  };
  const onClaimCashback = ()=>{
    console.log("Moving to Claim Cashback");
    setStatus(SefiModalState.CLAIM_CASH_BACK);
  };

  const onClaimSCRT = async()=>{
    console.log('Claiming SEFI...')
    try {
      setUnclaimedAmout(parseFloat(claimInfo.scrt?.amount))
      const result = await claimScrt(props.user.secretjsSend, props.user.address);
      console.log('success', 'Claimed SeFi successfully!');
      setStatus(SefiModalState.CONFIRMATION);
    } catch (e) {
      console.error(`failed to claim ${e}`);
    } finally {
      await props.user.updateBalanceForSymbol('SEFI');
      console.log(props.user.balanceToken['SEFI'])
    }
  };
  const onClaimErc = async()=>{
    console.log('Claiming SEFI...')
    try {
      setUnclaimedAmout(parseFloat(claimInfo.eth?.amount))
      const result = await claimErc();
      console.log('success', 'Claimed SeFi successfully!');
      setStatus(SefiModalState.CONFIRMATION);
    } catch (e) {
      console.error(`failed to claim ${e}`);
    } finally {
      await props.user.updateBalanceForSymbol('SEFI');
      console.log(props.user.balanceToken['SEFI'])
    }
  };
  const loginMetaMask = ()=>{
    try {
      props.metaMask.signIn();
    } catch (error) {
      console.error(error)
    }
  }
  const loginKeplr = ()=>{
    try {
      props.user.signIn()
    } catch (error) {
      console.error(error)
    }
  }
  
  async function burnCashback(): Promise<any>{
    setStatus(SefiModalState.LOADING)
    setUnclaimedAmout(user.expectedSEFIFromCSHBK)
    try {
        await user.ConvertCHSBKToSEFI();
        notify('success', `Converted ${user.balanceCSHBK} CSHBK to SEFI!`);
        setStatus(SefiModalState.CONFIRMATION_CASHBACK)

      } catch (error) {
        console.error('Error', error);
        const txHash = error?.txHash;
        setStatus(SefiModalState.GENERAL)
        setOpen(false);
        notify(
          'errorWithHash',
          `Error Converting ${user.balanceCSHBK} CSHBK to SEFI
          }: ${error.message} ${txHash ? '\nTx Hash: ' + txHash : ''}`,
          undefined,
          txHash,
        );
        return;
      } finally { 
        console.log("Finally")
      }
  } 
  

  async function getAPYsInfo():Promise<RewardsToken[]>{
    while (rewards.isPending) {
      await sleep(100);
    }
    const lp_tokens = props.tokens.tokensUsageSync('LPSTAKING')
    const mappedRewards :RewardsToken[] = rewards.allData
      .filter(rewards => lp_tokens.find(element => (element.dst_address === rewards.inc_token.address) && 
                                                   ((rewards.inc_token.symbol === 'SEFI') || (rewards.inc_token.symbol === 'LP-sSCRT-SEFI'))))
      .map(reward => {
        const token = lp_tokens.find(element => element.dst_address === reward.inc_token.address)
        const rewardsToken = {
          rewardsContract: reward.pool_address,
          lockedAsset: reward.inc_token.symbol,
          lockedAssetAddress: token.dst_address,
          totalLockedRewards: divDecimals(
            Number(reward.total_locked) * Number(reward.inc_token.price),
            reward.inc_token.decimals,
          ),
          rewardsDecimals: String(reward.rewards_token.decimals),
          rewards: user.balanceRewards[rewardsKey(reward.inc_token.symbol)],
          deposit: user.balanceRewards[rewardsDepositKey(reward.inc_token.symbol)],
          balance: user.balanceToken[token.src_coin],
          decimals: token.decimals,
          name: token.name,
          price: String(reward.inc_token.price),
          rewardsPrice: String(reward.rewards_token.price),
          display_props: token.display_props,
          remainingLockedRewards: reward.pending_rewards,
          deadline: Number(reward.deadline),
          rewardsSymbol: 'SEFI',
        };
        return rewardsToken;
      });
    return mappedRewards;
  };

  useEffect(() => {
    rewards.init({
      isLocal: true,
      sorter: 'none',
      pollingInterval: 20000,
    });
    rewards.fetch();
  }, []);


  return(
    <Modal
      onClose={() => { 
          setStatus(SefiModalState.GENERAL); 
          setOpen(false);
        }
      }
      onOpen={() =>{ setOpen(true);getData()}}
      open={open}
      trigger={
      <button className={`btn-secondary`}>
        <a>SEFI</a>
      </button>}
      className="sefi-modal"
      style={{background: (theme.currentTheme == 'light')?'white':'#0E0E10' , color: (theme.currentTheme == 'light')?'#5F5F6B':'#DEDEDE'}}
    >
      <Modal.Header style={{background: (theme.currentTheme == 'light')?'white':'#0E0E10' , color: (theme.currentTheme == 'light')?'#5F5F6B':'#DEDEDE'}}>
        <div style={{ display: 'flex', justifyContent: 'space-between'}}>
          {(status === SefiModalState.GENERAL)&& <span>Your SEFI Breakdown</span>}
          {(status === SefiModalState.CLAIM || status === SefiModalState.CLAIM_CASH_BACK)&& <span>Claim your SEFI tokens</span>}
          {(status === SefiModalState.LOADING)&& <span>Claiming</span>}
          {(status === SefiModalState.CONFIRMATION || status === SefiModalState.CONFIRMATION_CASHBACK)&& <span>Claimed SEFI</span>}
          <span style={{ cursor: 'pointer' }} onClick={() => {
            setStatus(SefiModalState.GENERAL);
            setOpen(false);
          }}>
            <ExitIcon />
          </span>
        </div>
      </Modal.Header>
      <Modal.Content style={{background: (theme.currentTheme == 'light')?'white':'#0E0E10' , color: (theme.currentTheme == 'light')?'#5F5F6B':'#DEDEDE'}}>
        {
          (status === SefiModalState.GENERAL) 
            && <General 
              createSefiViewingKey={createSefiViewingKey} 
              createCSHBKViewingKey={createCSHBKViewingKey} 
              hasViewingKey={hasViewingKey} 
              onClaimSefi={onClaimSefi} 
              onClaimCashback={onClaimCashback} 
              claimInfo={claimInfo} 
              data={data}
              />
        }
        {
          (status === SefiModalState.CLAIM) 
            && <Claim 
                onKeplrIcon={loginKeplr} 
                onMetaMaskIcon={loginMetaMask} 
                claimInfo={claimInfo} 
                onClaimSCRT={onClaimSCRT} 
                onClaimErc={onClaimErc} 
                data={data}
              />
        }
        {
          (status === SefiModalState.CLAIM_CASH_BACK) 
              && <ClaimCashback 
                  data={data} 
                  burnCashback={burnCashback}
                  onKeplrIcon={loginKeplr}
                  claimInfo={claimInfo} 
                />
        }
        {
          (status === SefiModalState.LOADING) 
            && <Loading unclaimed={unclaimedAmount}/>
        }
        {
          (status === SefiModalState.CONFIRMATION) 
            && <Confirmation data={data}/>}
        {
          (status === SefiModalState.CONFIRMATION_CASHBACK) 
            && <ConfirmationCashback data={data}/>
        }
       
      </Modal.Content>
    </Modal>
  )
}
