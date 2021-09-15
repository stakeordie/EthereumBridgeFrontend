import React from 'react';
import { Button, Container } from 'semantic-ui-react';
import { canonicalizeBalance, humanizeBalance, sortedStringify } from 'utils';
import { SwapAssetRow } from '../SwapAssetRow/SwapAssetRow';
import { AdditionalInfo } from './AdditionalInfo';
import { PriceRow } from '../../components/Swap/PriceRow';
import { compute_offer_amount, compute_swap } from '../../blockchain-bridge/scrt/swap';
import { SwapTokenMap } from '../TokenModal/types/SwapToken';
import { CosmWasmClient, ExecuteResult, SigningCosmWasmClient } from 'secretjs';
import { BigNumber } from 'bignumber.js';
import { extractValueFromLogs, getFeeForExecute, Snip20Send } from '../../blockchain-bridge';
import { FlexRowSpace } from '../../components/Swap/FlexRowSpace';
import { PairMap, SwapPair } from '../TokenModal/types/SwapPair';
import { DownArrow } from '../../ui/Icons/DownArrow';
import cn from 'classnames';
import * as styles from './styles.styl';
import { storeTxResultLocally } from './utils';
import { RouteRow } from 'components/Swap/RouteRow';
import { Token } from '../TokenModal/types/trade';
const baseButtonStyle = {
  margin: '1em 0 0 0',
  borderRadius: '4px',
  padding: '11px 42px',
  fontSize: '16px',
  fontWeight: '600',
  height: '46px',
};
const disableButtonStyle = { ...baseButtonStyle, color: '#5F5F6B', background: '#DEDEDE' };
const enableButtonStyle = { ...baseButtonStyle, color: '#FFFFFF', background: '#ff726e' };
const errorButtonStyle = {
  ...baseButtonStyle,
  color: '#ff726e',
  background: 'transparent',
  opacity: '1',
  cursor: 'default',
};
import { AsyncSender } from '../../blockchain-bridge/scrt/asyncSender';
import { UserStoreEx } from '../../stores/UserStore';
import stores from '../../stores';
import { observer } from 'mobx-react';
import { Symbols } from 'recharts';
const BUTTON_MSG_ENTER_AMOUNT = 'Enter an amount';
const BUTTON_MSG_NO_ROUTE = 'No route available';
const BUTTON_MSG_LOADING_PRICE = 'Loading price data';
const BUTTON_CONNECTING_TO_CHAIN = 'Connect Wallet to Trade';
const BUTTON_MSG_NOT_ENOUGH_LIQUIDITY = 'Insufficient liquidity for this trade';
const BUTTON_MSG_SWAP = 'Swap';
const BUTTON_MSG_FINDING_ROUTE = 'Finding best route';
const BUTTON_MSG_SELECT_TOKEN = 'Select a token';

function executeRouterSwap(
  secretjsSender: AsyncSender,
  secretAddress: string,
  fromToken: string,
  fromAmount: string,
  hops: (null | {
    from_token: { snip20: { address: string; code_hash: string } } | 'scrt';
    pair_address: string;
    pair_code_hash: string;
    expected_return?: string;
  })[],
  expected_return: string,
  bestRoute: string[],
) {
  if (fromToken === 'uscrt') {
    return secretjsSender.asyncExecute(
      process.env.AMM_ROUTER_CONTRACT,
      {
        receive: {
          from: secretAddress,
          amount: fromAmount,
          msg: btoa(
            JSON.stringify({
              to: secretAddress,
              hops,
              expected_return,
            }),
          ),
        },
      },
      '',
      [
        {
          amount: fromAmount,
          denom: 'uscrt',
        },
      ],
      getFeeForExecute(bestRoute.length * 500_000),
    );
  } else {
    return secretjsSender.asyncExecute(
      fromToken,
      {
        send: {
          recipient: process.env.AMM_ROUTER_CONTRACT,
          amount: fromAmount,
          msg: btoa(
            JSON.stringify({
              to: secretAddress,
              hops,
              expected_return,
            }),
          ),
        },
      },
      '',
      [],
      getFeeForExecute(bestRoute.length * 500_000),
    );
  }
}

