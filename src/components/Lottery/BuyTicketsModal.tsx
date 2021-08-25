import React, { useContext, useEffect, useState } from 'react';
import { Button, Input, Modal } from 'semantic-ui-react';
import { useStores } from 'stores';
import Scrollbars from 'react-custom-scrollbars';
import getConfigs, { IConfigs } from 'pages/SecretLottery/api/getConfigs';
import { BalancesDispatchContext } from '../../stores/lottery-context/BalancesContext';
import { ClientContext, IClientState } from '../../stores/lottery-context/ClientContext';
import { ConfigsContext, ConfigsDispatchContext } from '../../stores/lottery-context/LotteryConfigsContext';
import { ViewKeyContext } from '../../stores/lottery-context/ViewKeyContext';
import formatNumber from '../../utils/secret-lottery/formatNumber';
import calcBulkDiscountTicketPrice from '../../utils/secret-lottery/calcBulkDiscountTicketPrice';
import generateRandomTickets from '../../utils/secret-lottery/generateRandomTickets';
import getRounds, { IRound } from 'pages/SecretLottery/api/getRounds';
import getUserRoundsTicketCount from 'pages/SecretLottery/api/getUserRoundsTicketCount';
import buyTickets from 'pages/SecretLottery/api/buyTickets';
import { errorNotification, successNotification } from 'utils/secret-lottery/notifications';
import getRoundStakingRewards, { IStakingRewads } from 'pages/SecretLottery/api/getRoundStakingRewards';
import getBalance from 'pages/SecretLottery/api/getBalance';
import { isNaN } from 'lodash';

interface BuyTicketsProps {
  children: JSX.Element; 
  getPaginatedUserTicketsTrigger: Function; 
  paginationValues: any; 
}

const renderThumbVertical = () => {
  //TODO: add dark support
  return <div className={`thumb`}></div>;
};

