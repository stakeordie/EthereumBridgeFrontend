import React, { Dispatch, useContext, useEffect, useState } from "react"
import { IPaginatedUserRounds } from "../../pages/SecretLottery/api/getPaginatedUserRounds";
import { IRound } from "../../pages/SecretLottery/api/getRounds";
import { ClientContext } from "../../stores/lottery-context/ClientContext";
import { ViewKeyContext } from "../../stores/lottery-context/ViewKeyContext";
import UserRoundTicketsModal from "./UserRoundTicketsModal";
import moment from 'moment';
import CreateViewkey from "./CreateViewkey";
import BuyTicketsModal from "./BuyTicketsModal";

export default ({
    paginatedUserRounds,
    getPaginatedUserTicketsTrigger,
    paginationValues,
    setRoundViewer
}: {
    paginatedUserRounds: IPaginatedUserRounds | null
    getPaginatedUserTicketsTrigger: Function,
    paginationValues: {
        page_size: number,
        page: number
    },
    setRoundViewer: Dispatch<IRound | null>
}) => {
    const client = useContext(ClientContext);
    const viewkey = useContext(ViewKeyContext);

    const [userRoundTicketsModal, setUserRoundTicketsModal] = useState<{ open: boolean, selectedUserRound: IRound | null, userTicketsCount: number | null }>({
        open: false,
        selectedUserRound: null,
        userTicketsCount: null
    })

    useEffect(() => {
      //Move this to Lottery context
        if ( viewkey) {
          console.log('Query from useEffect (1 query)')
            getPaginatedUserTicketsTrigger(client, viewkey, paginationValues.page, paginationValues.page_size)
        }
    }, [client, viewkey])

    return (
        <React.Fragment>

            <div className="box-tickets">

                <div className="box-tickets-title">
                    <h2>Your Tickets</h2>
                </div>
                {(!viewkey)
                    ? <div className='connect-wallet-container'> 
                        <span>Connect your wallet to view your tickets</span> 
                        <CreateViewkey menu='SEFI' />
                      </div>
                    : <div className="tickets-result">

                            {
                                paginatedUserRounds && paginatedUserRounds.rounds.length > 0 ?
                                <>
                                <h6 id="title">Round</h6>
                                <h6 id="title">End Date</h6>
                                <h6 id="title">Winning Ticket</h6>
                                <h6 id="title">My Tickets</h6>
                                {paginatedUserRounds.rounds.map((userRound, index) =>
                                    <div className='ticket-row' key={`ticket-${index}`}>
                                        <h6 key={index}>{userRound.round_number}</h6>
                                        <h6>{userRound.round_expected_end_timestamp ? moment.unix(userRound.round_expected_end_timestamp).format('ddd D MMM, HH:mm') : " - "}</h6>
                                        <h6>{userRound.drafted_ticket ? userRound.drafted_ticket! : " - "}</h6>
                                        <button
                                            id="button-outline"
                                            onClick={
                                                () => setUserRoundTicketsModal({
                                                    open: true,
                                                    selectedUserRound: userRound,
                                                    userTicketsCount: paginatedUserRounds.user_tickets_count[index],

                                                })}
                                        >{paginatedUserRounds.user_tickets_count[index] + " Tickets"}
                                        </button>
                                    </div>
                                )
                            }
                                </>
                                : <div className='no-tickets-container'>
                                    <img src='/static/empty-ticket.png' alt="empty ticket" width='100px' />
                                    <p> You haven't bought any tickets yet</p>
                                    <BuyTicketsModal 
                                        getPaginatedUserTicketsTrigger={getPaginatedUserTicketsTrigger}
                                        paginationValues={paginationValues}
                                    >
                                        <button disabled={!viewkey || !client.execute} className="button-primary-lg">
                                            Buy Tickets
                                        </button>
                                    </BuyTicketsModal>
                                </div>
                            }
                        </div>
                }


            </div>
            <UserRoundTicketsModal 
                userRoundTicketsModal={userRoundTicketsModal}
                setUserRoundTicketsModal={setUserRoundTicketsModal}
            />
        </React.Fragment>

    )
}
