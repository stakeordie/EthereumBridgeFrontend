import React from "react"
import moment from 'moment';
import CreateViewkey from "./CreateViewkey";
import BuyTicketsModal from "./BuyTicketsModal";
import { useStores } from "stores";
import { observer } from "mobx-react";
import UserRoundTicketsModal from "./UserRoundTicketsModal";

export default observer(() => {
  const { lottery } = useStores();

    return (
        <React.Fragment>

            <div className="box-tickets">

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
                                {lottery.paginatedUserRounds.rounds.map((userRound, index) =>
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


            </div>
            <UserRoundTicketsModal />
        </React.Fragment>

    )
})
