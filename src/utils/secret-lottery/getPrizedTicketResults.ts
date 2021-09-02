import { result } from "lodash";
import { IUserTicket } from "../../pages/SecretLottery/api/getUserRoundPaginatedTickets"

export default (draftedTicket: string, tickets: IUserTicket[]) => {
    let results: IPrizedTicketResults = {
        sequence_1: [],
        sequence_2: [],
        sequence_3: [],
        sequence_4: [],
        sequence_5: [],
        sequence_6: [],
    }
    if(tickets.length == 0) return results;
    try {
      for (let ticket of tickets) {
          if (ticket.ticket.substring(0, 1) === draftedTicket.substring(0, 1)) results.sequence_1.push(ticket)
          if (ticket.ticket.substring(0, 2) === draftedTicket.substring(0, 2)) results.sequence_2.push(ticket)
          if (ticket.ticket.substring(0, 3) === draftedTicket.substring(0, 3)) results.sequence_3.push(ticket)
          if (ticket.ticket.substring(0, 4) === draftedTicket.substring(0, 4)) results.sequence_4.push(ticket)
          if (ticket.ticket.substring(0, 5) === draftedTicket.substring(0, 5)) results.sequence_5.push(ticket)
          if (ticket.ticket.substring(0, 6) === draftedTicket.substring(0, 6)) results.sequence_6.push(ticket)
      }
      
    } catch (error) {
      return results;
    }


    return results
}

export interface IPrizedTicketResults {
    sequence_1: IUserTicket[],
    sequence_2: IUserTicket[],
    sequence_3: IUserTicket[],
    sequence_4: IUserTicket[],
    sequence_5: IUserTicket[],
    sequence_6: IUserTicket[],
}
