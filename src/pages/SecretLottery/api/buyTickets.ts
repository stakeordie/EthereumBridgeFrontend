import { TxsResponse } from "secretjs";
import { IClientState } from "../../../stores/lottery-context/ClientContext";
import entropy from "../../../utils/secret-lottery/entropy";
const { fromUtf8 } = require("@iov/encoding");

export default async (client: IClientState, tokenAddress: string, contractAddress: string, tickets: string[], amount: string) => {
    let msg_json = {
        buy_tickets: {
            entropy: entropy(27),
            tickets
        }
    }
    let msg = btoa(JSON.stringify(msg_json))
    let handleMsg = { send: { recipient: contractAddress, amount, msg } };

    let dynamicFees =
        tickets.length <= 5 ? feesAmount5Less :
        tickets.length <= 25 ? feesAmount25Less :
        tickets.length <= 50 ? feesAmount50Less :
        tickets.length <= 75 ? feesAmount75Less :
        tickets.length <= 100 ? feesAmount100Less :
        tickets.length <= 100 ? feesAmount125Less :
        tickets.length <= 150 ? feesAmount150Less :
        tickets.length <= 175 ? feesAmount175Less :
        tickets.length <= 200 ? feesAmount200Less :
        tickets.length <= 225 ? feesAmount225Less :
        tickets.length <= 250 ? feesAmount250Less :
        tickets.length <= 275 ? feesAmount275Less :
        tickets.length <= 300 ? feesAmount300Less :
        tickets.length <= 325 ? feesAmount325Less :
        tickets.length <= 350 ? feesAmount350Less :
        tickets.length <= 375 ? feesAmount375Less :
        tickets.length <= 400 ? feesAmount400Less :
        tickets.length <= 425 ? feesAmount425Less :
        tickets.length <= 450 ? feesAmount450Less :
        tickets.length <= 475 ? feesAmount475Less :
        tickets.length <= 500 ? feesAmount500Less :
        tickets.length > 500 ? feesAmount500More :
        undefined

    const { transactionHash } = await client.execute.execute(tokenAddress, handleMsg, undefined, undefined, dynamicFees);

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
        return true
    } else {
        throw Error(tx.raw_log)
    }
}

const feesAmount5Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "1500000",
}
const feesAmount25Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "2500000",
}
const feesAmount50Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "3500000",
}
const feesAmount75Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "5000000",
}
const feesAmount100Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "6000000",
}
const feesAmount125Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "7000000",
}
const feesAmount150Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "8000000",
}
const feesAmount175Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "9250000",
}
const feesAmount200Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "11000000",
}
const feesAmount225Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "12500000",
}
const feesAmount250Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "13500000",
}
const feesAmount275Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "14500000",
}
const feesAmount300Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "16000000",
}
const feesAmount325Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "17000000",
}
const feesAmount350Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "18500000",
}
const feesAmount375Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "19500000",
}
const feesAmount400Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "21000000",
}
const feesAmount425Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "22500000",
}
const feesAmount450Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "23500000",
}
const feesAmount475Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "24500000",
}
const feesAmount500Less = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "25500000",
}
const feesAmount500More = {
    amount: [{ amount: "500000", denom: "uscrt" }],
    gas: "26500000",
}