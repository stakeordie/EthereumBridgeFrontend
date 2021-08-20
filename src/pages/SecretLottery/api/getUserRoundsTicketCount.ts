import { IClientState } from "../../../stores/lottery-context/ClientContext";

export default async (
    client: IClientState,
    contractAddress: string,
    key: string,
    round_numbers: number[]
) => {
    try {
        let queryMsg = { get_user_rounds_ticket_count: { address: client.accountData.address, key, round_numbers } };
        const response = await client.query.queryContractSmart(contractAddress, queryMsg);
        const responseJSON =  JSON.parse(atob(response)).get_user_rounds_ticket_count
        return responseJSON
    } catch (e){
        if(e.message.includes("User+VK not valid!")){
            localStorage.clear();
            window.location.reload();
        }
        return {
            user_rounds_ticket_count: []
        }
    }
}