const BuyTicketsModal = ({
  children,
  getPaginatedUserTicketsTrigger,
  paginationValues,
}: BuyTicketsProps) => {
  const client = useContext(ClientContext);
  const viewkey = useContext(ViewKeyContext);
  const configs = useContext(ConfigsContext);
  const [open, setOpen] = useState<boolean>(false);
  const [loadingBuyTickets, setLoadingBuyTickets] = useState<boolean>(false)
  const [isManualTickets, setIsManualTickets] = useState<boolean>(false);
  const [currentRoundUserTicketsCount, setCurrentRoundUserTicketsCount] = useState<number | null>(null)
  const [ticketsCount, setTicketsCount] = useState<string>(configs?.min_ticket_count_per_round.toString());
  const [manualTickets, setManualTickets] = useState<string[]>([]);
  const [currentRoundsState, setCurrentRoundsState] = useState<IRound | null>(null)
  const [stakingRewards, setStakingRewards] = useState<IStakingRewads | null>(null)
  const balancesDispatch = useContext(BalancesDispatchContext);
  const configsDispatch = useContext(ConfigsDispatchContext);
  let { theme } = useStores();

  useEffect(() => {
    getConfigsTrigger(client)
    setInterval(() => {
        getConfigsTrigger(client)
    }, 30000); // check 30 seconds
}, [client])

  useEffect(()=>{
      const emptyArray=[];
      for (let i = 0; i < parseFloat(ticketsCount); i++) {
          if(manualTickets[i] !== ""){
              emptyArray[i]= manualTickets[i];
          }else{
              emptyArray.push("");
          }
      }
      setManualTickets(emptyArray);
  },[ticketsCount])

  useEffect(() => {
    if(viewkey && configs){
        getUserTicketsRound(client, viewkey, configs.current_round_number);
    }

    if (configs) {
        getCurrentRound(client, configs.current_round_number);
        getRoundStakingRewardsTrigger(client, configs)
    }
}, [configs])

const getUserTicketsRound = async (client: IClientState, viewkey: string, current_round: number) => {
  try {

      const currentRoundUserTicketsCount = await getUserRoundsTicketCount(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, viewkey, [current_round]);
      setCurrentRoundUserTicketsCount(currentRoundUserTicketsCount.user_rounds_ticket_count[0])
  } catch (error) {
      console.error(error)
  }

}
const getCurrentRound = async (client: IClientState, current_round: number) => {
  try {
      const currentRound = await getRounds(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, [current_round])
      setCurrentRoundsState(currentRound.rounds[0])
      
  } catch (error) {
      console.error(error)
  }
}
  const getConfigsTrigger = async (client: IClientState) => {
    const configs = await getConfigs(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS)
    configsDispatch(configs)
  }
  const getCurrentRoundTrigger = async(client: IClientState, viewkey: string, current_round: number)=>{
    try {
        const currentRoundUserTicketsCount = await getUserRoundsTicketCount(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, viewkey, [current_round]);
        setCurrentRoundUserTicketsCount(currentRoundUserTicketsCount.user_rounds_ticket_count[0])
        const currentRound = await getRounds(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, [current_round])
        setCurrentRoundsState(currentRound.rounds[0])
    } catch (error) {
       console.error(error) 
    }
  }
  const getRoundStakingRewardsTrigger = async (client: IClientState, configs: IConfigs) => {
    const roundStakingRewards = await getRoundStakingRewards(client, configs.staking_contract.address, configs.staking_vk)
    setStakingRewards(roundStakingRewards);
  }
  const getSEFIBalance = async () => {
    // if (!client) return null
    const response = await getBalance(client, process.env.SCRT_GOV_TOKEN_ADDRESS)
    const accountData = await client.execute.getAccount(client.accountData.address);
    balancesDispatch({
        native: parseInt(accountData ? accountData.balance[0].amount : "0"),
        SEFI: response
    })
}
  if(!configs || !currentRoundsState)return null;
  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      className={`modal-container ${theme.currentTheme}`}
      trigger={children}
    >
      <div className="modal-header-buy">
        <h6>Buy Tickets</h6>
        <h3 onClick={() => setOpen(false)}>x</h3>
      </div>
      <div className="modal-nav">
        <button onClick={() => setIsManualTickets(false)} className={isManualTickets ? 'inactive' : 'active'}>
          Auto
        </button>
        <button onClick={() => setIsManualTickets(true)} className={isManualTickets ? 'active' : 'inactive'}>
          Manual
        </button>
      </div>
      <div className="modal-body-buy">
        <div className="modal-input">
          <Input
            fluid
            placeholder="000"
            type="number"
            value={ticketsCount}
            onChange={e => {
              if (parseInt(e.target.value) >= 500) {
                setTicketsCount('500');
              } else {
                setTicketsCount(e.target.value);
              }
            }}
          >
            <Button
              type="submit"
              onClick={() => {
                if (parseInt(ticketsCount) > configs?.min_ticket_count_per_round) {
                  setTicketsCount('' + (parseInt(ticketsCount) - 1));
                }else {
                  setTicketsCount(configs?.min_ticket_count_per_round.toString());
                }
              }}
            >
              -
            </Button>
            <input />
            <Button
              type="submit"
              onClick={() => {
                if (parseInt(ticketsCount) >= 500) {
                  setTicketsCount('500');
                } else {
                  setTicketsCount('' + (parseInt(ticketsCount) + 1));
                }
              }}
            >
              +
            </Button>
          </Input>
        </div>
        {isManualTickets && parseFloat(ticketsCount) > 0 && (
          <Scrollbars autoHide renderThumbVertical={renderThumbVertical} className="inputs-container">
            {manualTickets.map((currentValue: string, index: number) => (
              <Input
                key={`input-${index}`}
                className="manual-input"
                fluid
                placeholder="000000"
                type="number"
                value={currentValue}
                onChange={e => {
                  let value: any = e.target.value;
                  let valueInt = parseInt(value);

                  if (isNaN(valueInt) || value.length > 6) {
                    return;
                  }
                  if (valueInt < 0) {
                    value = (valueInt * -1).toString();
                  }
                  setManualTickets(manualTickets.map((v, i) => (i === index ? value : v)));
                }}
              />
            ))}
          </Scrollbars>
        )}
        <Button
          fluid
          color="black"
          type="button"
          size="big"
          disabled={
            loadingBuyTickets ||
            (isManualTickets && manualTickets.filter(e => e?.length === 6).length !== manualTickets.length) ||
            parseInt(ticketsCount) <= configs.min_ticket_count_per_round || !ticketsCount
          }
          onClick={async () => {
            if (!configs) {
              return;
            }
            setLoadingBuyTickets(true);
            try {
              let tickets = null;
              let ticketPrice = null;
              if (isManualTickets) {
                tickets = manualTickets;
                ticketPrice =
                  '' +
                  calcBulkDiscountTicketPrice(
                    configs.per_ticket_bulk_discount,
                    manualTickets.length,
                    currentRoundsState.round_ticket_price,
                  ).finalPrice;
              } else {
                const autoGeneratedTickets = generateRandomTickets(parseInt(ticketsCount));
                tickets = autoGeneratedTickets;
                ticketPrice =
                  '' +
                  calcBulkDiscountTicketPrice(
                    configs.per_ticket_bulk_discount,
                    parseInt(ticketsCount),
                    currentRoundsState.round_ticket_price,
                  ).finalPrice;
              }
              await buyTickets(
                client,
                process.env.SCRT_GOV_TOKEN_ADDRESS,
                process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS,
                tickets,
                ticketPrice,
              );
              await getRoundStakingRewardsTrigger(client, configs);
              await getCurrentRoundTrigger(client, viewkey, configs.current_round_number);
              await getPaginatedUserTicketsTrigger(client, viewkey, paginationValues.page, paginationValues.page_size);
              await getSEFIBalance();
              setOpen(false)
              successNotification('Buy Tickets Success!');
              setTicketsCount('0');
              setManualTickets([]);
              setLoadingBuyTickets(false);
            } catch (e) {
              setOpen(false)
              setLoadingBuyTickets(false);
              errorNotification(e);
            }
          }}
          loading={loadingBuyTickets}
        >
          Buy
        </Button>
        <div className="purchased-tickets">
          {currentRoundUserTicketsCount && currentRoundUserTicketsCount > 0 ? (
            <h6>
              You have bought <span>{currentRoundUserTicketsCount} tickets</span> for this round
            </h6>
          ) : null}
        </div>
      </div>
      <div className="modal-footer-container">
        <div className="row-footer">
          <p>Ticket Price</p>
          <h6>
            {`${formatNumber(
              calcBulkDiscountTicketPrice(
                configs.per_ticket_bulk_discount,
                parseInt(ticketsCount) | 0,
                currentRoundsState.round_ticket_price,
              ).finalPrice / 1000000,
            )} SEFI`}
          </h6>
        </div>
        <div className="row-footer">
          <p>Disccount</p>
          <h6>
            {calcBulkDiscountTicketPrice(
              configs.per_ticket_bulk_discount,
              parseInt(ticketsCount) | 0,
              currentRoundsState.round_ticket_price,
            ).discount + '%'}
          </h6>
        </div>
      </div>
    </Modal>
  );
};

export default BuyTicketsModal;
