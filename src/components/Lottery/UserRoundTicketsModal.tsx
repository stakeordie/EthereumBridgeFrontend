import React, { useState } from "react";
import { useStores } from 'stores';
import { OverlayTrigger, Popover } from "react-bootstrap";
import { Modal, Loader, Icon, Popup } from 'semantic-ui-react'
import { Button } from 'semantic-ui-react';
import claimRewards from "../../pages/SecretLottery/api/claimRewards";
import { IRound } from "../../pages/SecretLottery/api/getRounds";
import  { IUserTicket } from "../../pages/SecretLottery/api/getUserRoundPaginatedTickets";
import formatNumber from "../../utils/secret-lottery/formatNumber";
import getPrizedTicketResults, { IPrizedTicketResults } from "../../utils/secret-lottery/getPrizedTicketResults";
import getTicketsIndexToClaim from "../../utils/secret-lottery/getTicketsIndexToClaim";
import getWinningTicketsCount from "../../utils/secret-lottery/getWinningTicketsCount";
import { errorNotification, successNotification } from '../../utils/secret-lottery/notifications';
import { observer } from "mobx-react";

export default observer(() => {

  let { theme,lottery } = useStores();
  const {client,viewingKey,userRoundTicketsModal,userRoundTickets,pages,currentPage,setPaginationIndex}= lottery
  const [loadingClaimReward, setLoadingClaimReward] = useState<boolean>(false)


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
    if (!client || !viewingKey || !userRoundTicketsModal.selectedUserRound || !userRoundTicketsModal.userTicketsCount) return
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

      await lottery.getUserRoundPaginatedTicketsTrigger(client, viewingKey, userRoundTicketsModal.selectedUserRound, userRoundTicketsModal.userTicketsCount)
      await lottery.getSEFIBalance()
      successNotification('Claimed Successfully', true);
      setLoadingClaimReward(false)
    }
    catch (e) {
      errorNotification(e, true)
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
      let ticketColumns = userRoundTicketsCopy.slice(i, i + chunk).map((userTicket,index) => {
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
          <div className="ticket" key={`ticket-${index}`}>
            {
              round.drafted_ticket ?
                <Popup
                  inverted
                  trigger={
                    <button className={`ticket-button-${!ticketPrizes ? "normal" : ticketPrizes.sequence_1.length > 0 ? "winner" : "no-winner"}`}>
                      {userTicket.ticket}
                    </button>
                  }
                  content={
                    <div className="popover-content">
                      <h5><strong>Ticket {userTicket.ticket}</strong></h5>
                      <p>{ticketSequence}</p>
                      <p>Ticket Rewards: {(accumutatedTicketRewards ? formatNumber(accumutatedTicketRewards! / 1000000) : 0)} </p>
                    </div>
                  }
                />
                :
                <button className='ticket-button'>
                  {userTicket.ticket}
                </button>
            }
          </div>
        )
      })

      renderSections.push(
        <div className="tickets-row" key={`row-${i}`}>
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
        className={`modal-tickets ${theme.currentTheme}`}
        open={userRoundTicketsModal.open}
        onClose={() => lottery.setUserRoundTicketsModal(false , null, null)}>

        <div className="modal-tickets-header">
          <h6>Your Tickets <strong> Round {round.round_number}</strong></h6>
          <Icon
            name='close'
            onClick={() => lottery.setUserRoundTicketsModal(false , null, null)}>
          </Icon>
        </div>

        <div className="modal-tickets-body">
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

                {
                  userRoundTickets && remainingRewardTickets &&
                  <div className="earnings-info">
                    <>
                      <div className="row-earnings">
                        <p>You Earned</p>
                        {
                          calcTotalRewards(round.drafted_ticket!, userRoundTickets, round) > 0 ?
                            <h4>{formatNumber(calcTotalRewards(round.drafted_ticket!, userRoundTickets, round) / 1000000)} <span> SEFI</span></h4>
                          :
                            <h4>{formatNumber(remainingToClaimTickets(round.drafted_ticket!, userRoundTickets, round).remainingPrizeToClaim / 1000000)}<span> SEFI</span></h4>
                        }
                      </div>
                      <div className="row-earning-sefi">
                        {
                          remainingRewardTickets.remainingPrizeToClaim > 0 ?
                            <Button
                              fluid
                              disabled={loadingClaimReward}
                              onClick={async () => {
                                claimButtonLogic(round, userRoundTickets);
                              }}>
                              {
                                loadingClaimReward ?
                                  <Loader inverted={theme.currentTheme === 'dark'} inline active size='small'/> :
                                  `Claim ${formatNumber(remainingToClaimTickets(round.drafted_ticket!, userRoundTickets, round).remainingPrizeToClaim / 1000000)} SEFI`
                              }
                            </Button>
                            :
                            calcTotalRewards(round.drafted_ticket!, userRoundTickets, round) > 0
                              ?
                              <p>Claimed: <span> {formatNumber(calcTotalRewards(round.drafted_ticket!, userRoundTickets, round) / 1000000)} SEFI</span></p>
                              :
                                <p>No Winning Tickets</p>
                        }
                      </div>
                    </>

                  </div>
                }
              </div>

              :
              <div className="active-round">
                <p>Your Total Tickets    <span>{userRoundTicketsModal.userTicketsCount}</span> </p>
              </div>
          }



          {!userRoundTickets && <Loader inline='centered' size='big'> <p id="text-loading">Loading Tickets</p> </Loader>}

          {userRoundTickets &&
            <RenderTickets
              userRoundTickets={userRoundTickets}
              round={userRoundTicketsModal.selectedUserRound}
            />
          }
          <div className='pagination-section-modal'>
            <div className='pages'>
              {
                pages.map((page)=>
                  (page == currentPage - 1 || page == currentPage + 1 || page == currentPage)
                   ? 
                    <div onClick={()=>setPaginationIndex(page)} key={`page-${page}`} className={(page === currentPage)?'page selected':'page'}>
                      {page}
                    </div>
                   : <></>

                )
              }
            </div>
          </div>

        </div>
      </Modal>
    )
  } else {
    return null
  }
})
