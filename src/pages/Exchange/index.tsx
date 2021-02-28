import * as React from 'react';
import { Box } from 'grommet';
import * as styles from './styles.styl';
import { Form, Input, isRequired, MobxForm, NumberInput } from 'components/Form';
import { inject, observer } from 'mobx-react';
import { IStores } from 'stores';
import { Button, Icon, Text, Title } from 'components/Base';
import { formatWithSixDecimals, moreThanZero, unlockToken } from 'utils';
import { Spinner } from 'ui/Spinner';
import { EXCHANGE_STEPS } from '../../stores/Exchange';
import { Details } from './Details';
import { AuthWarning } from '../../components/AuthWarning';
import { Steps } from './Steps';
import { validateTokenInput, validateAmountInput, validateAddressInput } from './validations';
import { autorun, computed, transaction } from 'mobx';
import { EXCHANGE_MODE, TOKEN } from 'stores/interfaces';
import cn from 'classnames';
import { ERC20Select } from './ERC20Select';
import { ConsoleView } from 'react-device-detect';

export interface ITokenInfo {
  symbol: string;
  image: any;
  maxAmount: string;
  minAmount: string;
}

type NetworkTemplateInterface = {
  name: string,
  wallet: string
  tokenSymbol: string
  amount: string;
}

type State = { 
  selectedToken: ITokenInfo, 
  tokenError: string, 
  amountError: string, 
  addressError: string, 
  tokenApproved: any
};
@inject('user', 'exchange', 'actionModals', 'userMetamask', 'routing')
@observer
export class Exchange extends React.Component<
  Pick<IStores, 'user'> &
    Pick<IStores, 'exchange'> &
    Pick<IStores, 'routing'> &
    Pick<IStores, 'actionModals'> &
    Pick<IStores, 'tokens'> &
    Pick<IStores, 'userMetamask'> , State
