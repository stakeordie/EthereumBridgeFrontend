import { SigningCosmWasmClient } from "secretjs"
import constants from "../../../constants";
import { IClientState } from "../../../stores/lottery-context/ClientContext";

export default async (client: IClientState, contractAddress: string) => {
    try {
        const response = await window.keplr.getSecret20ViewingKey(constants.CHAIN_ID,contractAddress)
        const balanceResponse = await client.execute.queryContractSmart(contractAddress, {
            balance: {
                address: client.accountData.address,
                key: response
            }
        })
        
        return balanceResponse.balance.amount
    } catch (e) {
        return null
    }
}