import React, { useState } from 'react';
import { Button, Input, Modal } from 'semantic-ui-react';
import { useStores } from 'stores';
import Scrollbars from 'react-custom-scrollbars';
import formatNumber from '../../utils/secret-lottery/formatNumber';
import calcBulkDiscountTicketPrice from '../../utils/secret-lottery/calcBulkDiscountTicketPrice';
import generateRandomTickets from '../../utils/secret-lottery/generateRandomTickets';
import buyTickets from 'pages/SecretLottery/api/buyTickets';
import { errorNotification, successNotification } from 'utils/secret-lottery/notifications';
import { isNaN } from 'lodash';
import { observer } from 'mobx-react';

interface BuyTicketsProps {
  children: JSX.Element;
}

const renderThumbVertical = () => {
  //TODO: add dark support
  return <div className={`thumb`}></div>;
};

const BuyTicketsModal = observer(({
  children,
}: BuyTicketsProps) => {

  const [isManualTickets, setIsManualTickets] = useState<boolean>(false);
  const [loadingBuyTickets, setLoadingBuyTickets] = useState<boolean>(false)
  const [open, setOpen] = useState<boolean>(false);
  let { theme,lottery } = useStores();

  if(!lottery.configs || !lottery.currentRoundsState)return null;
  
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
            value={lottery.ticketsCount}
            onChange={e => {
              if (parseInt(e.target.value) >= 500) {
                lottery.setTicketsCount('500');
              } else if(parseInt(e.target.value) < 0){
                lottery.setTicketsCount('0');
              }else{
                lottery.setTicketsCount(e.target.value);
              }
            }}
          >
            <Button
              type="submit"
              onClick={() => {
                if (parseInt(lottery.ticketsCount) > 0) {

                  lottery.setTicketsCount('' + (parseInt(lottery.ticketsCount) - 1));
                }else {
                  lottery.setTicketsCount('0');
                }
              }}
            >
              -
            </Button>
            <input />
            <Button
              type="submit"
              onClick={() => {
                if (parseInt(lottery.ticketsCount) >= 500) {
                  lottery.setTicketsCount('500');
                } else {
                  lottery.setTicketsCount('' + (parseInt(lottery.ticketsCount) + 1));
                }
              }}
            >
              +
            </Button>
          </Input>
        </div>
        {isManualTickets && parseFloat(lottery.ticketsCount) > 0 && (
          <Scrollbars autoHide renderThumbVertical={renderThumbVertical} className="inputs-container">
            {lottery.manualTickets.map((currentValue: string, index: number) => (
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
                  
                  lottery.setCustomManualTickets(lottery.manualTickets.map((v, i) => (i === index ? value : v)));
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
            (isManualTickets && lottery.manualTickets.filter(e => e?.length === 6).length !== lottery.manualTickets.length) ||
            parseInt(lottery.ticketsCount) <= 0 || !lottery.ticketsCount
          }
          onClick={async () => {
            if (!lottery.configs) {
              return;
            }
            setLoadingBuyTickets(true);
            try {
              let tickets = null;
              let ticketPrice = null;
              if (isManualTickets) {
                tickets = lottery.manualTickets;
                ticketPrice =
                  '' +
                  calcBulkDiscountTicketPrice(
                    lottery.configs.per_ticket_bulk_discount,
                    lottery.manualTickets.length,
                    lottery.currentRoundsState.round_ticket_price,
                  ).finalPrice;
              } else {
                const autoGeneratedTickets = generateRandomTickets(parseInt(lottery.ticketsCount));
                tickets = autoGeneratedTickets;
                ticketPrice =
                  '' +
                  calcBulkDiscountTicketPrice(
                    lottery.configs.per_ticket_bulk_discount,
                    parseInt(lottery.ticketsCount),
                    lottery.currentRoundsState.round_ticket_price,
                  ).finalPrice;
              }
              await buyTickets(
                lottery.client,
                process.env.SCRT_GOV_TOKEN_ADDRESS,
                process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS,
                tickets,
                ticketPrice,
              );
              setOpen(false)
              successNotification('Buy Tickets Success!');
              setLoadingBuyTickets(false);              
              await lottery.getRoundStakingRewardsTrigger(lottery.client, lottery.configs);
              await lottery.getCurrentRoundTrigger(lottery.client, lottery.viewingKey, lottery.configs.current_round_number);
              await lottery.getPaginatedUserTicketsTrigger(lottery.client, lottery.viewingKey, lottery.paginationValues.page, lottery.paginationValues.page_size);
              await lottery.getSEFIBalance();
              lottery.setTicketsCount('0');
              lottery.setManualTickets();
              
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
          {lottery.currentRoundUserTicketsCount && lottery.currentRoundUserTicketsCount > 0 ? (
            <h6>
              You have bought <span>{lottery.currentRoundUserTicketsCount} tickets</span> for this round
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
                lottery.configs.per_ticket_bulk_discount,
                parseInt(lottery.ticketsCount) | 0,
                lottery.currentRoundsState.round_ticket_price,
              ).finalPrice / 1000000,
            )} SEFI`}
          </h6>
        </div>
        <div className="row-footer">
          <p>Disccount</p>
          <h6>
            {calcBulkDiscountTicketPrice(
              lottery.configs.per_ticket_bulk_discount,
              parseInt(lottery.ticketsCount) | 0,
              lottery.currentRoundsState.round_ticket_price,
            ).discount + '%'}
          </h6>
        </div>
      </div>
    </Modal>
  );
});

export default BuyTicketsModal;
