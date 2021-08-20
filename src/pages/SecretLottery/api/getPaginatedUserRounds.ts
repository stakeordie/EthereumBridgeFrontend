import { IClientState } from "../../../stores/lottery-context/ClientContext";
import { IRound } from "./getRounds";

export default async (
    client: IClientState,
    contractAddress: string,
    key: string,
    page: number,
    page_size: number
) => {
    try {
        let queryMsg = { get_paginated_user_rounds: { address: client.accountData.address, key: key, page, page_size } };
        const response = await client.query.queryContractSmart(contractAddress, queryMsg);
        const responseJSON = JSON.parse(atob(response)).get_paginated_user_rounds
        return responseJSON
    } catch (e){
        if(e.message.includes("User+VK not valid!")){
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