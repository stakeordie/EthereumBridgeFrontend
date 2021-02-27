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
import { autorun, computed } from 'mobx';
import { EXCHANGE_MODE, TOKEN } from 'stores/interfaces';
import cn from 'classnames';
import { ERC20Select } from './ERC20Select';

export interface ITokenInfo {
  label: string;
  maxAmount: string;
  minAmount: string;
}

type NetworkTemplateInterface = {
  name: string,
  wallet: string
  tokenSymbol: string
  amount: number,
}

type State = { selectedToken: any };

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
    this.state = { selectedToken: null };

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
      amount: 0, //TOKEN AMOUNT VALUE HERE
      tokenSymbol: "No Token Selected", 
    }

    const NTemplate2: NetworkTemplateInterface = {
      name: exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? "Secret Network" : "Ethereum", 
      wallet: exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? "Keplr" : "Metamask", 
      amount: 0, //TOKEN AMOUNT VALUE HERE
      tokenSymbol: "No Token Selected", 
    }

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

    const NetworkTemplate = observer((
      props: {
        name: string,
        wallet: string
        tokenSymbol: string
        amount: number,
      }) => (
      <Box direction="column" width="230"  margin={{ left: 'xlarge', right: 'xlarge' }}>
        <Box direction="row" align="start" margin={{ bottom: 'small' }}>
          <img className={styles.imgToken} src={props.name === "Ethereum" ? "/eth.svg" : "/scrt.svg"} />
          <Box direction="column" margin={{ left: 'xxsmall' }}>
            <Title bold color={"#30303D"} margin={{ bottom: 'xxsmall' }}>{props.name}</Title>
            <Text size="medium" bold color={"#748695"}>{props.wallet}</Text>
          </Box>
        </Box>
        
        <Box pad="xxsmall" direction="row" align="center" justify="start" style={{backgroundColor: "#E1FEF2"}}>
          {selectedToken && <img src={selectedToken.image} style={{ width: 20, marginRight: 10 }} alt={props.tokenSymbol} />}
          <Text bold margin={{ left: 'xxsmall' }} color="#30303D" size="medium">{props.tokenSymbol}</Text>
          <Text bold margin={{ left: 'xxsmall' }} color="#748695" size="medium">{props.amount}</Text>
        </Box>
      </Box>
    ));

    console.log('userMetamask', userMetamask.ethAddress)
    return (
      <Box fill direction="column"  className={styles.exchangeContainer}>
        <Box fill direction="row" justify="around" pad="xlarge" background="#F8F9FC">
          <NetworkTemplate {...NTemplate1}/>
          <Box pad="small">
            <Icon size="60" glyph="Reverse"  onClick={async () => {
              exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT ? 
                exchange.setMode(EXCHANGE_MODE.SCRT_TO_ETH) :   
                exchange.setMode(EXCHANGE_MODE.ETH_TO_SCRT)
            }}/>
          </Box>
          <NetworkTemplate {...NTemplate2}/>
        </Box>
        <Form ref={ref => (this.formRef = ref)} data={this.props.exchange.transaction} {...({} as any)}>
          {exchange.step.id === EXCHANGE_STEPS.BASE ? (
            <Box direction="row" fill={true} pad="xlarge">
              
              <Box direction="row" gap="2px" width="50%" margin={{ right: 'medium' }}>
                <Box width="100%" margin={{right: 'medium'}}>
                  <ERC20Select 
                    onSelectToken={(value) => {
                      value.symbol === "ETH" ? exchange.setToken(TOKEN.ETH) : exchange.setToken(TOKEN.ERC20) 
                      console.log(exchange.token)
                      this.setState({ selectedToken: value })
                    }}
                  />
                </Box>
                <Box direction="column" width="100%">
                
                  <NumberInput
                    label={getLabel(exchange.mode, exchange.token, this.tokenInfo)}
                    name="amount"
                    type="decimal"
                    precision="6"
                    delimiter="."
                    placeholder="0"
                    style={{ width: '100%' }}
                    onChange={(value) => console.log(value)}
                    rules={[
                      isRequired,
                      moreThanZero,
                      (_, value, callback) => {
                        const errors = [];
                        // QUESTION - where is the amount value at?
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
              </Box>
                  
              <Box width="50%">

              {exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH ? (
                <Box direction="column" fill={true} style={{ position:'relative' }}>

                  {userMetamask.isAuthorized && 
                    <Box
                      fill={true}
                      style={{
                        right: 0,
                        top: 0,
                        position: 'absolute',
                        color: 'rgb(0, 173, 232)',
                        textAlign: 'right',
                      }}
                      onClick={() => (exchange.transaction.ethAddress = userMetamask.ethAddress)}
                    >
                      Use my address
                    </Box>
                  }

                  <Input
                    label="Destination ETH Address"
                    name="ethAddress"
                    style={{ width: '100%' }}
                    placeholder="Receiver address"
                    rules={[isRequired /* isEthAddress */]}
                  />
     
                </Box>
              ) : (
                <Box direction="column" fill={true} style={{ position:'relative' }}>

                  {user.isAuthorized &&
                    <Box
                      fill={true}
                      style={{
                        right: 0,
                        top: 0,
                        position: 'absolute',
                        color: 'rgb(0, 173, 232)',
                        textAlign: 'right',
                      }}
                      onClick={() => (exchange.transaction.scrtAddress = user.address)}
                    >
                      Use my address
                    </Box>
                  }

                  <Input
                    label="Destination Secret Address"
                    name="scrtAddress"
                    style={{ width: '100%' }}
                    placeholder="Receiver address"
                    rules={[isRequired /* isSecretAddress */]}
                  />
                </Box>
              )}

              </Box>
              
            </Box>
          ) : null}
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
