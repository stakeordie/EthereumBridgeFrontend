import React, { Dispatch, useContext, useEffect, useState } from "react";
import { useStores } from 'stores';
import { Col, Modal, OverlayTrigger, Popover, Row, Tooltip } from "react-bootstrap";
import { Button } from 'semantic-ui-react';
import claimRewards from "../../pages/SecretLottery/api/claimRewards";
import getBalance from "../../pages/SecretLottery/api/getBalance";
import { IRound } from "../../pages/SecretLottery/api/getRounds";
import getUserRoundPaginatedTickets, { IUserTicket } from "../../pages/SecretLottery/api/getUserRoundPaginatedTickets";
import { BalancesDispatchContext } from "../../stores/lottery-context/BalancesContext";
import { ClientContext, IClientState } from "../../stores/lottery-context/ClientContext";
import { ViewKeyContext } from "../../stores/lottery-context/ViewKeyContext";
import formatNumber from "../../utils/secret-lottery/formatNumber";
import getPrizedTicketResults, { IPrizedTicketResults } from "../../utils/secret-lottery/getPrizedTicketResults";
import getTicketsIndexToClaim from "../../utils/secret-lottery/getTicketsIndexToClaim";
import getWinningTicketsCount from "../../utils/secret-lottery/getWinningTicketsCount";
import { errorNotification } from "../../utils/secret-lottery/notifications";

