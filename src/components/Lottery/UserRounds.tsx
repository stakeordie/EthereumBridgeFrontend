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

    if (!client || !viewkey || !paginatedUserRounds) return null;

    console.log(paginatedUserRounds);

    return (
        <React.Fragment>

            <div className="box-tickets">

                <div className="box-tickets-title">
                    <h2>Your Tickets</h2>
                </div>

                <div className="tickets-result">

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
                                    id="ticket-button"
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

            </div>

            {/* Old Versuib */}

            {/* <div className="row" style={{ justifyContent: "center", margin: "0px" }}>
                <h2>Your Tickets</h2>
            </div>
            <table className="table table-striped table-dark" style={{ margin: "20px" }}>
                <thead>
                    <tr>
                        <th scope="col"></th>
                        <th scope="col">Round</th>
                        <th scope="col">End Date</th>
                        <th scope="col">Drafted Ticket</th>
                        <th scope="col">My Tickets</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        paginatedUserRounds &&
                        paginatedUserRounds.rounds.map((userRound, index) =>
                            <React.Fragment>
                                <tr key={index}>
                                    <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                                        {
                                            userRound.drafted_ticket &&
                                            <button type="button" className="btn btn-secondary"
                                                onClick={() => {
                                                    //setSearchState("")
                                                    setRoundViewer(userRound)
                                                }}
                                            > <i className="fas fa-eye"></i></button>
                                        }
                                    </td>
                                    <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                                        {userRound.round_number}
                                    </td>
                                    <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                                        {}
                                    </td>
                                    <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                                        {userRound.drafted_ticket ? userRound.drafted_ticket!.split('').join(' ') : " - "}
                                    </td>
                                    <td style={{ display: "table-cell", verticalAlign: "middle" }}>
                                        {
                                            <button className={`btn btn-info`} onClick={() => setUserRoundTicketsModal({show: true, selectedUserRound: userRound, userTicketsCount: paginatedUserRounds.user_tickets_count[index]})}>
                                                 {paginatedUserRounds.user_tickets_count[index] + " Tickets"}
                                            </button>
                                        }
                                    </td>
                                </tr>
                            </React.Fragment>
                        )
                    }
                </tbody>
            </table> */}

            <UserRoundTicketsModal 
                userRoundTicketsModal={userRoundTicketsModal}
                setUserRoundTicketsModal={setUserRoundTicketsModal}
            />
        </React.Fragment>

    )
}