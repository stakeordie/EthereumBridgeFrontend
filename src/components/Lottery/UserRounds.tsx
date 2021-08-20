import React, { Dispatch, useContext, useEffect, useState } from "react"
import getPaginatedUserRounds, { IPaginatedUserRounds } from "../../pages/SecretLottery/api/getPaginatedUserRounds";
import { IRound } from "../../pages/SecretLottery/api/getRounds";
import { ClientContext, IClientState } from "../../stores/lottery-context/ClientContext";
import { ViewKeyContext } from "../../stores/lottery-context/ViewKeyContext";
import UserRoundTicketsModal from "./UserRoundTicketsModal";
import moment from 'moment';

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

    const [userRoundTicketsModal, setUserRoundTicketsModal] = useState<{ show: boolean, selectedUserRound: IRound | null, userTicketsCount: number | null }>({
        show: false,
        selectedUserRound: null,
        userTicketsCount: null
    })

    useEffect(() => {
        if (client && viewkey) {
            getPaginatedUserTicketsTrigger(client, viewkey, paginationValues.page, paginationValues.page_size)
        }
    }, [client, viewkey])

    if (!client || !paginatedUserRounds) return null;

    // console.log(paginatedUserRounds);

    return (
        <React.Fragment>

            <div className="box-tickets">

                <div className="box-tickets-title">
                    <h2>Your Tickets</h2>
                </div>
                {(!viewkey)
                    ? <div>Connect Wallet</div>
                    : <div className="tickets-result">
                            <h6 id="title">Round</h6>
                            <h6 id="title">End Date</h6>
                            <h6 id="title">Winning Ticket</h6>
                            <h6 id="title">My Tickets</h6>

                            {
                                paginatedUserRounds &&
                                paginatedUserRounds.rounds.map((userRound, index) =>
                                    <>
                                        <h6 key={index}>{userRound.round_number}</h6>
                                        <h6>{userRound.round_expected_end_timestamp ? moment.unix(userRound.round_expected_end_timestamp).format('ddd D MMM, HH:mm') : " - "}</h6>
                                        <h6>{userRound.drafted_ticket ? userRound.drafted_ticket! : " - "}</h6>
                                        <button
                                            id="button-outline"
                                            onClick={
                                                () => setUserRoundTicketsModal({
                                                    show: true,
                                                    selectedUserRound: userRound,
                                                    userTicketsCount: paginatedUserRounds.user_tickets_count[index]
                                                })}
                                        >{paginatedUserRounds.user_tickets_count[index] + " Tickets"}
                                        </button>
                                    </>
                                )
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