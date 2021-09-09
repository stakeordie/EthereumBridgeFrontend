import { IClientState } from "../../../stores/lottery-context/ClientContext";
const { fromUtf8 } = require("@iov/encoding");

export default async (
    client: IClientState,
    contractAddress: string,
    round_numbers: number[]
) => {
  try {
    let queryMsg = { get_rounds: { round_numbers } };
    const response = await client.query.queryContractSmart(contractAddress, queryMsg);
    return JSON.parse(atob(response)).get_rounds
  } catch (error) {
    return null; 
  }
}

export interface IRound {
  round_number: number,
  round_ticket_price: string,
  pending_staking_rewards: string,
  initial_pot_size: string,
  initial_sequence_pools: {
      sequence_1: string,
      sequence_2: string,
      sequence_3: string,
      sequence_4: string,
      sequence_5: string,
      sequence_6: string,
  },
  staking_pot_size: string,
  ticket_count: number,
  min_ticket_count: number,
  round_reward_pot_allocations: {
      triggerer: number,
      reserve: number,
      burn: number,
      sequence_1: number,
      sequence_2: number,
      sequence_3: number,
      sequence_4: number,
      sequence_5: number,
      sequence_6: number,
  },
  round_start_timestamp: number,
  round_expected_end_timestamp: number,
  round_end_timestamp: number | null,
  drafted_ticket: string | null,
  final_pot_size: string | null,
  reward_distribution: IRoundRewardDistribution | null
}

export interface IRoundRewardDistribution {
    triggerer_pot_size: string,
    burn_pot_size: string,
    reserve_pot_size: string,
    sequence_1_pot_size: string,
    sequence_1_ticket_win_count: number,
    sequence_1_reward_per_ticket: string,
    sequence_2_pot_size: string,
    sequence_2_ticket_win_count: number,
    sequence_2_reward_per_ticket: string,
    sequence_3_pot_size: string,
    sequence_3_ticket_win_count: number,
    sequence_3_reward_per_ticket: string,
    sequence_4_pot_size: string,
    sequence_4_ticket_win_count: number,
    sequence_4_reward_per_ticket: string,
    sequence_5_pot_size: string,
    sequence_5_ticket_win_count: number,
    sequence_5_reward_per_ticket: string,
    sequence_6_pot_size: string,
    sequence_6_ticket_win_count: number,
    sequence_6_reward_per_ticket: string,
}