function executeSwapUscrt(secretjsSender: AsyncSender, pair: SwapPair, fromAmount: string, expected_return: string) {
  // call the swap function directly since this is with uscrt
  return secretjsSender.asyncExecute(
    pair.contract_addr,
    {
      swap: {
        offer_asset: {
          info: { native_token: { denom: 'uscrt' } },
          amount: fromAmount,
        },
        expected_return,
        // offer_asset: Asset,
        // expected_return: Option<Uint128>
        // belief_price: Option<Decimal>,
        // max_spread: Option<Decimal>,
        // to: Option<HumanAddr>, // TODO
      },
    },
    '',
    [
      {
        amount: fromAmount,
        denom: 'uscrt',
      },
    ],
    getFeeForExecute(550_000),
  );
}

const extractError = (result: any) => {
  if (result?.raw_log && result.raw_log.includes('Operation fell short of expected_return')) {
    return 'Swap fell short of expected return (slippage error)';
  }
  if (result?.raw_log) {
    return result.raw_log;
  }
  console.error(result);
  return `Unknown error`;
};

function storeResult(result: any, fromAmount: string, fromDecimals: number, bestRoute: string[], toDecimals: number) {
  if (result?.code) {
    const error = extractError(result);
    throw new Error(error);
  }

  storeTxResultLocally(result);

  const sent = humanizeBalance(new BigNumber(fromAmount), fromDecimals).toFixed();
  const received = humanizeBalance(
    new BigNumber(extractValueFromLogs(result, 'return_amount', bestRoute != null)),
    toDecimals,
  ).toFixed();
  return { sent, received };
}

const DEFAULT_SLIPPAGE = 0.5 / 100;
@observer
export class SwapTab extends React.Component<
  {
    user: UserStoreEx;
    secretjs: CosmWasmClient;
    secretjsSender: AsyncSender;
    tokens: SwapTokenMap;
    balances: { [symbol: string]: BigNumber | JSX.Element };
    selectedToken0?: string;
    selectedToken1?: string;
    selectedPair: SwapPair;
    selectedPairRoutes: string[][];
    notify: (type: 'success' | 'error' | 'errorWithHash', msg: string, closesAfterMs?: number, txHash?: string) => void;
    onSetTokens: CallableFunction;
    refreshPools: CallableFunction;
    secretAddress: string;
    isSupported: boolean;
    pairs: PairMap;
    isLoadingSupportedTokens: boolean;
    updateBalances: Function;
  },
  {
    fromToken: string;
    toToken: string;
    fromInput: string;
    toInput: string;
    isFromEstimated: boolean;
    isToEstimated: boolean;
    spread: number;
    commission: number;
    priceImpact: number;
    slippageTolerance: BigNumber;
    buttonMessage: string;
    loadingSwap: boolean;
    loadingBestRoute: boolean;
    expectedCSHBK: number;
    loadingBestRouteCount: number;
    bestRoute: string[];
    loadingPriceData: boolean;
    allRoutesOutputs: Array<{
      route: string[];
      toOutput?: BigNumber;
      fromOutput?: BigNumber;
      priceImpacts: number[];
    }>;
  }
