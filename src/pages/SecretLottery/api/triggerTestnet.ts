import { TxsResponse } from "secretjs";
import { IClientState } from "../../../stores/lottery-context/ClientContext";
import entropy from "../../../utils/secret-lottery/entropy";
const { fromUtf8 } = require("@iov/encoding");

export default async (client: IClientState, contractAddress: string) => {
  let handleMsg: any = {
    trigger_close_round: {
      entropy: entropy(27),
    },
  };

  const { transactionHash: transactionHash1 } = await client.execute.execute(
    contractAddress,
    handleMsg,
    undefined,
    undefined,
    {
      amount: [{ amount: "500000", denom: "uscrt" }],
      gas: "1000000",
    }
  );

  const tx1: TxsResponse = await new Promise((accept, reject) => {
    const interval = setInterval(async () => {
      try {
        //@ts-ignore
        const tx = await client.execute.restClient.txById(transactionHash1, false);
        accept(tx);
        clearInterval(interval);
      } catch (error) {
        //console.error(error);
      }
    }, 2000);
  });

  if (tx1.data.length === 0) {
    throw Error(tx1.raw_log);
  }

  handleMsg = {
    trigger_end_and_start_round: {},
  };

  const { transactionHash: transactionHash2 } = await client.execute.execute(
    contractAddress,
    handleMsg,
    undefined,
    undefined,
    {
      amount: [{ amount: "500000", denom: "uscrt" }],
      gas: "5000000",
    }
  );

  const tx2: TxsResponse = await new Promise((accept, reject) => {
    const interval = setInterval(async () => {
      try {
        //@ts-ignore
        const tx = await client.execute.restClient.txById(transactionHash1,false);
        accept(tx);
        clearInterval(interval);
      } catch (error) {
        //console.error(error);
      }
    }, 2000);
  });

  if (tx2.data.length === 0) {
    throw Error(tx2.raw_log);
  }
};
