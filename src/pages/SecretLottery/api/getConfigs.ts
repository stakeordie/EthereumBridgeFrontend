import { IClientState } from "../../../stores/lottery-context/ClientContext";
const { fromUtf8 } = require("@iov/encoding");

export default async (
    client: IClientState,
    contractAddress: string,
) => {
  try {
    let queryMsg = { get_configs: { } };
    const response = await client.query.queryContractSmart(contractAddress, queryMsg);
    return JSON.parse(atob(response)).get_configs 
  } catch (error) {
    return null;
  }
}

export interface IConfigs {
    triggerer: string,
    token: {
        address: string,
        contract_hash: string
    },
    staking_contract: {
        address: string,
        contract_hash: string
    },
    staking_vk: string,
    current_round_number: number,
    per_ticket_bulk_discount: number,
    min_ticket_count_per_round: number,
    current_reserve_pot:string
}
