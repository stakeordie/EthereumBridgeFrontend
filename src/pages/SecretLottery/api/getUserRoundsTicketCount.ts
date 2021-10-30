import { IClientState } from "../../../stores/lottery-context/ClientContext";

export default async (
    client: IClientState,
    contractAddress: string,
    round_numbers: number[]
) => {
  try {
    if (!client) return;
    let query = { get_user_rounds_ticket_count: { address: client.accountData.address, round_numbers } };
    const permit = JSON.parse(localStorage.getItem(
      `lottery_permit_${client.accountData.address}`
    ));
    const queryWithPermit = { with_permit: { query, permit } }
    const response = await client.query.queryContractSmart(
      contractAddress, queryWithPermit
    );
    return response.get_user_rounds_ticket_count;
  } catch (e) {
    if (e.message.includes(
      "signature verification failed; verify correct account sequence and chain-id")
    ) {
      localStorage.clear();
      window.location.reload();
    }
    console.error('Message:', e.message);
    return {
      user_rounds_ticket_count: []
    }
  }
}
