import * as React from 'react';
import { Box } from 'grommet';
import * as styles from './styles.styl';
import { Form, Input, isRequired, isEthAddress, isSecretAddress, MobxForm, NumberInput } from 'components/Form';
import { inject, observer } from 'mobx-react';
import { IStores } from 'stores';
import { Button, Icon, Text, Title } from 'components/Base';
import { formatWithSixDecimals, moreThanZero, unlockToken } from 'utils';
import { Spinner } from 'ui/Spinner';
import { EXCHANGE_STEPS } from '../../stores/Exchange';
import { Details } from './Details';
import { AuthWarning } from '../../components/AuthWarning';
import { Steps } from './Steps';
import { autorun, computed } from 'mobx';
import { EXCHANGE_MODE, TOKEN } from 'stores/interfaces';
import cn from 'classnames';
import { ERC20Select } from './ERC20Select';
import { ThemeProvider } from 'styled-components';

export interface ITokenInfo {
  label: string;
  maxAmount: string;
  minAmount: string;
}

type NetworkTemplateInterface = {
  name: string,
  wallet: string
  tokenSymbol: string
  amount: string;
}

type State = { selectedToken: any, selectedAmount: string, amountErrors: Array<string> };

function getLabel(mode: EXCHANGE_MODE, tokenType: TOKEN, tokenInfo: ITokenInfo) {
  if (tokenInfo.label === 'WSCRT') {
    return mode === EXCHANGE_MODE.SCRT_TO_ETH ? `SSCRT Amount` : `WSCRT Amount`;
  } else {
    return `${(mode === EXCHANGE_MODE.SCRT_TO_ETH && tokenType === TOKEN.ERC20 && tokenInfo.label ? 'secret' : '') +
      tokenInfo.label} Amount`;
  }
}

@inject('user', 'exchange', 'actionModals', 'userMetamask', 'routing')
@observer
export class Exchange extends React.Component<
  Pick<IStores, 'user'> &
    Pick<IStores, 'exchange'> &
    Pick<IStores, 'routing'> &
    Pick<IStores, 'actionModals'> &
    Pick<IStores, 'userMetamask'>, State
