import React, { Component } from 'react';

import * as styles from './styles.styl';
import cn from 'classnames';
import { Accordion, Divider, Grid, Icon, Image, Segment } from 'semantic-ui-react';
import SoftTitleValue from '../SoftTitleValue';
import EarnButton from './EarnButton';
import DepositContainer from './DepositContainer';
import ClaimBox from './ClaimBox';
import { UserStoreEx } from '../../../stores/UserStore';
import { observer } from 'mobx-react';
import WithdrawButton from './WithdrawButton';
import { divDecimals, formatWithTwoDecimals, zeroDecimalsFormatter } from '../../../utils';
import { Text } from '../../Base';
import ScrtTokenBalance from '../ScrtTokenBalance';
import { useStores } from 'stores';
import Theme from 'themes';
import {Link} from 'react-router-dom'

const newRewardsContract = process.env.SEFI_STAKING_CONTRACT;
const oldRewardsContract = process.env.SEFI_STAKING_OLD_CONTRACT;

export const calculateAPY = (token: RewardsToken, price: number, priceUnderlying: number) => {
  // console.log(Math.round(Date.now() / 1000000))
  // deadline - current time, 6 seconds per block
  const timeRemaining = (Math.min(token.deadline, 7916452) - 3377310) * 6.22 + 1620719241 - Math.round(Date.now() / 1000);

  // (token.deadline - Math.round(Date.now() / 1000000) );
  const pending = Number(divDecimals(token.remainingLockedRewards, token.rewardsDecimals)) * price;

  // this is already normalized
  const locked = Number(token.totalLockedRewards);

  //console.log(`pending - ${pending}; locked: ${locked}, time remaining: ${timeRemaining}`)
  const apr = Number((((pending * 100) / locked) * (3.154e7 / timeRemaining)).toFixed(0));
  const apy = Number((Math.pow(1 + apr / 100 / 365, 365) - 1) * 100);

  return apy;
};
const tokenImages = {
  'SSCRT': '/static/token-images/sscrt.svg',
  'SEFI': '/static/token-images/sefi.svg',
  'SIENNA': '/static/token-images/sienna.svg',
  'BAC': '/static/token-images/bac_ethereum.svg',
  'RENBTC': '/static/token-images/renbtc_ethereum.svg',
  'DPI': '/static/token-images/dpi_ethereum.svg',
  'UNILP-WSCRT-ETH': '/static/token-images/unilp_ethereum.svg',
  'RUNE': '/static/token-images/rune_ethereum.svg',
  'MANA': '/static/token-images/mana_ethereum.svg',
  'YFL': '/static/token-images/yfl_ethereum.svg',
  'BNB(BSC)': '/static/token-images/bnb_binance.svg',
  'ETH': '/static/token-images/eth_ethereum.svg',
  'USDT': '/static/token-images/usdt_ethereum.svg',
  'DAI': '/static/token-images/dai_ethereum.svg',
  'COMP': '/static/token-images/comp_ethereum.svg',
  'UNI': '/static/token-images/uni_ethereum.svg',
  'YFI': '/static/token-images/yfi_ethereum.svg',
  'TUSD': '/static/token-images/tusd_ethereum.svg',
  'OCEAN': '/static/token-images/ocean_ethereum.svg',
  'LINK': '/static/token-images/link_ethereum.svg',
  'MKR': '/static/token-images/mkr_ethereum.svg',
  'SNX': '/static/token-images/snx_ethereum.svg',
  'BAND': '/static/token-images/band_ethereum.svg',
  'KNC': '/static/token-images/knc_ethereum.svg',
  'AAVE': '/static/token-images/aave_ethereum.svg',
  'WBTC': '/static/token-images/wbtc_ethereum.svg',
  'REN': '/static/token-images/ren_ethereum.svg',
  'SUSHI': '/static/token-images/sushi_ethereum.svg',
  'RSR': '/static/token-images/rsr_ethereum.svg',
  'USDC': '/static/token-images/usdc_ethereum.svg',
  'TORN': '/static/token-images/torn_ethereum.svg',
  'BAT': '/static/token-images/bat_ethereum.svg',
  'ZRX': '/static/token-images/zrx_ethereum.svg',
  'ENJ': '/static/token-images/enj_ethereum.svg',
  'ALPHA': '/static/token-images/alpha_ethereum.svg',
  'BUSD(BSC)': '/static/token-images/busd_binance.svg',
  'ETH(BSC)': '/static/token-images/eth_binance.svg',
  'XRP(BSC)': '/static/token-images/xrp_binance.svg',
  'USDT(BSC)': '/static/token-images/usdt_binance.svg',
  'ADA(BSC)': '/static/token-images/ada_binance.svg',
  'DOGE(BSC)': '/static/token-images/doge_binance.svg',
  'DOT(BSC)': '/static/token-images/dot_binance.svg',
  'USDC(BSC)': '/static/token-images/usdc_binance.svg',
  'BCH(BSC)': '/static/token-images/bch_binance.svg',
  'LTC(BSC)': '/static/token-images/ltc_binance.svg',
  'LINK(BSC)': '/static/token-images/link_binance.svg',
  'TRX(BSC)': '/static/token-images/trx_binance.svg',
  'CAKE': '/static/token-images/cake_binance.svg',
  'BAKE': '/static/token-images/bake_binance.svg',
  'XVS': '/static/token-images/xvs_binance.svg',
  'LINA': '/static/token-images/lina_binance.svg',
  'FINE': '/static/token-images/fine_binance.svg',
  'BUNNY': '/static/token-images/bunny_binance.svg',
  'XMR': '/static/sXMR.png'
}

