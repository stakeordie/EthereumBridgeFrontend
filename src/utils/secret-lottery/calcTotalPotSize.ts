import { IRound } from "../../pages/SecretLottery/api/getRounds";
import { IStakingRewads } from "../../pages/SecretLottery/api/getRoundStakingRewards";

export default (
    currentRound: IRound,
    stakingRewards: IStakingRewads
) => {
    return parseInt(currentRound.pending_staking_rewards) + parseInt(currentRound.staking_pot_size) + parseInt(stakingRewards.rewards)
}