> {
  formRef: MobxForm;

  constructor(props) {
    super(props);
    this.state = { selectedToken: null, selectedAmount: "0.0", amountErrors: [] };

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

    if (needValidate) {
      this.formRef.validateFields().then(() => {
        callback();
      });
    } else {
      callback();
    }
  };

  @computed
  get tokenInfo(): ITokenInfo {
    const { user, exchange, userMetamask } = this.props;

    switch (exchange.token) {
      case TOKEN.ERC20:
        if (!userMetamask.erc20TokenDetails) {
          return { label: '', maxAmount: '0', minAmount: '0' };
        }

        return {
          label: userMetamask.erc20TokenDetails.symbol,
          maxAmount:
            exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH
              ? !user.snip20Balance || user.snip20Balance.includes(unlockToken)
                ? '0'
                : user.snip20Balance
              : userMetamask.erc20Balance,
          minAmount:
            exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH
              ? user.snip20BalanceMin || '0'
              : userMetamask.erc20BalanceMin || '0',
        };

      default:
        if (exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH) {
          return {
            label: 'secretETH',
            maxAmount:
              !user.balanceToken['Ethereum'] || user.balanceToken['Ethereum'].includes(unlockToken)
                ? '0'
                : user.balanceToken['Ethereum'],
            minAmount: user.balanceTokenMin['Ethereum'] || '0',
          };
        } else {
          return {
            label: 'ETH',
            maxAmount: userMetamask.ethBalance,
            minAmount: userMetamask.ethBalanceMin || '0',
          };
        }
    }
  }

  
  render() {
    const { exchange, routing, user, userMetamask } = this.props;
    const { selectedToken } = this.state;

    const NTemplate1: NetworkTemplateInterface = {
      name: exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? "Ethereum" : "Secret Network", 
      wallet: exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? "Metamask" : "Keplr", 
      tokenSymbol: "No Token Selected", 
      amount: this.state.selectedAmount
    }

    const NTemplate2: NetworkTemplateInterface = {
      name: exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? "Secret Network" : "Ethereum", 
      wallet: exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? "Keplr" : "Metamask", 
      tokenSymbol: "No Token Selected", 
      amount: this.state.selectedAmount
    }

    const minAmount = this.tokenInfo.minAmount
    const maxAmount = this.tokenInfo.maxAmount

    if(selectedToken){

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

    switch (exchange.actionStatus) {
      case 'fetching':
        icon = () => <Spinner />;
        description = '';
        break;

      case 'error':
        icon = () => <Icon size="50" style={{ width: 50 }} glyph="Alert" />;
        description = exchange.error;
        break;

      case 'success':
        icon = () => (
          <Box
            style={{
              background: '#1edb89',
              borderRadius: '50%',
            }}
          >
            <Icon size="50" style={{ width: 50, color: 'white' }} glyph="CheckMark" />
          </Box>
        );
        description = 'Success';
        break;
    }

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

    const InputAddress = observer((
      props: {
        isAuthorized: boolean,
        onUseMyAddress: any,
        label: string,
        name: string,
        rules: any
      }) => (
        <Box direction="column" fill={true} style={{ position:'relative' }}>

          {props.isAuthorized && 
            <Box
              style={{right: 0,top: 0,position: 'absolute',color: 'rgb(0, 173, 232)',textAlign: 'right',}}
              onClick={props.onUseMyAddress}
            >
              Use my address
            </Box>
          }

          <Input
            label={props.label}
            name={props.name}
            style={{ width: '100%' }}
            placeholder="Receiver address"
            rules={props.rules}
          />

        </Box>
    ));

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
          {selectedToken && <img src={selectedToken.image} style={{ width: 20, marginRight: 10 }} alt={props.tokenSymbol} />}
          {selectedToken && <Text bold color="#30303D" size="medium">{props.amount}</Text>}
          <Text bold margin={{ left: 'xxsmall' }} color="#748695" size="medium">{props.tokenSymbol}</Text>
        </Box>
      </Box>
    ));

    console.log('this.props.exchange.transaction amount', this.props.exchange.transaction.amount)
    console.log('this.props.exchange.transaction erc20Address', this.props.exchange.transaction.erc20Address)
    console.log('this.props.exchange.transaction ethAddress', this.props.exchange.transaction.ethAddress)
    console.log('this.props.exchange.transaction scrtAddress', this.props.exchange.transaction.scrtAddress)
    console.log('this.props.exchange.transaction snip20Address', this.props.exchange.transaction.snip20Address)
    return (
      <Box fill direction="column"  className={styles.exchangeContainer}>
        <Box fill direction="row" justify="around" pad="xlarge" background="#F8F9FC" style={{position: 'relative'}}>
          <NetworkTemplate {...NTemplate1}/>
          <Box pad="small" style={{position: 'absolute', top: 'Calc(50% - 60px)', left: 'Calc(50% - 60px)'}}>
            <Icon size="60" glyph="Reverse"  onClick={async () => {
              this.setState({selectedAmount: "0.0"})
              exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? 
                exchange.setMode(EXCHANGE_MODE.SCRT_TO_ETH) :   
                exchange.setMode(EXCHANGE_MODE.ETH_TO_SCRT)
            }}/>
          </Box>
          <NetworkTemplate {...NTemplate2}/>
        </Box>
        <Form ref={ref => (this.formRef = ref)} data={this.props.exchange.transaction} {...({} as any)} >
          {exchange.step.id === EXCHANGE_STEPS.BASE && 
            <Box direction="row" fill={true} pad="xlarge">
              
              <Box direction="row" gap="2px" width="50%" margin={{ right: 'medium' }}>
                <Box width="100%" margin={{right: 'medium'}}>
                  <ERC20Select 
                    onSelectToken={(value) => {
                      console.log('value.symbol', value.symbol)
                      value.symbol === "ETH" ? exchange.setToken(TOKEN.ETH) : exchange.setToken(TOKEN.ERC20) 
                      this.setState({ selectedToken: value, selectedAmount: "0.0" })
                    }}
                  />
                </Box>
                <Box direction="column" width="100%">

                  <Text bold size="large">{getLabel(exchange.mode, exchange.token, this.tokenInfo)}</Text>
                  <Box direction="row" style={{ height: 46, borderRadius: 4, border: "solid 1px #E7ECF7", marginTop: 8}} fill justify="between"  align="center">
                    <Box width="40%">
                      <NumberInput
                        name="amount"
                        type="decimal"
                        precision="6"
                        delimiter="."
                        placeholder="0"
                        margin={{bottom: "none"}}
                        value={Number(this.state.selectedAmount)}
                        style={{ borderColor: 'transparent', height: 44 }}
                        onChange={(value) => this.setState({selectedAmount: value})}
                        rules={[isRequired, moreThanZero,
                          (_, value, callback) => {
                            const errors = [];
                            console.log(value)
                            console.log(maxAmount)
                            if(!value || value.replace(/\s/g, "") === "") errors.push('This field is required.');
                            if(Number(value) <= 0) errors.push('Value must be greater than 0.');
                            if (value && Number(value) > Number(maxAmount)) {
                              errors.push('Exceeded the maximum amount.');
                            } else if (value && Number(value) < Number(minAmount)) {
                              errors.push('Below the minimum amount.');
                            }

                            console.log('NumberInput errors', errors)
                            this.setState({amountErrors: errors})
                          },
                        ]}
                      />
                    </Box>

                    <Box direction="row" align="center" justify="end">
                      <Text bold className={styles.maxAmountInput}>{`/ ${maxAmount}`}</Text>
                      <Button 
                        margin={{left: 'xsmall', right: 'xsmall'}} 
                        bgColor="#DEDEDE" 
                        pad="xxsmall"
                        onClick={() => this.setState({selectedAmount: maxAmount})}
                      >
                          <Text size="xxsmall" bold>MAX</Text>
                      </Button>
                    </Box>
                  </Box>
                  {Number(minAmount) > 0 && <Box margin={{top: 'xxsmall'}} direction="row">
                      <Text bold size="small" margin={{right: 'xxsmall'}}>Minimum:</Text>
                      <Text size="small" color="#748695">
                        {`
                        ${formatWithSixDecimals(minAmount)} 
                        ${this.tokenInfo.label} 
                        ${exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH && exchange.token === TOKEN.ERC20 ? 'secret' : ''}
                        `}
                      </Text>
                  </Box>}

                  {this.state.amountErrors.length > 0 && <Box margin={{top: 'medium'}} direction="column">
                    {this.state.amountErrors.map((message, idx) => <Text color="red" key={idx}>{message}</Text>)}
                  </Box>}
                </Box>
              </Box>
                  
              <Box width="50%">
                <InputAddress 
                  isAuthorized={exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH ? userMetamask.isAuthorized : user.isAuthorized}
                  label={exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH ? "Destination ETH Address" : "Destination Secret Address" } 
                  name={exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH ? "ethAddress" : "scrtAddress" } 
                  onUseMyAddress={() => {
                    if(exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH) exchange.transaction.ethAddress = userMetamask.ethAddress
                    if(exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT) exchange.transaction.scrtAddress = user.address
                  }}
                  rules={[isRequired, (_, value, callback) => {
                    console.log('oi')
                    const errors = [];
                    if(!value || value.replace(/\s/g, "") === "") errors.push('This field is required');
                    if(exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH && !isEthAddress) errors.push('Invalid Ethereum Address');
                    if(exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT && !isSecretAddress) errors.push('Invalid Secret Address');
                    console.log('errors InputAddress', errors)
                    callback(errors)
                  }]}
                />
              </Box>
              
            </Box>}

            <Box direction="row" pad="large" justify="end" align="center">
              {exchange.step.buttons.map((conf, idx) => (
                <Button
                  key={idx}
                  bgColor="#00ADE8"
                  style={{ width: conf.transparent ? 140 : 180 }}
                  onClick={() => {
                    this.onClickHandler(conf.validate, conf.onClick);
                  }}
                  transparent={!!conf.transparent}
                >
                  {conf.title}
                </Button>
              ))}
            </Box>

        </Form>
      </Box>

    )

    return (
      <Box direction="column" pad="xlarge" className={styles.exchangeContainer}>
        {exchange.step.id === EXCHANGE_STEPS.BASE ? (
          <Box direction="row">
            <Box
              className={cn(styles.itemToken, exchange.token === TOKEN.ETH ? styles.selected : '')}
              onClick={() => {
                exchange.setToken(TOKEN.ETH); //HERE
                routing.push(`/${exchange.token}`);
              }}
            >
              <img
                className={styles.imgToken}
                src={exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? '/static/eth.svg' : '/static/scrt.svg'}
              />
              <Text>{exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH ? 'secretETH' : 'ETH'}</Text>
            </Box>

            <Box
              className={cn(styles.itemToken, exchange.token === TOKEN.ERC20 ? styles.selected : '')}
              onClick={() => {
                exchange.setToken(TOKEN.ERC20);  //HERE
                routing.push(`/${exchange.token}`);
              }}
            >
              <img
                className={styles.imgToken}
                src={exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? '/static/eth.svg' : '/static/scrt.svg'}
              />
              <Text>{exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH ? 'SNIP20' : 'ERC20'}</Text>
            </Box>
          </Box>
        ) : null}

        <Form ref={ref => (this.formRef = ref)} data={this.props.exchange.transaction} {...({} as any)}>
          {exchange.step.id === EXCHANGE_STEPS.BASE ? (
            <Box direction="column" fill={true}>
              {exchange.token === TOKEN.ERC20 ? <ERC20Select /> : null}

              <Box direction="column" gap="2px" fill={true} margin={{ top: 'xlarge', bottom: 'large' }}>
                <NumberInput
                  label={getLabel(exchange.mode, exchange.token, this.tokenInfo)}
                  name="amount"
                  type="decimal"
                  precision="6"
                  delimiter="."
                  placeholder="0"
                  style={{ width: '100%' }}
                  rules={[
                    isRequired,
                    moreThanZero,
                    (_, value, callback) => {
                      const errors = [];

                      if (value && Number(value) > Number(this.tokenInfo.maxAmount.replace(/,/g, ''))) {
                        errors.push('Exceeded the maximum amount');
                      } else if (value && Number(value) < Number(this.tokenInfo.minAmount.replace(/,/g, ''))) {
                        errors.push('Below the minimum amount');
                      }

                      callback(errors);
                    },
                  ]}
                />
                <Text size="small" style={{ textAlign: 'right' }}>
                  <b>Min / Max</b> = {formatWithSixDecimals(this.tokenInfo.minAmount.replace(/,/g, ''))}
                  {' / '}
                  {formatWithSixDecimals(this.tokenInfo.maxAmount.replace(/,/g, ''))}{' '}
                  {(exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH && exchange.token === TOKEN.ERC20 ? 'secret' : '') +
                    this.tokenInfo.label}
                </Text>
              </Box>

              {exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH ? (
                <Box direction="column" fill={true}>
                  <Input
                    label="Destination ETH Address"
                    name="ethAddress"
                    style={{ width: '100%' }}
                    placeholder="Receiver address"
                    rules={[isRequired /* isEthAddress */]}
                  />
                  {userMetamask.isAuthorized ? (
                    <Box
                      fill={true}
                      style={{
                        color: 'rgb(0, 173, 232)',
                        textAlign: 'right',
                      }}
                      onClick={() => (exchange.transaction.ethAddress = userMetamask.ethAddress)}
                    >
                      Use my address
                    </Box>
                  ) : null}
                </Box>
              ) : (
                <Box direction="column" fill={true}>
                  <Input
                    label="Destination Secret Address"
                    name="scrtAddress"
                    style={{ width: '100%' }}
                    placeholder="Receiver address"
                    rules={[isRequired /* isSecretAddress */]}
                  />
                  {user.isAuthorized ? (
                    <Box
                      fill={true}
                      style={{
                        color: 'rgb(0, 173, 232)',
                        textAlign: 'right',
                      }}
                      onClick={() => (exchange.transaction.scrtAddress = user.address)}
                    >
                      Use my address
                    </Box>
                  ) : null}
                </Box>
              )}
            </Box>
          ) : null}
        </Form>

        {exchange.step.id === EXCHANGE_STEPS.CONFIRMATION ? <Details showTotal={true} /> : null}

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

        <Box direction="row" margin={{ top: 'large' }} justify="end" align="center">
          {exchange.step.buttons.map((conf, idx) => (
            <Button
              key={idx}
              bgColor="#00ADE8"
              style={{ width: conf.transparent ? 140 : 180 }}
              onClick={() => {
                this.onClickHandler(conf.validate, conf.onClick);
              }}
              transparent={!!conf.transparent}
            >
              {conf.title}
            </Button>
          ))}
        </Box>
      </Box>
    );
  }
}
