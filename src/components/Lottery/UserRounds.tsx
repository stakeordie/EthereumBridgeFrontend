import React, { useEffect, useState } from "react"
import moment from 'moment';
import CreateViewkey from "./CreateViewkey";
import BuyTicketsModal from "./BuyTicketsModal";
import { useStores } from "stores";
import { observer } from "mobx-react";
import UserRoundTicketsModal from "./UserRoundTicketsModal";
import { Accordion } from "semantic-ui-react";
import { IRound } from "pages/SecretLottery/api/getRounds";

export default observer(() => {
  const { lottery } = useStores();
  const [active, setActive] = useState<boolean>(false);
  const [visibleTickets,setVisibleTickets] = useState<IRound[]>([]);
  const [hiddenTickets,setHiddenTickets] = useState<IRound[]>([]);
  const maxTicketsShown = 5;

  useEffect(()=>{
    const visible = lottery.paginatedUserRounds?.rounds.filter((_,i)=> i < maxTicketsShown );
    const hidden = lottery.paginatedUserRounds?.rounds.filter((_,i)=> i >= maxTicketsShown );

    setVisibleTickets(visible);
    setHiddenTickets(hidden);

  },[lottery.paginatedUserRounds])
    return (
        <React.Fragment>
            <div className="box-tickets">
              <Accordion>
                <Accordion.Title active={active} >

                    <div className="box-tickets-title">
                        <h2>Your Tickets</h2>
                    </div>
                    {(!lottery.viewingKey)
                        ? <div className='connect-wallet-container'> 
                            <span>Connect your wallet to view your tickets</span> 
                            <CreateViewkey menu='SEFI' />
                          </div>
                        : <div className="tickets-result">

                                {
                                    lottery.paginatedUserRounds && lottery.paginatedUserRounds.rounds.length > 0 ?
                                    <>
                                    <h6 id="title">Round</h6>
                                    <h6 id="title">End Date</h6>
                                    <h6 id="title">Winning Ticket</h6>
                                    <h6 id="title">My Tickets</h6>
                                    {
                                      visibleTickets?.map((userRound, index) =>
                                        <div className='ticket-row' key={`ticket-${index}`}>
                                            <h6 key={index}>{userRound.round_number}</h6>
                                            <h6>{userRound.round_expected_end_timestamp ? moment.unix(userRound.round_expected_end_timestamp).format('ddd D MMM, HH:mm') : " - "}</h6>
                                            <h6>{userRound.drafted_ticket ? userRound.drafted_ticket! : " - "}</h6>
                                            <button
                                                id="button-outline"
                                                onClick={() => lottery.setUserRoundTicketsModal(true,userRound,lottery.paginatedUserRounds.user_tickets_count[index])}
                                            >{lottery.paginatedUserRounds.user_tickets_count[index] + " Tickets"}
                                            </button>
                                        </div>
                                      )
                                    }
                                    </>
                                    : <div className='no-tickets-container'>
                                        <img src='/static/empty-ticket.png' alt="empty ticket" width='100px' />
                                        <p> You haven't bought any tickets yet</p>
                                        <BuyTicketsModal>
                                            <button disabled={!lottery.viewingKey || !lottery.client.execute || lottery.calculating} className="button-primary-lg">
                                                Buy Tickets
                                            </button>
                                        </BuyTicketsModal>
                                    </div>
                                }
                            </div>
                    }
                </Accordion.Title>
                <Accordion.Content active={active}>
                <div className="tickets-result collapse">
                  {
                    hiddenTickets?.map((userRound, index) =>
                      <div className='ticket-row' key={`ticket-${index}`}>
                          <h6 key={index}>{userRound.round_number}</h6>
                          <h6>{userRound.round_expected_end_timestamp ? moment.unix(userRound.round_expected_end_timestamp).format('ddd D MMM, HH:mm') : " - "}</h6>
                          <h6>{userRound.drafted_ticket ? userRound.drafted_ticket! : " - "}</h6>
                          <button
                              id="button-outline"
                              onClick={() => lottery.setUserRoundTicketsModal(true,userRound,lottery.paginatedUserRounds.user_tickets_count[index])}
                          >{lottery.paginatedUserRounds.user_tickets_count[index] + " Tickets"}
                          </button>
                      </div>
                    )
                  }
                </div>
                </Accordion.Content>
                {
                  (lottery.paginatedUserRounds && lottery.paginatedUserRounds.rounds.length > 0 && lottery.viewingKey !== 'unlock')
                  && <div className="show-detail" onClick={() => setActive(!active)}>
                      <button className="button-collapse-detail">
                          <div className="button-content">
                              {active ? <h6>Hide previous rounds</h6> : <h6>View previous rounds</h6>}
                              <img           
                                  src={active ? "/static/chevron-up.svg" : "/static/chevron-right.svg"}
                                  alt="chevron down icon"
                              />
                          </div>
                      </button>
                  </div>
                }
              </Accordion>
            </div>
            <UserRoundTicketsModal />
        </React.Fragment>

    )
})