export default ({
    userRoundTicketsModal,
    setUserRoundTicketsModal
}: {
    userRoundTicketsModal: { show: boolean, selectedUserRound: IRound | null, userTicketsCount: number | null },
    setUserRoundTicketsModal: Dispatch<{ show: boolean, selectedUserRound: IRound | null, userTicketsCount: number | null }>
}) => {

    let { theme } = useStores();

    const client = useContext(ClientContext);
    const viewkey = useContext(ViewKeyContext);
    const balancesDispatch = useContext(BalancesDispatchContext);
    
    const ticketPageSize = 500;
    const [userRoundTickets, setUserRoundTickets] = useState<IUserTicket[] | null>(null)
    const [loadingClaimReward, setLoadingClaimReward] = useState<boolean>(false)

    useEffect(() => {
        if (client && viewkey && userRoundTicketsModal.selectedUserRound && userRoundTicketsModal.userTicketsCount) {
            setUserRoundTickets(null)
            getUserRoundPaginatedTicketsTrigger(client, viewkey, userRoundTicketsModal.selectedUserRound, userRoundTicketsModal.userTicketsCount)
        }
    }, [userRoundTicketsModal])


    const getUserRoundPaginatedTicketsTrigger = async (client: IClientState, viewkey: string, round: IRound, userTicketsCount: number) => {
        // To get all the tickets depending on the amount of tickets, we will section this by the max size of each request
        const requestsNumber = Math.ceil(userTicketsCount / ticketPageSize);
        let allTickets: IUserTicket[] = [];
        for (var i = 0; i < requestsNumber; i++) {
            const response = await getUserRoundPaginatedTickets(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, viewkey, round.round_number, i, ticketPageSize)
            allTickets = allTickets.concat(response.user_round_paginated_tickets)
        }
        setUserRoundTickets(allTickets)
    } 

    const getSEFIBalance = async () => {
        if (!client) return null
        const response = await getBalance(client, process.env.SCRT_GOV_TOKEN_ADDRESS);
        const accountData = await client.execute.getAccount(client.accountData.address);
        balancesDispatch({
            native: parseInt(accountData ? accountData.balance[0].amount : "0"),
            SEFI: response
        })
    }
    
    const calcTotalRewards = (draftedTicket: string, tickets: IUserTicket[], round: IRound) => {
        if (!round.reward_distribution) return 0

        const prizedTickets = getPrizedTicketResults(draftedTicket, tickets);
        let totalExpectedToClaimRewards = 0;

        if (prizedTickets.sequence_1.length > 0) {
            totalExpectedToClaimRewards = totalExpectedToClaimRewards + prizedTickets.sequence_1.length * parseInt(round.reward_distribution.sequence_1_reward_per_ticket!);
        }
        if (prizedTickets.sequence_2.length > 0) {
            totalExpectedToClaimRewards = totalExpectedToClaimRewards + prizedTickets.sequence_2.length * parseInt(round.reward_distribution.sequence_2_reward_per_ticket!);
        }
        if (prizedTickets.sequence_3.length > 0) {
            totalExpectedToClaimRewards = totalExpectedToClaimRewards + prizedTickets.sequence_3.length * parseInt(round.reward_distribution.sequence_3_reward_per_ticket!);
        }
        if (prizedTickets.sequence_4.length > 0) {
            totalExpectedToClaimRewards = totalExpectedToClaimRewards + prizedTickets.sequence_4.length * parseInt(round.reward_distribution.sequence_4_reward_per_ticket!);
        }
        if (prizedTickets.sequence_5.length > 0) {
            totalExpectedToClaimRewards = totalExpectedToClaimRewards + prizedTickets.sequence_5.length * parseInt(round.reward_distribution.sequence_5_reward_per_ticket!);
        }
        if (prizedTickets.sequence_6.length > 0) {
            totalExpectedToClaimRewards = totalExpectedToClaimRewards + prizedTickets.sequence_6.length * parseInt(round.reward_distribution.sequence_6_reward_per_ticket!);
        }

        return totalExpectedToClaimRewards
    }

    const getPrizeValueFromTicket = (round: IRound, ticketResults: IPrizedTicketResults) => {
        if (!round.drafted_ticket || !round.reward_distribution) return 0
        let accumutatedTicketRewards = 0;

        if (ticketResults.sequence_1.length > 0) {
            accumutatedTicketRewards = accumutatedTicketRewards + parseInt(round.reward_distribution.sequence_1_reward_per_ticket);
        }

        if (ticketResults.sequence_2.length > 0) {
            accumutatedTicketRewards = accumutatedTicketRewards + parseInt(round.reward_distribution.sequence_2_reward_per_ticket);
        }

        if (ticketResults.sequence_3.length > 0) {
            accumutatedTicketRewards = accumutatedTicketRewards + parseInt(round.reward_distribution.sequence_3_reward_per_ticket);
        }

        if (ticketResults.sequence_4.length > 0) {
            accumutatedTicketRewards = accumutatedTicketRewards + parseInt(round.reward_distribution.sequence_4_reward_per_ticket);
        }

        if (ticketResults.sequence_5.length > 0) {
            accumutatedTicketRewards = accumutatedTicketRewards + parseInt(round.reward_distribution.sequence_5_reward_per_ticket);
        }

        if (ticketResults.sequence_6.length > 0) {
            accumutatedTicketRewards = accumutatedTicketRewards + parseInt(round.reward_distribution.sequence_6_reward_per_ticket);
        }

        return accumutatedTicketRewards
    }

    const remainingToClaimTickets = (draftedTicket: string, tickets: IUserTicket[], round: IRound) => {
        if (!round.reward_distribution) return {
            tickets: [],
            remainingPrizeToClaim: 0
        }

        let remainingToClaimTickets: IUserTicket[] = [];

        const prizedTickets = getPrizedTicketResults(draftedTicket, tickets);

        for (let ticket of tickets) {
            if (
                prizedTickets.sequence_1.find((prizedTicket) => prizedTicket.ticket === ticket.ticket && !ticket.claimed_reward) ||
                prizedTickets.sequence_2.find((prizedTicket) => prizedTicket.ticket === ticket.ticket && !ticket.claimed_reward) ||
                prizedTickets.sequence_3.find((prizedTicket) => prizedTicket.ticket === ticket.ticket && !ticket.claimed_reward) ||
                prizedTickets.sequence_4.find((prizedTicket) => prizedTicket.ticket === ticket.ticket && !ticket.claimed_reward) ||
                prizedTickets.sequence_5.find((prizedTicket) => prizedTicket.ticket === ticket.ticket && !ticket.claimed_reward) ||
                prizedTickets.sequence_6.find((prizedTicket) => prizedTicket.ticket === ticket.ticket && !ticket.claimed_reward)
            ) {
                remainingToClaimTickets.push(ticket)
            }
        }

        return {
            tickets: remainingToClaimTickets,
            remainingPrizeToClaim: calcTotalRewards(draftedTicket, remainingToClaimTickets, round)
        }
    }

    const claimButtonLogic = async (round: IRound, userRoundTickets: IUserTicket[]) => {
        if (!client || !viewkey || !userRoundTicketsModal.selectedUserRound || !userRoundTicketsModal.userTicketsCount) return
        setLoadingClaimReward(true)
        try {
            let ticketIndexes: number[] = [];

            ticketIndexes = getTicketsIndexToClaim(
                userRoundTickets, remainingToClaimTickets(round.drafted_ticket!, userRoundTickets, round).tickets
            )

            await claimRewards(
                client,
                process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS,
                round.round_number,
                ticketIndexes
            );

            await getUserRoundPaginatedTicketsTrigger(client, viewkey, userRoundTicketsModal.selectedUserRound, userRoundTicketsModal.userTicketsCount)
            await getSEFIBalance()

            setLoadingClaimReward(false)
        }
        catch (e) {
            errorNotification(e)
            setLoadingClaimReward(false)
        }

    }

    const RenderTickets = ({ userRoundTickets, round }: { userRoundTickets: IUserTicket[], round: IRound }) => {
        let i, j, chunk = 5;
        let renderSections = [];
        const userRoundTicketsCopy: IUserTicket[] = JSON.parse(JSON.stringify(userRoundTickets));

        // if drafted sort
        if (round.drafted_ticket) {
            userRoundTicketsCopy.sort((a, b) => {
                return (
                    getPrizeValueFromTicket(round, getPrizedTicketResults(round.drafted_ticket!, [b]))
                    -
                    getPrizeValueFromTicket(round, getPrizedTicketResults(round.drafted_ticket!, [a]))
                )
            })
        }

        for (i = 0, j = userRoundTicketsCopy.length; i < j; i += chunk) {
            let ticketColumns = userRoundTicketsCopy.slice(i, i + chunk).map((userTicket) => {
                let ticketPrizes = null;
                let accumutatedTicketRewards = null;
                let ticketSequence = "";

                if (round.drafted_ticket) {
                    ticketPrizes = getPrizedTicketResults(round.drafted_ticket, [userTicket])
                    accumutatedTicketRewards = getPrizeValueFromTicket(round, ticketPrizes);
                    
                    if (ticketPrizes.sequence_6.length) ticketSequence = "Matched all 6"
                    else if (ticketPrizes.sequence_5.length) ticketSequence = "Matched first 5"
                    else if (ticketPrizes.sequence_4.length) ticketSequence = "Matched first 4"
                    else if (ticketPrizes.sequence_3.length) ticketSequence = "Matched first 3"
                    else if (ticketPrizes.sequence_2.length) ticketSequence = "Matched first 2"
                    else if (ticketPrizes.sequence_1.length) ticketSequence = "Matched first 1"
                    else ticketSequence = "Matched 0 Sequence" 
                }

                return (
                    <div className="ticket">
                        {
                            round.drafted_ticket ?
                                <OverlayTrigger placement="top" rootClose
                                    overlay={
                                        <Popover id="popover-basic">
                                        <Popover.Content>
                                                <div className="popover-content">
                                                    <p><strong>Ticket {userTicket.ticket}</strong></p>
                                                    <p>{ticketSequence}</p>
                                                    <p>Ticket Rewards: {(accumutatedTicketRewards ? formatNumber(accumutatedTicketRewards! / 1000000) : 0)} </p>
                                                </div>
                                        </Popover.Content>
                                    </Popover>
                                }>
                                    <button className={`ticket-button-${!ticketPrizes ? "normal" : ticketPrizes.sequence_1.length > 0 ? "winner" : "no-winner"}`}>
                                        {userTicket.ticket}
                                    </button>
                                </OverlayTrigger>
                                :
                                <button className='ticket-button'>
                                    {userTicket.ticket}
                                </button>
                        }
                    </div>
                )
            })

            renderSections.push(
                <div className="tickets-row">
                    {ticketColumns.map((col) => col)}
                </div>
            )
        }

        return <div className="tickets-container">
            {renderSections.map((section) => section)}
        </div>
    }

    // S T A R T - R E N D E R I N G - I N F O 
    if (userRoundTicketsModal.selectedUserRound && userRoundTicketsModal.userTicketsCount) {
        const round = userRoundTicketsModal.selectedUserRound;
        let winTicketsCount = null
        let remainingRewardTickets = null

        
        if (userRoundTickets && round.drafted_ticket) {
            remainingRewardTickets = remainingToClaimTickets(round.drafted_ticket, userRoundTickets, round)
            winTicketsCount = getWinningTicketsCount(round.drafted_ticket, userRoundTickets)
        }

        return (
            <Modal
                size="lg" centered className={`modal-tickets ${theme.currentTheme}`}
                show={userRoundTicketsModal.show}
                onHide={() => setUserRoundTicketsModal(
                    { show: false, selectedUserRound: null, userTicketsCount: null }
                )}>

                <Modal.Header
                    closeButton
                    className="modal-tickets-header"
                >
                    <Modal.Title>
                        <h6>Your Tickets <strong> Round {round.round_number}</strong></h6>
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="modal-tickets-body">
                    {
                        round.drafted_ticket
                            ?
                            <div className="body-content">

                                <div className="tickets-info">
                                    <div className="tickets-info-container">
                                        <div className="info-item">
                                            <p>Your Total Tickets: </p>
                                            <h6>{userRoundTicketsModal.userTicketsCount}</h6>
                                        </div>
                                        <div className="info-item">
                                            <p>Your Winning Tickets:</p>
                                            <h6>{winTicketsCount ? winTicketsCount : " - "}</h6>
                                        </div>
                                        <div className="info-item">
                                            <p id="winning-text">Winning Ticket:</p>
                                            <h6 id="winning-number">{round.drafted_ticket ? round.drafted_ticket!.split('').join('  ') : "? ? ? ? ? ?"}</h6>
                                        </div>
                                    </div>
                                </div>

                                <div className="earnings-info">
                                    {
                                        userRoundTickets && remainingRewardTickets &&
                                        <>
                                            <div className="row-earnings">
                                                <p>You Earned</p>
                                                <h4>{formatNumber(remainingToClaimTickets(round.drafted_ticket!, userRoundTickets, round).remainingPrizeToClaim / 1000000)}<span> SEFI</span></h4>
                                            </div>
                                            <div className="row-earning-sefi">
                                                {
                                                    remainingRewardTickets.remainingPrizeToClaim > 0 ?
                                                        <Button
                                                            fluid
                                                            color="black"
                                                            disabled={loadingClaimReward}
                                                            onClick={async () => {
                                                                claimButtonLogic(round, userRoundTickets);
                                                            }}>
                                                            {
                                                                loadingClaimReward ?
                                                                    <i className="fa fa-spinner fa-spin"></i> :
                                                                    `Claim ${formatNumber(remainingToClaimTickets(round.drafted_ticket!, userRoundTickets, round).remainingPrizeToClaim / 1000000)} SEFI`
                                                            }
                                                        </Button>
                                                        :
                                                        calcTotalRewards(round.drafted_ticket!, userRoundTickets, round) > 0
                                                            ?
                                                            "Claimed " + formatNumber(calcTotalRewards(round.drafted_ticket!, userRoundTickets, round) / 1000000) + " SEFI"
                                                            :
                                                            "No Winner Tickets"
                                                }
                                            </div>
                                        </>
                                    }

                                    {/* {round.drafted_ticket ? round.drafted_ticket!.split('').join('  ') : "? ? ? ? ? ?"} */}
                                </div>
                            </div>

                            :
                            <div className="active-round">
                                <p>Your Total Tickets    <span>{userRoundTicketsModal.userTicketsCount}</span> </p>
                            </div>
                    }



                    {!userRoundTickets && <i className="fa fa-spinner fa-spin"></i>}

                    {userRoundTickets &&
                        <RenderTickets
                            userRoundTickets={userRoundTickets}
                            round={userRoundTicketsModal.selectedUserRound}
                        />
                    }

                </Modal.Body>
            </Modal>
        )
    } else {
        return null
    }
}
