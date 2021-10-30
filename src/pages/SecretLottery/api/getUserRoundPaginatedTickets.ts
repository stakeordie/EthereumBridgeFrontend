import { IClientState } from "../../../stores/lottery-context/ClientContext";

export default async (
    client: IClientState,
    contractAddress: string,
    key: string,
    round_number: number,
    page: number,
    page_size: number
) => {
    try {
        let queryMsg = { get_user_round_paginated_tickets: { address: client.accountData.address, key, round_number, page, page_size } };
        const response = await client.query.queryContractSmart(contractAddress, queryMsg);
        const responseJSON =  JSON.parse(atob(response)).get_user_round_paginated_tickets
        return responseJSON
    } catch (e){
        if(e.message.includes("User+VK not valid!")){
            localStorage.clear();
            window.location.reload();
        }
        return {
            get_user_round_paginated_tickets: []
        }
    }
}

export const getUserRoundPaginatedTicketsWithPermit = async (
  client: IClientState,
  contractAddress: string,
  key: string,
  round_number: number,
  page: number,
  page_size: number
) => {
  try {
    if (!client) return;
    let query = { get_user_round_paginated_tickets: { address: client.accountData.address, key, round_number, page, page_size } };
    const permit = JSON.parse(localStorage.getItem (
      `lottery_permit_${client.accountData.address}`
    ));
    const queryWithPermit = { with_permit: { query, permit } }
    const response = await client.query.queryContractSmart(
      contractAddress, queryWithPermit
    );
    return response.get_user_round_paginated_tickets
  } catch (e) {
    if (e.message.includes("User+VK not valid!")) {
      localStorage.clear();
      window.location.reload();
    }
    return {
      get_user_round_paginated_tickets: []
    }
  }
}

export interface IUserTicket {
    round_number: number,
    ticket: string,
    created_timestamp: number,
    claimed_reward: boolean,
    claimed_timestamp: number | null
}
