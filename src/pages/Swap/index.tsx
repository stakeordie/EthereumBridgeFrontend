import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Link,
  useLocation
} from "react-router-dom";
import { Box } from 'grommet';
import * as styles from '../FAQ/faq-styles.styl';
import { PageContainer } from 'components/PageContainer';
import { BaseContainer } from 'components/BaseContainer';
import { useStores } from 'stores';
import { fixUnlockToken, sleep, unlockToken } from 'utils';
import { UserStoreEx } from 'stores/UserStore';
import { observer } from 'mobx-react';
import { SwapTab } from './SwapTab';
import { BigNumber } from 'bignumber.js';
import { getNativeBalance, unlockJsx, wrongViewingKey } from './utils';
import { GetSnip20Params, notify } from '../../blockchain-bridge';
import { loadTokensFromList } from '../TokenModal/LocalTokens/LoadTokensFromList';
import { ISecretSwapPair, ITokenInfo } from '../../stores/interfaces';
import { Tokens } from '../../stores/Tokens';
import { getSymbolsFromPair } from '../../blockchain-bridge/scrt/swap';
import { SwapToken, SwapTokenMap, TokenMapfromITokenInfo } from '../TokenModal/types/SwapToken';
import LocalStorageTokens from '../../blockchain-bridge/scrt/CustomTokens';
import cogoToast from 'cogo-toast';
import { pairIdFromTokenIds, PairMap, SwapPair } from '../TokenModal/types/SwapPair';
import { NativeToken, Token,Asset } from '../TokenModal/types/trade';
import { KeplrButton } from '../../components/Secret/KeplrButton';
import { SecretSwapPairs } from 'stores/SecretSwapPairs';
import Graph from 'node-dijkstra';
import { SecretSwapPools } from 'stores/SecretSwapPools';
import * as style from './styles.styl'
import { Cashback } from './Cashback';

export const SwapPageWrapper = observer(() => {
  // SwapPageWrapper is necessary to get the user store from mobx 🤷‍♂️
  let { user, tokens, secretSwapPairs, secretSwapPools } = useStores();

  function useQuery() {
    return new URLSearchParams(useLocation().search);
  }
  let query = useQuery();

  useEffect(() => {
    
    secretSwapPairs.init({
      isLocal: true,
      sorter: 'none',
      pollingInterval: 60000,
    });
    secretSwapPairs.fetch();

    if (process.env.ENV !== 'DEV') {
      tokens.init();

      secretSwapPools.init({
        isLocal: true,
        sorter: 'none',
        pollingInterval: 20000,
      });
      secretSwapPools.fetch();
    }
  }, []);

  if (process.env.ENV === 'DEV') {
    tokens = { allData: JSON.parse(process.env.AMM_TOKENS) } as Tokens;
    secretSwapPairs = { allData: JSON.parse(process.env.AMM_PAIRS) } as SecretSwapPairs;
    secretSwapPools = null;
  }

  return <SwapRouter user={user} tokens={tokens} pairs={secretSwapPairs} pools={secretSwapPools} query={query}/>;
});

export class SwapRouter extends React.Component<
  {
    user: UserStoreEx;
    tokens: Tokens;
    pairs: SecretSwapPairs;
    pools: SecretSwapPools;
    query: URLSearchParams;
  },
  {
    allTokens: SwapTokenMap;
    balances: { [symbol: string]: BigNumber | JSX.Element };
    pairs: PairMap;
    selectedPair: SwapPair | undefined;
    selectedToken0: string;
    selectedToken1: string;
    queries: string[];
    routerSupportedTokens: Set<string>;
    routerOnline: boolean;
    routingGraph: { [token0: string]: { [token1: string]: number } };
    selectedPairRoutes: string[][];
    isSupported: boolean;
    keplrConnected: boolean;
  }
