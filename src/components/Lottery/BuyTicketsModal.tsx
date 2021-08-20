import React, { useContext, useState } from 'react';
import { Button, Input, Modal } from 'semantic-ui-react';
import { useStores } from 'stores';
import Scrollbars from 'react-custom-scrollbars';
import { IConfigs } from 'pages/SecretLottery/api/getConfigs';
import { BalancesDispatchContext } from '../../stores/lottery-context/BalancesContext';
import { ClientContext, IClientState } from '../../stores/lottery-context/ClientContext';
import { ConfigsContext, ConfigsDispatchContext } from '../../stores/lottery-context/LotteryConfigsContext';
import { ViewKeyContext } from '../../stores/lottery-context/ViewKeyContext';
import formatNumber from '../../utils/secret-lottery/formatNumber';
import calcBulkDiscountTicketPrice from '../../utils/secret-lottery/calcBulkDiscountTicketPrice';
import generateRandomTickets from '../../utils/secret-lottery/generateRandomTickets';

interface BuyTicketsProps {
  children: JSX.Element;
  currentRoundsState: any;
  buyTickets: Function;
  getRoundStakingRewardsTrigger: Function;
  getCurrentRoundTrigger: Function;
  getPaginatedUserTicketsTrigger: Function;
  getSEFIBalance: Function;
  paginationValues: any;
  successNotification: Function;
  errorNotification: Function;
  currentRoundUserTicketsCount: any;
  ticketsCount:string,
  setTicketsCount:Function,
  manualTickets:Array<string>,
  setManualTickets:Function,
}

const renderThumbVertical = () => {
  //TODO: add dark support
  return <div className={`thumb`}></div>;
};

const BuyTicketsModal = ({
  children,
  currentRoundsState,
  buyTickets,
  getRoundStakingRewardsTrigger,
  getCurrentRoundTrigger,
  getPaginatedUserTicketsTrigger,
  getSEFIBalance,
  paginationValues,
  successNotification,
  errorNotification,
  currentRoundUserTicketsCount,
  ticketsCount,
  setTicketsCount,
  manualTickets,
  setManualTickets,
}: BuyTicketsProps) => {
  const client = useContext(ClientContext);
  const viewkey = useContext(ViewKeyContext);
  const configs = useContext(ConfigsContext);
  const [open, setOpen] = useState<boolean>(false);
  const [loadingBuyTickets, setLoadingBuyTickets] = useState<boolean>(false)
  const [isManualTickets, setIsManualTickets] = useState<boolean>(false);
  let { theme } = useStores();

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
              if (!e.target.value || e.target.value === '') {
                setTicketsCount('0');
              } else if (parseInt(e.target.value) >= 500) {
                setTicketsCount('500');
              } else {
                setTicketsCount(e.target.value);
              }
            }}
          >
            <Button
              type="submit"
              onClick={() => {
                if (parseInt(ticketsCount) > 0) {
                  setTicketsCount('' + (parseInt(ticketsCount) - 1));
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
          disabled={
            loadingBuyTickets ||
            (isManualTickets && manualTickets.filter(e => e?.length === 6).length !== manualTickets.length) ||
            parseInt(ticketsCount) === 0
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
              successNotification('Buy Tickets Success!');
              setTicketsCount('0');
              setManualTickets([]);
              setLoadingBuyTickets(false);
            } catch (e) {
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
                parseInt(ticketsCount),
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
              parseInt(ticketsCount),
              currentRoundsState.round_ticket_price,
            ).discount + '%'}
          </h6>
        </div>
      </div>
    </Modal>
  );
};

export default BuyTicketsModal;