export const apyString = (token: RewardsToken) => {
  const apy = Number(calculateAPY(token, Number(token.rewardsPrice), Number(token.price)));
  if (isNaN(apy) || 0 > apy) {
    return `∞%`;
  }
  const apyStr = zeroDecimalsFormatter.format(Number(apy));

  //Hotfix of big % number
  const apyWOCommas = apyStr.replace(/,/g,'')
  const MAX_LENGHT = 9;
  if(apyWOCommas.length > MAX_LENGHT){
    const abrev = apyWOCommas?.substring(0,MAX_LENGHT)
    const abrevFormatted = zeroDecimalsFormatter.format(Number(abrev));
    const elevation = apyWOCommas.length - MAX_LENGHT;

    return `${abrevFormatted}e${elevation} %`;

  }
  return `${apyStr}%`;
};
export interface RewardsToken {
  name: string;
  decimals: string;
  display_props: {
    image: string;
    label: string;
    symbol: string;
  };
  price: string;
  rewardsPrice: string;
  balance: string;
  deposit: string;
  rewards: string;
  rewardsContract: string;
  rewardsDecimals: string;
  lockedAsset: string;
  lockedAssetAddress: string;
  totalLockedRewards: string;
  remainingLockedRewards: string;
  deadline: number;
  rewardsSymbol?: string;
}
@observer
class EarnRow extends Component<
  {
    userStore: UserStoreEx;
    token: RewardsToken;
    notify: Function;
    callToAction: string;
    theme: Theme;
    isSefiStaking?: boolean;
  },
  {
    activeIndex: Number;
    depositValue: string;
    withdrawValue: string;
    claimButtonPulse: boolean;
    pulseInterval: number;
    secondary_token:any;
  }