> {
  formRef: MobxForm;

  constructor(props) {
    super(props);
    this.state = { 
      selectedToken: {      
        image: "",
        symbol: "",
        minAmount: "",
        maxAmount: ""
      }, 
      amountError: "", 
      addressError: "", 
      tokenError: "", 
      tokenApproved: false,
    };

    autorun(() => {
      const { exchange } = this.props;

      if (exchange.token && exchange.mode) {
        if (this.formRef) {
          this.formRef.resetTouched();
          this.formRef.resetErrors();
        }
      }
    });
  }

  onClickHandler = async (needValidate: boolean, callback: () => void) => {
    const { actionModals, user, userMetamask, exchange } = this.props;
    
    if (!user.isAuthorized) {
      if (exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH) {
        if (!user.isKeplrWallet) {
          return actionModals.open(() => <AuthWarning />, {
            title: '',
            applyText: 'Got it',
            closeText: '',
            noValidation: true,
            width: '500px',
            showOther: true,
            onApply: () => {
              return Promise.resolve();
            },
          });
        } else {
          await user.signIn();
        }
      }
    }

    if (!userMetamask.isAuthorized && exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT) {
      if (!userMetamask.isAuthorized) {
        await userMetamask.signIn(true);
      }
    }

    if(!needValidate) return callback()

    const tokenError = validateTokenInput(this.state.selectedToken)
    const amountError = validateAmountInput(exchange.transaction.amount, this.state.selectedToken)
    const addressError = validateAddressInput(exchange)
    this.setState({tokenError: "", amountError: "", addressError: ""})
    if(tokenError) return this.setState({tokenError})
    if(amountError) return this.setState({amountError})
    if(addressError) return this.setState({addressError})

    callback()

  };

  setTokenInfo(args: any) {
    const { user, exchange, userMetamask } = this.props;
    
    const token:ITokenInfo = {
      image: args.image,
      symbol: args.symbol,
      minAmount: "",
      maxAmount: ""
    }

    if(exchange.token === TOKEN.ERC20){

      if (!userMetamask.erc20TokenDetails) {
        token.maxAmount = "0"
        token.minAmount = "0"
      }

      token.maxAmount = exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH
        ? !user.snip20Balance || user.snip20Balance.includes(unlockToken)
          ? '0'
          : user.snip20Balance
        : userMetamask.erc20Balance
      token.minAmount = exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH
        ? user.snip20BalanceMin || '0'
        : userMetamask.erc20BalanceMin || '0'

    }

    if (exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH) {
      token.maxAmount = (!user.balanceToken['Ethereum'] || user.balanceToken['Ethereum'].includes(unlockToken))
        ? '0'
        : user.balanceToken['Ethereum']
      token.minAmount = user.balanceTokenMin['Ethereum'] || '0'
    } else {
      token.maxAmount = userMetamask.ethBalance,
      token.minAmount = userMetamask.ethBalanceMin || '0'
    }
    console.log('token', token)

    this.setState({selectedToken: token})
  }


  render() {
    const { exchange, routing, user, userMetamask, tokens } = this.props;
    const { selectedToken, tokenApproved, tokenError, amountError, addressError } = this.state;

    const NTemplate1: NetworkTemplateInterface = {
      name: exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? "Ethereum" : "Secret Network", 
      wallet: exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? "Metamask" : "Keplr", 
      tokenSymbol: "No Token Selected", 
      amount: exchange.transaction.amount
    }

    const NTemplate2: NetworkTemplateInterface = {
      name: exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? "Secret Network" : "Ethereum", 
      wallet: exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? "Keplr" : "Metamask", 
      tokenSymbol: "No Token Selected", 
      amount: exchange.transaction.amount
    }

    const toApprove = 
      !tokenApproved && 
      Number(exchange.transaction.amount) > 0 && 
      selectedToken &&
      selectedToken.symbol !== "ETH" &&
      exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT

    const readyToSend = 
      validateAddressInput(exchange) === "" && 
      validateTokenInput(selectedToken) === "" &&
      validateAmountInput(exchange.transaction.amount, selectedToken)  === ""

    if(selectedToken.symbol){

      NTemplate1.tokenSymbol = 
        exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? 
          selectedToken.symbol : 
          `Secret ${selectedToken.symbol}`

      NTemplate2.tokenSymbol = 
        exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? 
          `Secret ${selectedToken.symbol}` : 
          selectedToken.symbol
    }

    let icon = () => <Icon style={{ width: 50 }} glyph="RightArrow" />;
    let description = 'Approval';
    const Status = () => (
      <Box
        direction="column"
        align="center"
        justify="center"
        fill={true}
        pad="medium"
        style={{ background: '#dedede40' }}
      >
        {icon()}
        <Box
          className={styles.description}
          margin={{ top: 'medium' }}
          pad={{ horizontal: 'small' }}
          style={{ width: '100%' }}
        >
          <Text style={{ textAlign: 'center' }}>{description}</Text>
          <Box margin={{ top: 'medium' }} style={{ width: '100%' }}>
            <Steps />
          </Box>
          {/*{exchange.txHash ? (*/}
          {/*  <a*/}
          {/*    style={{ marginTop: 10 }}*/}
          {/*    href={EXPLORER_URL + `/tx/${exchange.txHash}`}*/}
          {/*    target="_blank"*/}
          {/*  >*/}
          {/*    Tx id: {truncateAddressString(exchange.txHash)}*/}
          {/*  </a>*/}
          {/*) : null}*/}
        </Box>
      </Box>
    );

    const NetworkTemplate = observer((
      props: {
        name: string,
        wallet: string,
        tokenSymbol: string,
        amount: string,
      }) => (
      <Box direction="column" style={{minWidth: 230}}>
        <Box direction="row" align="start" margin={{ bottom: 'small' }}>
          <img className={styles.imgToken} src={props.name === "Ethereum" ? "/static/eth.svg" : "/static/scrt.svg"} />
          <Box direction="column" margin={{ left: 'xsmall' }}>
            <Title bold color={"#30303D"} margin={{ bottom: 'xxsmall' }}>{props.name}</Title>
            <Text size="medium" bold color={"#748695"}>{props.wallet}</Text>
          </Box>
        </Box>
        
        <Box pad="xsmall" direction="row" align="center" justify="start" style={{backgroundColor: "#E1FEF2", height: 44}}>
          {selectedToken.image && <img src={selectedToken.image} style={{ width: 20, marginRight: 10 }} alt={props.tokenSymbol} />}
          {selectedToken.symbol && <Text bold color="#30303D" size="medium">{props.amount === "" ? "0" : props.amount}</Text>}
          <Text bold margin={{ left: 'xxsmall' }} color="#748695" size="medium">{props.tokenSymbol}</Text>
        </Box>
      </Box>
    ));


    if(selectedToken) console.log(selectedToken.symbol)
    return (
      <Box fill direction="column"  className={styles.exchangeContainer}>
        <Box fill direction="row" justify="around" pad="xlarge" background="#e8e9eb" style={{position: 'relative'}}>
          <NetworkTemplate {...NTemplate1}/>
          <Box pad="small" style={{position: 'absolute', top: 'Calc(50% - 60px)', left: 'Calc(50% - 60px)'}}>
            <Icon size="60" glyph="Reverse"  onClick={async () => {
              exchange.transaction.amount = ""
              exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? 
                exchange.setMode(EXCHANGE_MODE.SCRT_TO_ETH) :   
                exchange.setMode(EXCHANGE_MODE.ETH_TO_SCRT)
            }}/>
          </Box>
          <NetworkTemplate {...NTemplate2}/>
        </Box>
        <Form ref={ref => (this.formRef = ref)} data={this.props.exchange.transaction} {...({} as any)} >
            <Box direction="row" fill={true} pad="xlarge">
              
              <Box direction="row" gap="2px" width="50%" margin={{ right: 'medium' }}>
                <Box width="100%" margin={{right: 'medium'}} direction="column">
                  <ERC20Select 
                    onSelectToken={async (tokenDisplayProps, value) => {
                      tokenDisplayProps.symbol === "ETH" ? exchange.setToken(TOKEN.ETH) : exchange.setToken(TOKEN.ERC20) 
                      exchange.transaction.amount = ""
                      this.setTokenInfo(tokenDisplayProps)
                      this.setState({ tokenError: "" })
                      
                      if (tokenDisplayProps.symbol === 'ETH') return
                      
                      try {
                        const approved = await exchange.isTokenApproved(value)
                        this.setState({ tokenApproved: approved })
                        await userMetamask.setToken(value, tokens);
        
                      } catch (e) {
                        this.setState({ tokenError: e.message })
                      }

                    }}
                  />
                  <Box margin={{top: 'medium'}} direction="column">
                    <Text style={{minHeight: 20}} color="red">{tokenError}</Text>
                  </Box>
                </Box>
                <Box direction="column" width="100%">

                  <Text bold size="large">Amount</Text>
                  <Box direction="row" style={{ height: 46, borderRadius: 4, border: "solid 1px #E7ECF7", marginTop: 8}} fill justify="between"  align="center">
                    <Box width="40%">
                      <NumberInput
                        name="amount"
                        type="decimal"
                        precision="6"
                        delimiter="."
                        placeholder="0"
                        margin={{bottom: "none"}}
                        value={exchange.transaction.amount}
                        style={{ borderColor: 'transparent', height: 44 }}
                        onChange={async (value) => {
                          exchange.transaction.amount = value
                          const error = validateAmountInput(value, selectedToken)
                          this.setState({amountError: error})
                        }}
                      />
                    </Box>

                    <Box direction="row" align="center" justify="end">
                      <Text bold className={styles.maxAmountInput}>{`/ ${selectedToken.maxAmount.replace(/,/g, '')}`}</Text>
                      <Button 
                        margin={{left: 'xsmall', right: 'xsmall'}} 
                        bgColor="#DEDEDE" 
                        pad="xxsmall"
                        onClick={() => {
                          exchange.transaction.amount = selectedToken.maxAmount.replace(/,/g, '')
                        }}
                      >
                          <Text size="xxsmall" bold>MAX</Text>
                      </Button>
                    </Box>
                  </Box>
                  <Box margin={{top: 'xxsmall'}} direction="row" align="center">
                      <Text bold size="small" margin={{right: 'xxsmall'}}>Minimum:</Text>
                      <Text size="small" color="#748695">
                        {`
                        ${formatWithSixDecimals(selectedToken.minAmount.replace(/,/g, ''))} 
                        ${exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH && exchange.token === TOKEN.ERC20 ? 'secret' : ''} 
                        ${selectedToken.symbol}
                        `}
                      </Text>
                  </Box>

                  <Box margin={{top: 'medium'}} direction="column">
                    <Text style={{minHeight: 20}} color="red">{amountError}</Text>
                  </Box>
                </Box>
              </Box>
                  
              <Box width="50%" direction="column" style={{ position:'relative' }}>
                  {((exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH && userMetamask.isAuthorized) || 
                    (exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT && user.isAuthorized))  && 
                    <Box
                      style={{right: 0,top: 0,position: 'absolute',color: 'rgb(0, 173, 232)',textAlign: 'right',}}
                      onClick={() => {
                        if(exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH) exchange.transaction.ethAddress = userMetamask.ethAddress
                        if(exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT) exchange.transaction.scrtAddress = user.address
                      }}
                    >
                      Use my address
                    </Box>
                  }
                  <Input
                    label={exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH ? "Destination ETH Address" : "Destination Secret Address"}
                    name={exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH ? "ethAddress" : "scrtAddress"}
                    style={{ width: '100%' }}
                    margin={{bottom: 'none'}}
                    placeholder="Receiver address"
                    value={exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH ? exchange.transaction.ethAddress : exchange.transaction.scrtAddress}
                    onChange={(value) => {
                      if(exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH) exchange.transaction.ethAddress = value
                      if(exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT) exchange.transaction.scrtAddress = value
                      const error = validateAddressInput(exchange)
                      this.setState({addressError: error})

                    }}
                  />
                  <Box margin={{top: 'medium'}} direction="column">
                    <Text style={{minHeight: 20}} color="red">{addressError}</Text>
                  </Box>
              </Box>
              
            </Box>

        </Form>

        {exchange.step.id === EXCHANGE_STEPS.CONFIRMATION ? <Details showTotal={true} /> : null}
        
        {exchange.step.id === EXCHANGE_STEPS.APPROVE_CONFIRMATION ? <Details showTotal={true} /> : null}

        {exchange.step.id === EXCHANGE_STEPS.SENDING ? (
          <Details>
            <Status />
          </Details>
        ) : null}

        {exchange.step.id === EXCHANGE_STEPS.RESULT ? (
          <Details>
            <Status />
          </Details>
        ) : null}

        {exchange.step.id === EXCHANGE_STEPS.CONFIRMATION ? (
          <>
            <Box
              direction="row"
              // justify="end"
              margin={{
                top: exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? 'medium' : '0px',
              }}
              fill={true}
            >
              {exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT && exchange.token === TOKEN.ERC20 ? (
                <Text color="Red500" style={{ textAlign: 'left' }}>
                  If this is the first time you're sending this token, you will be prompted to sign <b>two</b>{' '}
                  transactions.
                  <br />
                  Otherwise you will be prompted to sign <b>one</b> transaction.
                </Text>
              ) : (
                <Text color="Red500" style={{ textAlign: 'left' }}>
                  You will be prompted to sign <b>one</b> transaction
                </Text>
              )}
            </Box>
          </>
        ) : null}


        <Box direction="row" pad="large" justify="end" align="center">

          {exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT && selectedToken.symbol !== "" && selectedToken.symbol !== "ETH" && <Button
            disabled={!toApprove}
            bgColor={ "#00ADE8"}
            color={ "white"}
            style={{ minWidth: 180 }}
            onClick={() => {
              this.onClickHandler(true, exchange.onClickApprove);
            }}
          >
            {tokenApproved && Number(exchange.transaction.amount) > 0 ? 'Approved!' : 'Approve'}
          </Button>}

          <Button
            disabled={!readyToSend}
            margin={{left:'medium'}}
            bgColor={ readyToSend ? "#00ADE8" : "#E4E4E4"}
            color={ readyToSend ? "white" : "#748695"}
            style={{ minWidth: 300 }}
            onClick={() => {
              this.onClickHandler(true, exchange.onClickSend);
            }}
          >
            {exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? "Send to Secret Network" : "Send to Ethereum Blockchain"}
          </Button>
        </Box>
      </Box>

    )
  }
}
