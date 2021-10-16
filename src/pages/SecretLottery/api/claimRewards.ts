import { TxsResponse } from 'secretjs';
import { StdFee } from 'secretjs/types/types';
import { IClientState } from '../../../stores/lottery-context/ClientContext';
import entropy from '../../../utils/secret-lottery/entropy';
const { fromUtf8 } = require('@iov/encoding');

export default async (client: IClientState, contractAddress: string, round: number, tickets_index: number[]) => {
  let handleMsg = {
    claim_rewards: {
      round,
      tickets_index,
    },
  };
  const calculatedFee = (8000 * tickets_index.length + 300000).toString();
  const fee: StdFee = {
    amount: [{ denom: 'uscrt', amount: calculatedFee }],
    gas: calculatedFee,
  };
  const { transactionHash } = await client.execute.execute(
    contractAddress,
    handleMsg,
    'Claiming rewards for lottery',
    [],
    fee,
  );

  const tx: TxsResponse = await new Promise((accept, reject) => {
    const interval = setInterval(async () => {
      try {
        //@ts-ignore
        const tx = await client.execute.restClient.txById(transactionHash, false);
        accept(tx);
        clearInterval(interval);
      } catch (error) {
        //console.error(error);
      }
    }, 2000);
  });

  if (tx.data.length > 0) {
    return true;
  } else {
    throw Error(tx.raw_log);
  }
};
