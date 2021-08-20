import { SigningCosmWasmClient } from "secretjs"
import { IClientState } from "../../../stores/lottery-context/ClientContext";

export default async (client: IClientState, contractAddress: string) => {
    try {
        const response = await window.keplr.getSecret20ViewingKey(process.env.CHAIN_ID,contractAddress)
        const balanceResponse = await client.query.queryContractSmart(contractAddress, {
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