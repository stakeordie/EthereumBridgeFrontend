import { IRound } from "pages/SecretLottery/api/getRounds";
import { IStakingRewads } from "pages/SecretLottery/api/getRoundStakingRewards";

import calcTotalPotSize from "./calcTotalPotSize";

export default (
    currentRound: IRound,
    stakingRewards: IStakingRewads
) => {
    const totalPotSize = calcTotalPotSize(currentRound, stakingRewards);
    const newTokensOnRound = (totalPotSize - parseInt(currentRound.initial_pot_size));
    
    const burn = newTokensOnRound * (currentRound.round_reward_pot_allocations.burn * 0.01)
    const triggerer = newTokensOnRound * (currentRound.round_reward_pot_allocations.triggerer * 0.01)
    const reserve = newTokensOnRound * (currentRound.round_reward_pot_allocations.reserve * 0.01)

    //const sequence_pot = totalPotSize - burn - triggerer - reserve

    const sequence1 = parseInt(currentRound.initial_sequence_pools.sequence_1) + newTokensOnRound * (currentRound.round_reward_pot_allocations.sequence_1 * 0.01)
    const sequence2 = parseInt(currentRound.initial_sequence_pools.sequence_2) + newTokensOnRound * (currentRound.round_reward_pot_allocations.sequence_2 * 0.01)
    const sequence3 = parseInt(currentRound.initial_sequence_pools.sequence_3) + newTokensOnRound * (currentRound.round_reward_pot_allocations.sequence_3 * 0.01)
    const sequence4 = parseInt(currentRound.initial_sequence_pools.sequence_4) + newTokensOnRound * (currentRound.round_reward_pot_allocations.sequence_4 * 0.01)
    const sequence5 = parseInt(currentRound.initial_sequence_pools.sequence_5) + newTokensOnRound * (currentRound.round_reward_pot_allocations.sequence_5 * 0.01)
    const sequence6 = parseInt(currentRound.initial_sequence_pools.sequence_6) + newTokensOnRound * (currentRound.round_reward_pot_allocations.sequence_6 * 0.01)

    return {
        burn,
        triggerer,
        reserve,
        sequence1,
        sequence2,
        sequence3,
        sequence4,
        sequence5,
        sequence6
    }
}
