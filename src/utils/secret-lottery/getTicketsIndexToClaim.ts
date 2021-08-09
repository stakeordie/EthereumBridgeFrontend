import { IUserTicket } from "../../pages/SecretLottery/api/getUserRoundPaginatedTickets";


export default (userTickets: IUserTicket[], ticketsToClaim: IUserTicket[]) => {
    let userTicketsModified:IUserTicket[] = JSON.parse(JSON.stringify([...userTickets]));
    let results: number[] = [];
    for (let ticketToClaim of ticketsToClaim) {
        const indexFound = userTicketsModified.findIndex((userTicket) => userTicket.ticket === ticketToClaim.ticket && userTicket.created_timestamp === ticketToClaim.created_timestamp && !userTicket.claimed_reward)
        if (indexFound === -1) continue
        results.push(indexFound)
        userTicketsModified[indexFound].claimed_reward = true;
    }

    return results
}