> {
  constructor(props) {
    super(props);

    this.state = {
      fromToken: this.props.selectedToken0 || this.props.tokens.get(process.env.SSCRT_CONTRACT)?.identifier || '',
      toToken: this.props.selectedToken1 || '',
      fromInput: '',
      toInput: '',
      isFromEstimated: false,
      isToEstimated: false,
      spread: 0,
      expectedCSHBK: 0.0,
      commission: 0,
      priceImpact: 0,
      slippageTolerance: new BigNumber(DEFAULT_SLIPPAGE),
      buttonMessage: BUTTON_MSG_ENTER_AMOUNT,
      loadingSwap: false,
      loadingPriceData: false,
      loadingBestRoute: false,
      loadingBestRouteCount: 0,
      bestRoute: null,
      allRoutesOutputs: [],
    };
  }

  async componentDidUpdate(previousProps) {
    if (
      sortedStringify({ ...previousProps.balances, ...previousProps.selectedPairRoutes }) !==
      sortedStringify({ ...this.props.balances, ...this.props.selectedPairRoutes })
    ) {
      this.updateInputs();
    }
  }

  async getOfferAndAskPools(
    fromToken: string,
    toToken: string,
    pair: SwapPair,
  ): Promise<{ offer_pool: BigNumber; ask_pool: BigNumber }> {
    const fromDecimals = this.props.tokens.get(fromToken).decimals;
    const toDecimals = this.props.tokens.get(toToken).decimals;

    // we normalize offer_pool & ask_pool
    // we could also canonicalize offer_amount & ask_amount
    // but this way is less code because we get the results normalized

    let offer_pool = humanizeBalance(
      new BigNumber(this.props.balances[`${fromToken}-${pair.identifier()}`] as any),
      fromDecimals,
    );
    let ask_pool = humanizeBalance(
      new BigNumber(this.props.balances[`${toToken}-${pair.identifier()}`] as any),
      toDecimals,
    );

    if (offer_pool.isNaN() || ask_pool.isNaN()) {
      const balances = await this.props.refreshPools({ pair });
      offer_pool = humanizeBalance(new BigNumber(balances[`${fromToken}-${pair.identifier()}`] as any), fromDecimals);
      ask_pool = humanizeBalance(new BigNumber(balances[`${toToken}-${pair.identifier()}`] as any), toDecimals);
    }

    return { offer_pool, ask_pool };
  }

  async updateInputsFromBestRoute() {
    const { fromToken, toToken, fromInput, toInput } = this.state;

    if (Number(fromInput) === 0 && this.state.isToEstimated) {
      return;
    }
    if (Number(toInput) === 0 && this.state.isFromEstimated) {
      return;
    }
    if (Number(fromInput) === 0 && Number(toInput) === 0) {
      return;
    }

    this.setState({ loadingBestRoute: true, loadingBestRouteCount: 0, bestRoute: null, allRoutesOutputs: [] });
    try {
      const routes = this.props.selectedPairRoutes;
      for (let i = 0; i < routes.length; i++) {
        if (routes[i][0] === toToken && routes[i][routes[i].length - 1] === fromToken) {
          routes[i] = routes[i].reverse();
        }
      }

      let bestRoute: string[] = null;
      let allRoutesOutputs: Array<{
        route: string[];
        toOutput?: BigNumber;
        fromOutput?: BigNumber;
        priceImpacts: number[];
      }> = [];
      let bestRouteToInput = new BigNumber(0);
      let bestRouteFromInput = new BigNumber(Infinity);
      let bestRoutePriceImpact = 0;
      for (let i = 0; i < routes.length; i++) {
        const route = routes[i];
        this.setState({ loadingBestRouteCount: i });

        if (this.state.isToEstimated /* top input is filled */) {
          let from = new BigNumber(fromInput);
          let to = new BigNumber(0);
          let priceImpacts: number[] = [];
          for (let i = 0; i < route.length - 1; i++) {
            const fromToken = route[i];
            const toToken = route[i + 1];
            const pair: SwapPair = this.props.pairs.get(`${fromToken}${SwapPair.id_delimiter}${toToken}`);

            const { offer_pool, ask_pool } = await this.getOfferAndAskPools(fromToken, toToken, pair);

            const offer_amount = from;
            if (
              offer_pool.isEqualTo(0) ||
              ask_pool.isEqualTo(0) ||
              offer_amount.isNaN() ||
              offer_amount.isLessThanOrEqualTo(0)
            ) {
              to = new BigNumber(0);
              break;
            }

            const { return_amount, spread_amount } = compute_swap(offer_pool, ask_pool, offer_amount);

            if (return_amount.isNaN() || return_amount.isLessThanOrEqualTo(0)) {
              to = new BigNumber(0);
              break;
            }

            to = return_amount;
            priceImpacts.push(spread_amount.dividedBy(return_amount).toNumber());

            if (i < route.length - 2) {
              // setup for next iteration
              from = return_amount;
            }
          }

          allRoutesOutputs.push({ route, toOutput: to, priceImpacts });

          if (to.isGreaterThan(bestRouteToInput)) {
            bestRouteToInput = to;
            bestRoute = route;
            bestRoutePriceImpact = Math.max(...priceImpacts);
          }
        } else {
          // isFromEstimated
          // bottom input is filled
          let from = new BigNumber(0);
          let to = new BigNumber(toInput);
          let priceImpacts: number[] = [];
          for (let i = route.length - 1; i > 0; i--) {
            const fromToken = route[i - 1];
            const toToken = route[i];
            const pair: SwapPair = this.props.pairs.get(`${fromToken}${SwapPair.id_delimiter}${toToken}`);
            const { offer_pool, ask_pool } = await this.getOfferAndAskPools(fromToken, toToken, pair);

            const ask_amount = to;
            if (
              offer_pool.isEqualTo(0) ||
              ask_pool.isEqualTo(0) ||
              ask_amount.gt(ask_pool) ||
              ask_amount.isNaN() ||
              ask_amount.isZero()
            ) {
              from = new BigNumber(Infinity);
              break;
            }

            const { offer_amount, spread_amount } = compute_offer_amount(offer_pool, ask_pool, ask_amount);

            if (offer_amount.isNaN() || offer_amount.isLessThanOrEqualTo(0)) {
              from = new BigNumber(Infinity);
              break;
            }

            from = offer_amount;
            priceImpacts.push(spread_amount.dividedBy(ask_amount).toNumber());

            if (i > 1) {
              // setup for next iteration
              to = offer_amount;
            }
          }

          allRoutesOutputs.push({ route, fromOutput: from, priceImpacts });

          if (from.isLessThan(bestRouteFromInput)) {
            bestRouteFromInput = from;
            bestRoute = route;
            bestRoutePriceImpact = Math.max(...priceImpacts);
          }
        }
      }

      if (bestRoute) {
        if (this.state.isToEstimated) {
          const toDecimals = this.props.tokens.get(toToken).decimals;
          this.setState({
            toInput: bestRouteToInput.toFixed(toDecimals, BigNumber.ROUND_DOWN),
            bestRoute,
            commission: (0.3 / 100) * bestRouteToInput.toNumber(), // always denominated in toToken
            priceImpact: bestRoutePriceImpact,
            allRoutesOutputs,
          });
        } else {
          // isFromEstimated
          const fromDecimals = this.props.tokens.get(fromToken).decimals;
          this.setState({
            fromInput: bestRouteFromInput.toFixed(fromDecimals, BigNumber.ROUND_UP),
            bestRoute,
            commission: (0.3 / 100) * Number(this.state.toInput), // always denominated in toToken
            priceImpact: bestRoutePriceImpact,
            allRoutesOutputs,
          });
        }
      } else {
        if (this.state.isToEstimated) {
          this.setState({ toInput: '' });
        } else {
          // isFromEstimated
          this.setState({ fromInput: '' });
        }
      }
    } catch (e) {
      console.error('Error finding best route:', e.message);
    }

    this.setState({ loadingBestRoute: false, loadingBestRouteCount: 0 });
  }

  async updateInputs() {
    
    this.setState({ bestRoute: null, allRoutesOutputs: [] });

    const routes = this.props.selectedPairRoutes;

    if (routes.length === 0) {
      this.setState({
        fromInput: '',
        isFromEstimated: false,
        toInput: '',
        isToEstimated: false,
      });
      return;
    }

    await this.updateInputsFromBestRoute();
    await this.updateExpectedCSHBK();
  }
  symbolFromAddress = (identifier: string) => {
    const uniqueSymbols = ['SCRT', 'SEFI', 'CSHBK', 'sSCRT'];
    const symbol = this.props.tokens.get(identifier)?.symbol;
    if (uniqueSymbols.includes(symbol)) {
      return symbol;
    } else {
      return symbol?.substring(1, symbol.length);
    }
  };
  async updateExpectedCSHBK():Promise<void>{
    const pair = this.props.selectedPair;
    let expectedCSHBK='0.0'
    let doubleCashback=false;
    if(!this.props.isSupported && this.state.bestRoute?.length > 2){
      doubleCashback = this.state.bestRoute?.some((address)=>address===process.env.SSCRT_CONTRACT)
    }

    //Either From or To input is sSCRT or SCRT
    if(pair && this.props.isSupported){
      if(this.state.fromToken == 'uscrt' || this.state.fromToken == process.env.SSCRT_CONTRACT){
        expectedCSHBK = this.state.fromInput
      }else if (this.state.toToken == 'uscrt' || this.state.toToken == process.env.SSCRT_CONTRACT){
        expectedCSHBK = this.state.toInput;
      }
    }else if(!this.props.isSupported && doubleCashback){
      expectedCSHBK = await this.queryExpectedDoubleCashBack();
    }else{
      expectedCSHBK='0.0'
    }
    const cb_reward = parseFloat(parseFloat(expectedCSHBK).toFixed(8))
    this.setState({expectedCSHBK:cb_reward})
  }
  async queryExpectedDoubleCashBack():Promise<any>{
    try {
      let {  toToken,toInput ,fromInput,fromToken} = this.state;
      let token =this.props.tokens.get(toToken) ;
      const pair: SwapPair = this.props.pairs.get(`${process.env.SSCRT_CONTRACT}${SwapPair.id_delimiter}${toToken}`);

      if(pair){
          const { offer_pool, ask_pool } = await this.getOfferAndAskPools(toToken,process.env.SSCRT_CONTRACT, pair);
          let offer_amount = new BigNumber(toInput);
          const { return_amount } = compute_swap(offer_pool, ask_pool, offer_amount);
          const amount = return_amount.toFixed(token.decimals, BigNumber.ROUND_DOWN)
          return parseFloat(amount)*2;
      }else{
        console.error(`SCRT -> ${token.identifier} is not registered, estimated Cashback cannot be calculated`)
        return 0.0
      }

    } catch (error) {
      console.error(error)
      return 0.0
    }
  }


  render() {
    const pair = this.props.selectedPair;
    const ask_pool = pair
      ? new BigNumber(this.props.balances[`${this.state.toToken}-${pair?.identifier()}`] as BigNumber)
      : new BigNumber(0);
    const offer_pool = pair
      ? new BigNumber(this.props.balances[`${this.state.fromToken}-${pair?.identifier()}`] as BigNumber)
      : new BigNumber(0);

    const [fromBalance, toBalance] = [
      this.props.balances[this.state.fromToken],
      this.props.balances[this.state.toToken],
    ];

    const [fromDecimals, toDecimals] = [
      this.props.tokens.get(this.state.fromToken)?.decimals,
      this.props.tokens.get(this.state.toToken)?.decimals,
    ];

    const canonFromInput = canonicalizeBalance(new BigNumber(this.state.fromInput), fromDecimals);
    const canonToInput = canonicalizeBalance(new BigNumber(this.state.toInput), toDecimals);

    let buttonMessage: string;
    if (this.state.toToken === '' || this.state.fromToken === '') {
      buttonMessage = BUTTON_MSG_SELECT_TOKEN;
    } else if (this.state.loadingPriceData) {
      buttonMessage = BUTTON_MSG_LOADING_PRICE;
    } else if (this.props.isLoadingSupportedTokens) {
      buttonMessage = BUTTON_CONNECTING_TO_CHAIN;
    } else if (this.state.loadingBestRoute) {
      buttonMessage = BUTTON_MSG_FINDING_ROUTE;
    } else if (this.state.bestRoute) {
      if (this.state.fromInput === '' && this.state.toInput === '') {
        buttonMessage = BUTTON_MSG_ENTER_AMOUNT;
      } else if (new BigNumber(fromBalance as BigNumber).isLessThan(canonFromInput)) {
        buttonMessage = `Insufficient ${this.props.tokens.get(this.state.fromToken)?.symbol} balance`;
      } else if (this.state.fromInput === '' || this.state.toInput === '') {
        buttonMessage = BUTTON_MSG_LOADING_PRICE;
      } else {
        buttonMessage = BUTTON_MSG_SWAP;
      }
    } else if (this.props.selectedPairRoutes?.length > 0) {
      if (this.state.fromInput === '' && this.state.toInput === '') {
        buttonMessage = BUTTON_MSG_ENTER_AMOUNT;
      } else {
        buttonMessage = BUTTON_MSG_NOT_ENOUGH_LIQUIDITY;
      }
    } else if (!pair || this.props.selectedPairRoutes?.length == 0) {
      buttonMessage = BUTTON_MSG_NO_ROUTE;
    } else if (this.state.fromInput === '' && this.state.toInput === '') {
      buttonMessage = BUTTON_MSG_ENTER_AMOUNT;
    } else if (new BigNumber(fromBalance as BigNumber).isLessThan(canonFromInput)) {
      buttonMessage = `Insufficient ${this.props.tokens.get(this.state.fromToken)?.symbol} balance`;
    } else if (
      offer_pool.isZero() ||
      ask_pool.isZero() ||
      ask_pool.isLessThan(canonToInput) ||
      Number(this.state.fromInput) < 0 ||
      Number(this.state.toInput) < 0
    ) {
      buttonMessage = BUTTON_MSG_NOT_ENOUGH_LIQUIDITY;
    } else if (this.state.fromInput === '' || this.state.toInput === '') {
      buttonMessage = BUTTON_MSG_LOADING_PRICE;
    } else {
      buttonMessage = BUTTON_MSG_SWAP;
    }

    const hidePriceRow: boolean =
      this.state.toInput === '' ||
      this.state.fromInput === '' ||
      isNaN(Number(this.state.toInput) / Number(this.state.fromInput)) ||
      this.state.buttonMessage === BUTTON_MSG_LOADING_PRICE ||
      this.state.buttonMessage === BUTTON_MSG_NOT_ENOUGH_LIQUIDITY ||
      this.state.buttonMessage === BUTTON_MSG_NO_ROUTE;
    const price = Number(this.state.fromInput) / Number(this.state.toInput);
    const btnError = buttonMessage == BUTTON_MSG_NO_ROUTE || buttonMessage == BUTTON_MSG_NOT_ENOUGH_LIQUIDITY;
    return (
      <>
        <Container className={`${styles.swapContainerStyle} ${styles[stores.theme.currentTheme]}`}>
          {/* <TabsHeader /> */}
          <SwapAssetRow
            secretjs={this.props.secretjs}
            label="From"
            disabled={this.state.isFromEstimated && this.state.loadingBestRoute}
            maxButton={true}
            balance={fromBalance}
            tokens={this.props.tokens}
            token={this.state.fromToken}
            setToken={async (identifier: string) => {
              await this.setFromToken(identifier);
            }}
            amount={this.state.fromInput}
            isEstimated={
              false /* Eventually From is the exact amount that will be sent, so even if we estimate it in updateInputs we don't show the "(estimated)" label to the user */
            }
            setAmount={amount => this.setFromAmount(amount)}
            error={btnError}
          />
          <div
            style={{
              padding: '1em',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <FlexRowSpace />
            {this.state.loadingSwap ? (
              <span>
                <img className={cn(styles.spin)} width="28" height="23" src="/static/logoIcon.svg" alt="Secret Swap" />
              </span>
            ) : (
              <span
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  // switch
                  this.setState(
                    {
                      toToken: this.state.fromToken,
                      toInput: this.state.isFromEstimated ? '' : this.state.fromInput,
                      isToEstimated: this.state.isFromEstimated,

                      fromToken: this.state.toToken,
                      fromInput: this.state.isToEstimated ? '' : this.state.toInput,
                      isFromEstimated: this.state.isToEstimated,
                    },
                    async () => {
                      this.setState({ bestRoute: null, allRoutesOutputs: [] });

                      await this.props.onSetTokens(this.state.fromToken, this.state.toToken);

                      this.updateInputs();
                    },
                  );
                }}
              >
                <img src="/static/exchange-arrows.svg" alt="exchange arrows" />
              </span>
            )}

            <FlexRowSpace />
          </div>
          <SwapAssetRow
            secretjs={this.props.secretjs}
            label="To"
            disabled={this.state.isToEstimated && this.state.loadingBestRoute}
            maxButton={false}
            balance={toBalance}
            tokens={this.props.tokens}
            token={this.state.toToken}
            setToken={async (identifier: string) => {
              await this.setToToken(identifier);
            }}
            amount={this.state.toInput}
            isEstimated={this.state.toInput !== '' /* this.state.isToEstimated */}
            setAmount={(value: string) => {
              this.setToAmount(value);
            }}
            error={btnError}
          />
          {!hidePriceRow && (
            <PriceRow
              fromToken={this.props.tokens.get(this.state.fromToken).symbol}
              toToken={this.props.tokens.get(this.state.toToken).symbol}
              price={price}
            />
          )}
          {(this.state.bestRoute || this.state.loadingBestRoute) && (
            <RouteRow
              tokens={this.props.tokens}
              isLoading={this.state.loadingBestRoute}
              loadingCount={`${this.state.loadingBestRouteCount}/${this.props.selectedPairRoutes.length}`}
              route={this.state.bestRoute}
              allRoutesOutputs={this.state.allRoutesOutputs}
            />
          )}
          {btnError ? (
            <Button fluid style={errorButtonStyle}>
              {buttonMessage}
            </Button>
          ) : (
            <Button
              className={`${styles.swap_button} ${styles[stores.theme.currentTheme]}`}
              disabled={buttonMessage !== BUTTON_MSG_SWAP || this.state.loadingSwap}
              // loading={this.state.loadingSwap}
              primary={buttonMessage === BUTTON_MSG_SWAP}
              fluid
              onClick={async () => {
                if(process.env.IS_MAINTENANCE === 'true'){
                  stores.user.setModalOpen(true)
                  return;
                }
                const { fromInput, fromToken, toToken, bestRoute, priceImpact, slippageTolerance } = this.state;
                const pair = this.props.selectedPair;
                const optMessage = (this.state.expectedCSHBK)?`And you earned ${this.state.expectedCSHBK} cashback`:''
                this.setState({ loadingSwap: true });

                if (priceImpact >= 0.15) {
                  const confirmString = 'confirm';
                  const confirm = prompt(
                    `Price impact for this swap is very high. Please type the word "${confirmString}" to continue.`,
                  );
                  if (confirm !== confirmString) {
                    this.setState({ loadingSwap: false });
                    return;
                  }
                }

                try {
                  const { decimals } = this.props.tokens.get(fromToken);
                  const fromAmount = canonicalizeBalance(new BigNumber(fromInput), decimals).toFixed(
                    0,
                    BigNumber.ROUND_DOWN,
                    /*
                  should be 0 fraction digits because of canonicalizeBalance,
                  but to be sure we're rounding down to prevent over-spending
                  */
                  );

                  // offer_amount: exactly how much we're sending
                  // ask_amount: roughly how much we're getting
                  // expected_return: at least ask_amount minus some slippage

                  //const ask_amount = canonToInput;
                  let expected_return = canonToInput
                    .multipliedBy(new BigNumber(1).minus(slippageTolerance))
                    .toFormat(0, { groupSeparator: '' });
                  if (Number(expected_return) < 1) {
                    // make sure even low value trade won't lose funds
                    expected_return = '1';
                  }

                  if (fromToken === 'uscrt') {
                    let result: ExecuteResult;
                    if (bestRoute && bestRoute.length > 2) {
                      const hops = await this.getHops(bestRoute);

                      result = await executeRouterSwap(
                        this.props.secretjsSender,
                        this.props.secretAddress,
                        fromToken,
                        fromAmount,
                        hops,
                        expected_return,
                        bestRoute,
                      );
                    } else {
                      result = await executeSwapUscrt(this.props.secretjsSender, pair, fromAmount, expected_return);
                    }

                    const { sent, received } = storeResult(result, fromAmount, fromDecimals, bestRoute, toDecimals);

                    this.props.notify(
                      'success',
                      `Swapped ${sent} ${this.props.tokens.get(fromToken)?.symbol} for ${received} ${
                        this.props.tokens.get(toToken).symbol
                      } ${optMessage}`,
                    );
                  } else {
                    let result: ExecuteResult;
                    if (bestRoute && bestRoute.length > 2) {
                      const hops = await this.getHops(bestRoute);
                      result = await executeRouterSwap(
                        this.props.secretjsSender,
                        this.props.secretAddress,
                        fromToken,
                        fromAmount,
                        hops,
                        expected_return,
                        bestRoute,
                      );
                    } else {
                      result = await Snip20Send({
                        secretjs: this.props.secretjsSender,
                        address: fromToken,
                        amount: fromAmount,
                        msg: btoa(
                          JSON.stringify({
                            swap: {
                              expected_return,
                            },
                          }),
                        ),
                        recipient: pair.contract_addr,
                        fee: getFeeForExecute(550_000),
                      });
                    }

                    const { sent, received } = storeResult(result, fromAmount, fromDecimals, bestRoute, toDecimals);

                    this.props.notify(
                      'success',
                      `Swapped ${sent} ${this.props.tokens.get(fromToken).symbol} for ${received} ${
                        this.props.tokens.get(toToken).symbol
                      } ${optMessage}`,
                    );
                  }
                  await this.props.updateBalances();
                  await this.props.user.updateCSHBKBalance();
                } catch (error) {
                  console.error('Swap error', error);
                  const txHash = error?.txHash;
                  this.props.notify(
                    'errorWithHash',
                    `Error swapping ${fromInput} ${this.props.tokens.get(fromToken).symbol} for ${
                      this.props.tokens.get(toToken).symbol
                    }: ${error.message} ${txHash ? '\nTx Hash: ' + txHash : ''}`,
                    undefined,
                    txHash,
                  );
                  return;
                } finally {
                  this.setState({
                    loadingSwap: false,
                  });
                }
                await this.props.onSetTokens(this.props.selectedToken0, this.props.selectedToken1, true);
                this.setState({
                  toInput: '',
                  fromInput: '',
                  isFromEstimated: false,
                  isToEstimated: false,
                });
              }}
            >
              {buttonMessage}
            </Button>
          )}
        </Container>
        {!hidePriceRow && (
          <div style={this.state.loadingSwap ? { opacity: '0.4' } : {}}>
            <AdditionalInfo
              fromToken={this.props.tokens.get(this.state.fromToken).symbol}
              toToken={this.props.tokens.get(this.state.toToken).symbol}
              liquidityProviderFee={this.state.commission * price}
              priceImpact={this.state.priceImpact}
              minimumReceived={new BigNumber(this.state.toInput).multipliedBy(
                new BigNumber(1).minus(this.state.slippageTolerance),
              )}
              pairAddress={this.props.selectedPair?.contract_addr}
              expectedCSHBK={this.state.expectedCSHBK}
              isSupported={this.props.isSupported}
              /*
              maximumSold={
                this.state.isFromEstimated
                  ? Number(this.state.fromInput) *
                    (1 + this.state.slippageTolerance)
                  : null
              }
              */
            />
          </div>
        )}
      </>
    );
  }

  async getHops(bestRoute: string[]) {
    return (
      await Promise.all(
        bestRoute.map(async (fromToken, idx) => {
          if (idx === bestRoute.length - 1) {
            // destination token
            return null;
          }

          const hop: {
            from_token:
              | {
                  snip20: {
                    address: string;
                    code_hash: string;
                  };
                }
              | 'scrt';
            pair_address: string;
            pair_code_hash: string;
            expected_return?: string;
          } = {
            from_token: null,
            pair_address: null,
            pair_code_hash: null,
          };

          const toToken = bestRoute[idx + 1];
          const pair: SwapPair = this.props.pairs.get(`${fromToken}${SwapPair.id_delimiter}${toToken}`);

          if (fromToken === 'uscrt') {
            hop.from_token = 'scrt';
          } else {
            hop.from_token = {
              snip20: {
                address: fromToken,
                code_hash: (pair.asset_infos.find(a => (a.info as Token)?.token?.contract_addr === fromToken)
                  .info as Token).token.token_code_hash,
              },
            };
          }

          hop.pair_address = pair.contract_addr;
          hop.pair_code_hash = await SwapPair.getPairCodeHash(hop.pair_address, this.props.secretjs);

          return hop;
        }),
      )
    ).filter(x => x !== null);
  }

  private setToAmount(value: string) {
    if (value === '' || Number(value) === 0) {
      this.setState({
        toInput: value,
        isToEstimated: false,
        fromInput: '',
        isFromEstimated: false,
        spread: 0,
        commission: 0,
        priceImpact: 0,
      });
      return;
    }

    this.setState(
      {
        toInput: value,
        fromInput: '',
        isToEstimated: false,
        isFromEstimated: true,
      },
      () => this.updateInputs(),
    );
  }

  private setFromAmount = (value: string) => {
    
    if (value === '' || Number(value) === 0) {
      this.setState({
        fromInput: value,
        isFromEstimated: false,
        toInput: '',
        isToEstimated: false,
        spread: 0,
        commission: 0,
        priceImpact: 0,
      });
      return;
    }

    this.setState(
      {
        fromInput: value,
        toInput: '',
        isFromEstimated: false,
        isToEstimated: true,
      },
      () => this.updateInputs(),
    );
  };

  private async setToToken(identifier: string) {
    const setStateCallback = async () => {
      this.setState({ bestRoute: null, allRoutesOutputs: [] });

      await this.props.onSetTokens(this.state.fromToken, this.state.toToken);

      if (this.state.fromToken) {
        this.updateInputs();
      }
    };

    if (identifier === this.state.fromToken) {
      // switch
      this.setState(
        {
          toToken: identifier,
          fromToken: this.state.toToken,
          isFromEstimated: this.state.isToEstimated,
          isToEstimated: this.state.isFromEstimated,
          fromInput: this.state.toInput,
          toInput: this.state.fromInput,
        },
        () => setStateCallback(),
      );
    } else {
      this.setState(
        {
          toToken: identifier,
          toInput: '',
          isToEstimated: true,
          isFromEstimated: false,
        },
        () => setStateCallback(),
      );
    }
  }

  private async setFromToken(identifier: string) {
    const setStateCallback = async () => {
      this.setState({ bestRoute: null, allRoutesOutputs: [] });

      await this.props.onSetTokens(this.state.fromToken, this.state.toToken);

      if (this.state.toToken) {
        this.updateInputs();
      }
    };

    if (identifier === this.state.toToken) {
      // switch
      this.setState(
        {
          fromToken: identifier,
          toToken: this.state.fromToken,
          isFromEstimated: this.state.isToEstimated,
          isToEstimated: this.state.isFromEstimated,
          fromInput: this.state.toInput,
          toInput: this.state.fromInput,
        },
        () => setStateCallback(),
      );
    } else {
      this.setState(
        {
          fromToken: identifier,
          fromInput: '',
          isFromEstimated: true,
          isToEstimated: false,
        },
        () => setStateCallback(),
      );
    }
  }
}
