import { IClientState } from "../../../stores/lottery-context/ClientContext";

export default async (
    client: IClientState,
    contractAddress: string,
    stakingVK: string
) => {
    try {
        let queryMsg = { 
            rewards: { 
                address: process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS,
                key: stakingVK, 
                height: (await client.execute.getBlock()).header.height 
            } 
        };

        const response = await client.query.queryContractSmart(contractAddress, queryMsg);
       return response.rewards
    } catch (e){
        console.log(e)
    }
}

export interface IStakingRewads {
    rewards: string,
}