> {
  state = {
    activeIndex: -1,
    depositValue: '0.0',
    withdrawValue: '0.0',
    claimButtonPulse: true,
    pulseInterval: -1,
    secondary_token:{
      image:'',
      symbol:'',
    },
  };
  componentDidMount(){
    //auto open for SEFI STAKING page
    if(this.props.isSefiStaking){
      setTimeout(() => {
        this.handleClick('',{index:0})
      }, 100);
    }
  }

  handleChangeDeposit = event => {
    this.setState({ depositValue: event.target.value });
  };

  handleChangeWithdraw = event => {
    this.setState({ withdrawValue: event.target.value });
  };

  handleClick = (e, titleProps) => {
    const { index } = titleProps;
    const { activeIndex } = this.state;
    const newIndex = activeIndex === index ? -1 : index;
    if (activeIndex === -1) {
      this.props.userStore.refreshTokenBalanceByAddress(this.props.token.lockedAssetAddress);
      this.props.userStore.refreshRewardsBalances('',this.props.token.rewardsContract);
    }
    this.setState({ activeIndex: newIndex });
  };

  togglePulse = () =>
    this.setState(prevState => ({
      claimButtonPulse: !prevState.claimButtonPulse,
    }));

  clearPulseInterval = () => clearInterval(this.state.pulseInterval);

  setPulseInterval = interval => this.setState({ pulseInterval: interval });
  unCapitalize=(s)=>{
    if(typeof s !== 'string') return '';
    return s.charAt(0).toLowerCase()+s.slice(1)
  }
  getBaseTokenName = (tokenName:string):string=>{
    if(!tokenName)
      return '';
    
    tokenName = tokenName.toUpperCase();
    
    if(tokenName == 'SSCRT' || tokenName == 'SEFI' ||tokenName == 'SCRT'){
      return tokenName;
    }else{
      if(tokenName.charAt(0) == 'S'){
        return tokenName.slice(1)
      }else{
        return tokenName;
      }
    }
  }
  render() {
    // const style = Number(this.props.token.balance) > 0 ? styles.accordionHaveDeposit : `${styles.accordion} ${styles[this.props.theme.currentTheme]}`;
    const style =`${styles.accordion} ${styles[this.props.theme.currentTheme]}`;
    //this.props.userStore.keplrWallet.suggestToken(this.props.userStore.chainId, );
    const { activeIndex } = this.state;

    const _symbols = this.props.token.lockedAsset?.toUpperCase().split('-');
    let image_primaryToken,image_secondaryToken;
    let tokenName1 = this.getBaseTokenName(_symbols[1])
    let tokenName2 = this.getBaseTokenName(_symbols[2])

    // Overide the image for each token
    if (tokenImages[tokenName1]) {
      image_primaryToken = tokenImages[tokenName1]
    }
    if (tokenImages[tokenName2]) {
      image_secondaryToken = tokenImages[tokenName2]
    }
    
    let tokenName;
    if(_symbols[1] == 'SEFI'){
      tokenName = _symbols[1]+' - '+this.unCapitalize(_symbols[2]);
    }else if(_symbols[2] == 'SEFI'){
      tokenName = this.unCapitalize(_symbols[1])+' - '+_symbols[2];
    }else{
      tokenName = this.unCapitalize(_symbols[1])+' - '+this.unCapitalize(_symbols[2]);

    }

    let title = this.props.token.display_props.label === 'SEFI' ? 'SEFI STAKING' : tokenName;
    if (this.props.token.rewardsContract === oldRewardsContract) {
      title = 'SEFI STAKING (OLD)';
    }
    const isOldContract = this.props.token.rewardsContract === oldRewardsContract;

    return (
      <Accordion
        className={cn(style)}
      >
        <Accordion.Title
          active={activeIndex === 0}
          index={0}
          onClick={this.handleClick}
          className={`${styles.assetRow} ${styles.responsive_row}`}
        >
          {(this.props.token.lockedAsset === "SEFI")?
              <div className={cn(styles.assetIcon)}>
                <Image src="/static/tokens/sefi.png" rounded size="mini" />
              </div>
            :
            (
              <div className={cn(styles.assetIcon)}>
              <Image src={image_primaryToken} rounded size="mini" />
              <Image src={image_secondaryToken} rounded size="mini" />
              </div>
            )
          }

            <div className={cn(styles.title_item__container)}>
              <SoftTitleValue
                title={title}
                subTitle='    '
              />
            </div>
            <div className={cn(styles.title_item__container)}>
              <SoftTitleValue title={apyString(this.props.token)} subTitle={'APY'} />
            </div>
            <div className={cn(styles.title_item__container)}>
              <SoftTitleValue
                title={`$${formatWithTwoDecimals(Number(this.props.token.totalLockedRewards) || 0)}`}
                subTitle={'TVL'}
              />
            </div>
            {/* <div className={cn(styles.title_item__container)}>
              <SoftTitleValue
                title={`$${formatWithTwoDecimals(Number(this.props.token.balance))}`}
                subTitle={this.props.token.display_props.label}
              />
            </div>
            <div className={cn(styles.title_item__container)}>
              <SoftTitleValue title={formatWithTwoDecimals(this.props.token.rewards)} subTitle={this.props.callToAction} />
            </div> */}
            

          <Icon className={`${styles.arrow}`} style={{
            color:(this.props.theme.currentTheme == 'dark')?'white':''
          }} name="dropdown" />
        </Accordion.Title>
        <Accordion.Content className={`${styles.content} ${styles[this.props.theme.currentTheme]}`} active={activeIndex === 0}>
          {/* <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',

              marginLeft: '3.5rem',
              marginRight: '3.5rem',
            }}
          >
            <ScrtTokenBalance
              value={this.props.token.balance}
              decimals={0}
              currency={this.props.token.lockedAsset}
              userStore={this.props.userStore}
              tokenAddress={this.props.token.lockedAssetAddress}
              selected={this.state.activeIndex === 0}
              minimumFactions={0}
              subtitle={`Available to Deposit`}
              pulse={this.state.claimButtonPulse}
              pulseInterval={this.state.pulseInterval}
              unlockTitle={'View Balance'}
              unlockSubtitle={'Available to Deposit'}
              onUnlock={value => {
                if (value) {
                  this.props.notify(
                    'success',
                    `Created a viewing key for ${this.props.token.display_props.symbol !== 'SEFI' ? 's' : ''}${
                      this.props.token.display_props.symbol
                    }`,
                  );
                } else {
                  this.props.notify(
                    'error',
                    `Failed to create viewing key for s${this.props.token.display_props.symbol}!`,
                  );
                }
              }}
            />
            <ScrtTokenBalance
              subtitle={'Available Rewards'}
              tokenAddress={this.props.token.rewardsContract}
              decimals={0}
              userStore={this.props.userStore}
              currency={this.props.token.rewardsSymbol || 'sSCRT'}
              selected={false}
              value={this.props.token.rewards}
              pulse={this.state.claimButtonPulse}
              pulseInterval={this.state.pulseInterval}
              unlockTitle="View Balance"
              unlockSubtitle="Available Rewards"
              onUnlock={value => {
                if (value) {
                  this.props.notify(
                    'success',
                    `Created a viewing key for ${this.props.token.display_props.symbol !== 'SEFI' ? 's' : ''}${
                      this.props.token.display_props.symbol
                    } rewards`,
                  );
                } else {
                  this.props.notify(
                    'error',
                    `Failed to create viewing key for s${this.props.token.display_props.symbol} rewards!`,
                  );
                }
              }}
            />
          </div> */}
          {
            (process.env.IS_MAINTENANCE === 'true')
              ? <div className='maintenance-warning'>
                  <h3><Icon name='warning circle'/>A new version of this earn pool is coming soon and will allow you to migrate. For now you can only withdraw LP tokens.</h3>
                </div>
              : <></>
          }
          
          <div>
            <Segment basic>
              <Grid className={cn(styles.content2)} columns={2} relaxed="very" stackable>
                <Grid.Column>
                  { isOldContract ?
                    (
                      <>
                        <h1 style={{ color: (this.props.theme.currentTheme == 'dark') ? 'white' : '#1B1B1B' }}>Earn on the new pool!</h1>
                        <p style={{ color: (this.props.theme.currentTheme == 'dark') ? 'white' : '#1B1B1B' }}>Migrate your tokens <Link to={"/migration"}>here</Link>.</p>
                      </>
                    )
                  :

                    <DepositContainer
                      title='Earn'
                      value={this.state.depositValue}
                      action={
                        <Grid columns={1} stackable relaxed={'very'}>
                          <Grid.Column
                            style={{
                              display: 'flex',
                              justifyContent: 'flex-start',
                            }}
                          >
                            <EarnButton
                              props={this.props}
                              value={this.state.depositValue}
                              changeValue={this.handleChangeDeposit}
                              togglePulse={this.togglePulse}
                              setPulseInterval={this.setPulseInterval}
                            />
                          </Grid.Column>
                        </Grid>
                      }
                      onChange={this.handleChangeDeposit}
                      balance={this.props.token.balance}
                      currency={this.props.token.lockedAsset}
                      price={this.props.token.price}
                      balanceText="Available"
                      unlockPopupText='Staking balance and rewards require an additional viewing key.'
                      tokenAddress={this.props.token.lockedAssetAddress} 
                      userStore={this.props.userStore}
                      theme={this.props.theme}
                    />

                  }
                </Grid.Column>
                <Grid.Column>
                  <DepositContainer
                    title='Withdraw'
                    value={this.state.withdrawValue}
                    onChange={this.handleChangeWithdraw}
                    action={
                      <Grid columns={1} stackable relaxed={'very'}>
                        <Grid.Column
                          style={{
                            display: 'flex',
                            justifyContent:'flex-start',
                          }}
                        >
                          <WithdrawButton
                            props={this.props}
                            value={this.state.withdrawValue}
                            changeValue={this.handleChangeWithdraw}
                          />
                        </Grid.Column>
                      </Grid>
                    } //({props: this.props, value: this.state.withdrawValue})}
                    balance={this.props.token.deposit}
                    currency={this.props.token.lockedAsset}
                    price={this.props.token.price}
                    balanceText="Staked"
                    unlockPopupText='Staking balance and rewards require an additional viewing key.'
                    tokenAddress={this.props.token.rewardsContract} 
                    userStore={this.props.userStore}
                    theme={this.props.theme}
                    />
                </Grid.Column>
              </Grid>
            </Segment>
          </div>
          <ClaimBox
            balance={this.props.token.deposit}
            unlockPopupText='Staking balance and rewards require an additional viewing key.'
            available={this.props.token.rewards}
            userStore={this.props.userStore}
            rewardsContract={this.props.token.rewardsContract}
            symbol={this.props.token.display_props.symbol}
            notify={this.props.notify}
            rewardsToken={this.props.token.rewardsSymbol || 'sSCRT'}
          />
          <Text
            size="medium"
            style={{
              padding: '20 20 0 20',
              cursor: 'auto',
              textAlign: 'center',
              fontFamily:'Poppins,Arial',
              color:(this.props.theme.currentTheme == 'dark')?'white':'#1B1B1B'
            }}
          >
            * Every time you deposit, withdraw or claim the contract will automagically claim your rewards for you!
          </Text>
        </Accordion.Content>
      </Accordion>
    );
  }
}

export default EarnRow;