> {
  private symbolUpdateHeightCache: { [symbol: string]: number } = {};
  private ws: WebSocket;
  private pairRefreshInterval;

  constructor(props: { user: UserStoreEx; tokens: Tokens; pairs: SecretSwapPairs; pools: SecretSwapPools ;query:URLSearchParams}) {
    super(props);
    this.state = {
      allTokens: new Map<string, SwapToken>(),
      balances: {},
      pairs: new Map<string, SwapPair>(),
      selectedPair: undefined,
      //Getting parameters as default 
      //in ComponentDidMount we check if they exist or not
      selectedToken0: this.props.query.get('inputCurrency') || process.env.SSCRT_CONTRACT,
      selectedToken1: this.props.query.get('outputCurrency') || '',
      queries: [],
      routerSupportedTokens: new Set(),
      routerOnline: false,
      routingGraph: {},
      selectedPairRoutes: [],
      keplrConnected: undefined,
      isSupported:false,
    };
  }
  existToken(address :string):boolean{
    const token = Array.from(this.props.tokens.allData).find((token)=>token.dst_address == address)
    if(token || address == 'uscrt' || address == process.env.SSCRT_CONTRACT){
      return true;
    }else{
      return false
    } 
  }
  onHashChange = () => {
    this.forceUpdate();
  };

  symbolFromAddress = (identifier: string) => {
    return this.state.allTokens.get(identifier)?.symbol;
  };

  async componentDidUpdate(previousProps, prevState) {
    if (previousProps.tokens.allData.length !== this.props.tokens.allData.length) {
      console.log('updated pairs');
      await this.updateTokens();
    }

    if (previousProps.pairs.allData.length !== this.props.pairs.allData.length) {
      console.log('updated pairs');
      await this.updatePairs();
    }

    const newBalances = {};
    let updateState = false;
    const { selectedToken0, selectedToken1 } = this.state;

    // this happens 3 times since setting state takes time (or maybe because componentDidUpdate gets called 3 times when
    // keplr connects. Either way this should be fine as it doesn't happen very often
    if (this.props.user.secretjs && prevState.keplrConnected === false) {
      newBalances[selectedToken0] = await this.refreshTokenBalance(selectedToken0);
      newBalances[selectedToken1] = await this.refreshTokenBalance(selectedToken1);
      this.setState(currentState => ({ balances: { ...currentState.balances, ...newBalances }, keplrConnected: true }));
    }

    if (selectedToken0 !== prevState.selectedToken0 && selectedToken0 !== prevState.selectedToken1) {
      updateState = true;
      newBalances[selectedToken0] = await this.refreshTokenBalance(selectedToken0);
    }

    if (selectedToken1 !== prevState.selectedToken0 && selectedToken1 !== prevState.selectedToken1) {
      updateState = true;
      newBalances[selectedToken1] = await this.refreshTokenBalance(selectedToken1);
    }



    if (updateState) {
      this.setState(currentState => ({ balances: { ...currentState.balances, ...newBalances } }));
    }
  }
  async updateBalances (){
    try {
      console.log("Updating balances")
      const newBalances = {};
      const { selectedToken0, selectedToken1 } = this.state;
      newBalances[selectedToken1] = await this.refreshTokenBalance(selectedToken1);
      newBalances[selectedToken0] = await this.refreshTokenBalance(selectedToken0);
      this.setState(currentState => ({ balances: { ...currentState.balances, ...newBalances } }));
      await this.props.user.updateScrtBalance();
    } catch (error) {
      console.error(error)
    }
  }

  async componentDidMount() {
    window.onhashchange = this.onHashChange;
    window.addEventListener('storage', this.updateTokens);
    window.addEventListener('updatePairsAndTokens', this.updatePairs);

    await this.updateTokens();

    while (this.props.pairs.isPending || this.props.tokens.isPending) {
      await sleep(100);
    }

    let balanceToken0: { [symbol: string]: BigNumber | JSX.Element } = {
      [this.state.selectedToken0]: new BigNumber('0'),
    };
    let balanceToken1: { [symbol: string]: BigNumber | JSX.Element } = {
      [this.state.selectedToken1]: new BigNumber('0'),
    };

    let selectedToken0,selectedToken1;
    const existsToken0 = this.existToken(this.state.selectedToken0);
    const existsToken1 = this.existToken(this.state.selectedToken1);

    let keplrConnected = false;
    // wait for 1 second before deciding that Keplr won't connect
    for (let i = 0; i < 10; i++) {
      if (this.props.user.secretjs) {
        //Checked if the input and output params exist
        //if not selectedToken0 equal SCRT
        //selectedToken1 is empty
        if(existsToken0){
          balanceToken0  = { [this.state.selectedToken0]: await this.refreshTokenBalance(this.state.selectedToken0) };
          selectedToken0 = this.state.selectedToken0
        }else{
          selectedToken0=process.env.SSCRT_CONTRACT
        }

        if(existsToken1){
          balanceToken1 = { [this.state.selectedToken1]: await this.refreshTokenBalance(this.state.selectedToken1) };
          selectedToken1 = this.state.selectedToken1
        }else{
          selectedToken1 =''
        }

        keplrConnected = true;
        break;
      }
      await sleep(100);
    }
    this.setState({ balances: { ...this.state.balances, ...balanceToken0 ,...balanceToken1}, keplrConnected,selectedToken1,selectedToken0});
    await this.updatePairs();

    if (process.env.ENV !== 'DEV') {
      while (this.state.pairs.size === 0) {
        await sleep(200);
      }
      this.pairRefreshInterval = setInterval(this.reloadPairData(), 1000);
    }
    while (true) {
      try {
        const routerSupportedTokens: Set<string> = new Set(
          await this.props.user.secretjs.queryContractSmart(process.env.AMM_ROUTER_CONTRACT, {
            supported_tokens: {},
          }),
        );
        routerSupportedTokens.add('uscrt');
        this.setState({ routerSupportedTokens, routerOnline: true }, this.updateRoutingGraph);
        //Updating pair when page has parameters
        //This setCurrenPair updates pair's route
        if(existsToken0 && existsToken1){
          await this.setCurrentPair(this.state.selectedToken0,this.state.selectedToken1)
        }
        return;
      } catch (error) {
        console.log('Retrying to get supported tokens from router');
        await sleep(3000);
      }
    }
  }

  private reloadPairData() {
    return () => {
      const balances = {};
      for (const pool of this.props.pools.allData) {
        let id0: string;
        let id1: string;
        if ('native_token' in pool.assets[0].info) {
          id0 = pool.assets[0].info.native_token.denom;
        } else {
          id0 = pool.assets[0].info.token.contract_addr;
        }
        if ('native_token' in pool.assets[1].info) {
          id1 = pool.assets[1].info.native_token.denom;
        } else {
          id1 = pool.assets[1].info.token.contract_addr;
        }

        const pair = this.state.pairs.get(`${id0}${SwapPair.id_delimiter}${id1}`);

        if (!pair) {
          // pairs or tokens aren't loaded yet
          continue;
        }

        if (
          !new BigNumber(this.state.balances[`${pair.liquidity_token}-total-supply`] as any).isEqualTo(
            new BigNumber(pool.total_share),
          )
        ) {
          balances[`${pair.liquidity_token}-total-supply`] = new BigNumber(pool.total_share);
        }

        const pool0 = `${id0}-${pair.identifier()}`;
        const pool0Amount = new BigNumber(pool.assets[0].amount);

        if (!new BigNumber(this.state.balances[pool0] as any).isEqualTo(pool0Amount)) {
          balances[pool0] = pool0Amount;
        }

        const pool1 = `${id1}-${pair.identifier()}`;
        const pool1Amount = new BigNumber(pool.assets[1].amount);

        if (!new BigNumber(this.state.balances[pool1] as any).isEqualTo(pool1Amount)) {
          balances[pool1] = pool1Amount;
        }
      }
      if (Object.keys(balances).length > 0) {
        this.setState(currentState => ({ balances: { ...currentState.balances, ...balances } }));
      }
    };
  }

  refreshBalances = async ({ pair, tokens, height }: { tokens: string[]; pair?: SwapPair; height?: number }) => {
    if (!height) {
      height = await this.props.user.secretjs.getHeight();
    }

    //console.log(`Hello from refreshBalances for height: ${height}`);
    const tokenBalances = (
      await Promise.all(
        tokens.map(async s => {
          console.log(`$$$$$$$$$$ refreshing ${s}`);
          return { [s]: await this.refreshTokenBalance(s, height) };
        }),
      )
    ).reduce((balances, value) => {
      return { ...balances, ...value };
    }, {});

    // these will return a list of promises, which we will flatten then map to a single object
    const balanceTasks = [];
    if (pair) {
      balanceTasks.push(this.refreshLpTokenBalance(pair));
      if (process.env.ENV === 'DEV') {
        balanceTasks.push(this.refreshPoolBalance(pair));
      }
    }

    //console.log('refreshing balances..');

    const results = await Promise.all([...balanceTasks]);

    //console.log(`balances: ${JSON.stringify(results)}`);

    // flatten array to a single object
    const newObject = Object.assign(
      {},
      ...results.flat().map(item => ({ [Object.keys(item)[0]]: Object.values(item)[0] })),
    );

    this.setState(currentState => ({
      balances: {
        ...currentState.balances,
        ...newObject,
        ...tokenBalances,
      },
    }));

    return newObject;
  };

  private async refreshPoolBalance(pair: SwapPair) {
    const balances = [];

    if (process.env.ENV === 'DEV') {
      try {
        let res: {
          assets: Array<{ amount: string; info: Token | NativeToken }>;
          total_share: string;
        } = await this.props.user.secretjs.queryContractSmart(pair.contract_addr, {
          pool: {},
        });

        const amount0 = new BigNumber(res.assets[0].amount);
        const amount1 = new BigNumber(res.assets[1].amount);
        if ('native_token' in res.assets[0].info) {
          balances.push({
            [`${res.assets[0].info.native_token.denom}-${pair.identifier()}`]: amount0,
          });
        } else {
          balances.push({
            [`${res.assets[0].info.token.contract_addr}-${pair.identifier()}`]: amount0,
          });
        }
        if ('native_token' in res.assets[1].info) {
          balances.push({
            [`${res.assets[1].info.native_token.denom}-${pair.identifier()}`]: amount1,
          });
        } else {
          balances.push({
            [`${res.assets[1].info.token.contract_addr}-${pair.identifier()}`]: amount1,
          });
        }
      } catch (error) {
        notify('error', `Error getting pools' balances for ${pair.identifier()}: ${error.message}`);
      }
    }

    return balances;
  }

  private async refreshTokenBalance(tokenIdentifier: string, height?: number): Promise<JSX.Element | BigNumber> {
    if (height && height <= this.symbolUpdateHeightCache[tokenIdentifier]) {
      //console.log(`${tokenSymbol} already fresh for height ${height}`);
      return undefined;
    }

    if (height) {
      this.symbolUpdateHeightCache[tokenIdentifier] = height;
    }

    let userBalance; //balance.includes(unlockToken)

    if ((tokenIdentifier === 'uscrt') && this.state.routerOnline) {
      userBalance = await getNativeBalance(this.props.user.address, this.props.user.secretjs);
      //this.props.user.balanceSCRT = userBalance.toString();
      return userBalance;
    }else if(tokenIdentifier === 'uscrt'){
      return new Promise((resolve,reject)=>{resolve(new BigNumber(0))});
    }

    let balance = await this.props.user.getSnip20Balance(tokenIdentifier);

    userBalance = this.displayedBalance(balance, tokenIdentifier);

    return userBalance;
  }

  private displayedBalance(balance: string, tokenIdentifier: string) {
    if (balance === unlockToken) {
      return unlockJsx({
        onClick: async () => {
          try {
            await this.props.user.keplrWallet.suggestToken(this.props.user.chainId, tokenIdentifier);
            // TODO trigger balance refresh if this was an "advanced set" that didn't
            // result in an on-chain transaction
            const a = await this.refreshTokenBalance(tokenIdentifier);
            const b = {
              [tokenIdentifier]:a
            }
            this.setState(currentState => ({ balances: { ...currentState.balances, ...b } })); 
            await this.props.user.updateScrtBalance();
          } catch (error) {
            console.error("Failed")
          }
        },
      });
    } else if (balance === fixUnlockToken) {
      return wrongViewingKey;
    } else {
      return new BigNumber(balance);
    }
  }

  private async refreshLpTokenBalance(pair: SwapPair) {
    let returnBalances = [];

    const pairSymbol = pair.identifier();
    console.log('Refresh LP token for', pairSymbol);
    // update my LP token balance
    const lpTokenSymbol = `LP-${pairSymbol}`;
    const lpTokenAddress = pair.liquidity_token;
    if (process.env.ENV === 'DEV') {
      let lpTotalSupply = new BigNumber(0);
      try {
        const result = await GetSnip20Params({
          address: pair.liquidity_token,
          secretjs: this.props.user.secretjsSend,
        });
        lpTotalSupply = new BigNumber(result.total_supply);
        returnBalances.push({
          [`${lpTokenAddress}-total-supply`]: lpTotalSupply,
        });
      } catch (error) {
        console.error(`Error trying to get LP token total supply of ${pairSymbol}`, pair, error);
        return [];
      }
    }

    let balanceResult = await this.props.user.getSnip20Balance(lpTokenAddress);
    let lpBalance;
    if (balanceResult === unlockToken) {
      balanceResult = unlockJsx({
        onClick: async () => {
          await this.props.user.keplrWallet.suggestToken(this.props.user.chainId, lpTokenAddress);
          // TODO trigger balance refresh if this was an "advanced set" that didn't
          // result in an on-chain transaction
          await this.refreshLpTokenBalance(pair);
          await this.props.user.updateScrtBalance();
        },
      });
      lpBalance = balanceResult;
    } else if (balanceResult === fixUnlockToken) {
      lpBalance = wrongViewingKey;
    } else {
      lpBalance = new BigNumber(balanceResult);
    }

    returnBalances.push({
      [lpTokenSymbol]: lpBalance,
    });

    return returnBalances;
  }

  async componentWillUnmount() {
    //this.props.user.websocketInit();

    // if (this?.ws) {
    //   while (this.ws.readyState === WebSocket.CONNECTING) {
    //     await sleep(100);
    //   }
    //
    //   if (this.ws.readyState === WebSocket.OPEN) {
    //     this.ws.close(1000 /* Normal Closure */, 'See ya');
    //   }
    // }
    if (process.env.ENV !== 'DEV') {
      clearInterval(this.pairRefreshInterval);
    }
    window.onhashchange = null;
    window.removeEventListener('storage', this.updateTokens);
    window.removeEventListener('updatePairsAndTokens', this.updatePairs);
  }

  updateTokens = async () => {
    //console.log(...this.props.tokens.allData);
    const tokens: ITokenInfo[] = [...(await this.props.tokens.tokensUsage('SWAP'))];

    // convert to token map for swap
    const swapTokens: SwapTokenMap = TokenMapfromITokenInfo(tokens); // [...TokenMapfromITokenInfo(tokens), ...loadTokensFromList('secret-2')];

    // load custom tokens
    const customTokens = LocalStorageTokens.get();
    customTokens.forEach(t => {
      swapTokens.set(t.identifier, t);
    });

    //load hardcoded tokens (scrt, atom, etc.)
    for (const t of loadTokensFromList(this.props.user.chainId || process.env.CHAIN_ID)) {
      swapTokens.set(t.identifier, t);
    }

    this.setState({ allTokens: swapTokens });
    if (!this.state.routerOnline) {
      this.setState(
        { routerSupportedTokens: new Set(swapTokens.keys()), routerOnline: false },
        this.updateRoutingGraph,
      );
    }

    return swapTokens;
  };

  setCurrentPair = async (token0: string, token1: string) => {
    const selectedPair: SwapPair = this.state.pairs.get(pairIdFromTokenIds(token0, token1));
    const isSupported = await this.props.user.getIsSupported(selectedPair?.contract_addr)
    ///test --
    window.history.replaceState({},"",`swap?inputCurrency=${token0}&outputCurrency=${token1}`)
    //
    while (Object.keys(this.state.routingGraph).length === 0) {
      await sleep(100);
    }

    const routes: string[][] = [];
    let graph = JSON.parse(JSON.stringify(this.state.routingGraph)); // deep copy
    try {
      while (true) {
        const dijkstra = new Graph(graph);
        const route: string[] = dijkstra.path(token0, token1) ?? [];

        if (route.length < 2) {
          break;
        }
        routes.push(route);

        delete graph[route[0]][route[1]];
        delete graph[route[1]][route[0]];
      }
    } catch (e) {
      console.error('Error computing selectedPairRoutes:', e.message);
    }
    this.setState({
      selectedPair: selectedPair,
      selectedPairRoutes: routes,
      isSupported:isSupported
    });

    //this.refreshBalances({ tokens: [token0, token1], pair: selectedPair });
  };

  updatePairs = async () => {
    // gather tokens from our list, and from local storage
    const tokens = await this.updateTokens();

    while (this.props.pairs.allData.length === 0) {
      await sleep(100);
    }

    let pairs: ISecretSwapPair[] = Array.from(this.props.pairs.allData);
    // filter all pairs that aren't known tokens
    pairs = pairs.filter(p => {
      const pairSymbols = getSymbolsFromPair(p);
      for (const s of pairSymbols) {
        if (!tokens.has(s)) {
          return false;
        }
      }

      return !(pairSymbols.includes('uscrt') && !pairSymbols.includes(process.env.SSCRT_CONTRACT));
    });

    const newPairs: PairMap = new Map<string, SwapPair>();

    for (const p of pairs) {
      try {
        const newPair = SwapPair.fromPair(p, tokens);
        newPairs.set(newPair.identifier(), newPair);
        newPairs.set(
          newPair
            .identifier()
            .split(SwapPair.id_delimiter)
            .reverse()
            .join(SwapPair.id_delimiter),
          newPair,
        );
      } catch (error) {
        console.error(error);
      }
    }

    this.setState({ pairs: newPairs }, this.updateRoutingGraph);
  };

  updateRoutingGraph = () => {
    const { pairs, routerSupportedTokens } = this.state;

    const graph = {};
    for (const pair of new Set(pairs.values())) {
      const [token0, token1] = pair.assetIds();
      if (!routerSupportedTokens.has(token0) || !routerSupportedTokens.has(token1)) {
        continue;
      }

      if (!(token0 in graph)) {
        graph[token0] = {};
      }
      if (!(token1 in graph)) {
        graph[token1] = {};
      }

      graph[token0][token1] = 1;
      graph[token1][token0] = 1;
    }

    this.setState({ routingGraph: graph });
  };


  render() {
    // const isSwap = window.location.hash === '#Swap';
    // const isProvide = window.location.hash === '#Provide';
    // const isWithdraw = window.location.hash === '#Withdraw';
    // const isPools = window.location.hash === '#Pool';
    // const isHistory = window.location.hash === '#History';

    // if (!isSwap && !isProvide && !isWithdraw && !isPools && !isHistory) {
    //   window.location.hash = 'Swap';
    //   return <></>;
    // }
    return (
      <BaseContainer>
        <PageContainer>
          <Box
            className={styles.faqContainer}
            pad={{ horizontal: 'large', top: 'large' }}
            style={{ alignItems: 'center' }}
          >
            <Box
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
              pad={{ bottom: 'medium' }}
              className={style.box_container}
            >
              {/* <KeplrButton /> */}
                <SwapTab
                  user={this.props.user}
                  secretjs={this.props.user.secretjs}
                  secretjsSender={this.props.user.secretjsSend}
                  tokens={this.state.allTokens}
                  balances={this.state.balances}
                  selectedPair={this.state.selectedPair}
                  selectedToken0={this.state.selectedToken0}
                  selectedToken1={this.state.selectedToken1}
                  selectedPairRoutes={this.state.selectedPairRoutes}
                  notify={notify}
                  onSetTokens={async (token0, token1) => await this.onSetTokens(token0, token1)}
                  refreshPools={this.refreshBalances}
                  secretAddress={this.props.user.address}
                  pairs={this.state.pairs}
                  isLoadingSupportedTokens={this.state.routerSupportedTokens.size === 0}
                  updateBalances={this.updateBalances.bind(this)}
                  isSupported={this.state.isSupported}
                />
              {/* {isProvide && (
                <ProvideTab
                  user={this.props.user}
                  secretjs={this.props.user.secretjs}
                  secretjsSender={this.props.user.secretjsSend}
                  tokens={this.state.allTokens}
                  balances={this.state.balances}
                  pairs={this.state.pairs}
                  selectedPair={this.state.selectedPair}
                  selectedToken0={this.state.selectedToken0}
                  selectedToken1={this.state.selectedToken1}
                  notify={notify}
                  onSetTokens={async (token0, token1) => await this.onSetTokens(token0, token1)}
                />
              )}
              {isWithdraw && (
                <WithdrawTab
                  user={this.props.user}
                  secretjs={this.props.user.secretjs}
                  secretjsSender={this.props.user.secretjsSend}
                  tokens={this.state.allTokens}
                  balances={this.state.balances}
                  pairs={this.state.pairs}
                  notify={notify}
                  updateToken={async (pair: SwapPair) => {
                    //this.registerPairQueries(pair);
                    await this.refreshBalances({
                      pair,
                      tokens: pair.assetIds(),
                    });
                  }}
                  onCloseTab={pair => {
                    //this.unSubscribePair(pair);
                  }}
                />
              )}
              {/* {isHistory && (
                <HistoryTab
                  user={this.props.user}
                  secretjs={this.props.user.secretjs}
                  tokens={this.state.allTokens}
                  balances={this.state.balances}
                  pairs={this.state.pairs}
                  notify={notify}
                  updateToken={async (pair: SwapPair) => {
                    this.registerPairQueries(pair);
                    await this.refreshBalances({
                      pair,
                      tokens: pair.assetIds(),
                    });
                  }}
                  onCloseTab={pair => {
                    this.unSubscribePair(pair);
                  }}
                />
              )} */}
            </Box>
            {/* <SwapFooter />
            <BetaWarning secretjs={this.props.user.secretjsSend} /> */}
          </Box>
        </PageContainer>
      </BaseContainer>
    );
  }

  private onSetTokens = async (token0, token1) => {
    this.setState(currentState => ({
      ...currentState,
      selectedToken0: token0,
      selectedToken1: token1,
    }));
    if (token0 && token1) {
      await this.setCurrentPair(token0, token1);
    }
  };
}
