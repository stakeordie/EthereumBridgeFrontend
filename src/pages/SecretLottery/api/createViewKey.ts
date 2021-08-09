import { TxsResponse } from "secretjs";
import { IClientState } from "../../../stores/lottery-context/ClientContext";
import entropy from "../../../utils/secret-lottery/entropy";
const { fromUtf8 } = require("@iov/encoding");

export default async (client: IClientState, contractAddress: string) => {
    let handleMsg = { create_viewing_key: {entropy: entropy(27)} };
    
    const { transactionHash } = await client.execute.execute(contractAddress, handleMsg,undefined,undefined,{
        amount: [{ amount: "500000", denom: "uscrt" }],
        gas: "200000",
    });

    const tx:TxsResponse = await new Promise((accept, reject) => {
        const interval = setInterval(async () => {
          try {
            //@ts-ignore
            const tx = await client.execute.restClient.txById(transactionHash,false);
            accept(tx);
            clearInterval(interval);
          } catch (error) {
            //console.error(error);
          }
        }, 2000);
    });

    if (tx.data.length > 0) {
        console.log(tx.data)
        return JSON.parse(fromUtf8(tx.data))
    } else {
        throw Error(tx.raw_log)
    }

}