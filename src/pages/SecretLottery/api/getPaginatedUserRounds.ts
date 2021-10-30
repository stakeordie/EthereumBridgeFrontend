import { IClientState } from "../../../stores/lottery-context/ClientContext";
import { IRound } from "./getRounds";

export default async (
  client: IClientState,
  contractAddress: string,
  page: number,
  page_size: number
) => {
  try {
    let query = { get_paginated_user_rounds: { address: client.accountData.address, page, page_size } };
    const permit = JSON.parse(localStorage.getItem(
      `lottery_permit_${client.accountData.address}`
    ));
    const queryWithPermit = { with_permit: { query, permit } }
    const response = await client.query.queryContractSmart(
      contractAddress, queryWithPermit
    );
    return response.get_paginated_user_rounds
  } catch (e){
    if (e.message.includes(
      "signature verification failed; verify correct account sequence and chain-id")
    ) {
      localStorage.clear();
      window.location.reload();
    }
    return null
  }
}

export interface IPaginatedUserRounds {
    user_tickets_count: number[],
    rounds: IRound[],
    user_tickets_round_total_count: number
}
