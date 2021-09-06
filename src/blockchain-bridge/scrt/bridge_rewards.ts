import { CosmWasmClient, ExecuteResult, SigningCosmWasmClient } from 'secretjs';
import { JsonObject, StdFee } from 'secretjs/types/types';
import { Snip20Send } from './snip20';
import { AsyncSender } from './asyncSender';

interface IQueryRewards {
  rewards: {
    rewards: string;
  };
}

interface IQueryDeposit {
  deposit: {
    deposit: string;
  };
}

interface IQueryRewardPoolBalance {
  reward_pool_balance: {
    balance: string;
  };
}

export const QueryRewards = async (params: {
  cosmJS: CosmWasmClient;
  contract: string;
  address: string;
  height?: string;
  key: string;
}): Promise<JsonObject> => {
  const { cosmJS, contract, address, height, key } = params;

  let queryMsg = {
    rewards: {
      address,
      key,
    },
  };

  if (height) {
    queryMsg.rewards['height'] = Number(height);
  }

  const result: IQueryRewards = await cosmJS.queryContractSmart(contract, queryMsg);

  return result.rewards.rewards;
};

export const QueryDeposit = async (params: {
  cosmJS: CosmWasmClient;
  contract: string;
  address: string;
  key: string;
}): Promise<JsonObject> => {
  const { cosmJS, contract, address, key } = params;

  let result: IQueryDeposit = await cosmJS.queryContractSmart(contract, {
    deposit: {
      address,
      key,
    },
  });

  return result.deposit.deposit;
};

export const QueryRewardPoolBalance = async (params: {
  cosmJS: SigningCosmWasmClient;
  contract: string;
}): Promise<JsonObject> => {
  const { cosmJS, contract } = params;

  return await cosmJS.queryContractSmart(contract, {
    deposit: {},
  });
};

export const DepositRewards = async (params: {
  secretjs: AsyncSender;
  recipient: string;
  address: string;
  amount: string;
  fee?: StdFee;
}): Promise<string> => {
  let tx: any;
  tx = await Snip20Send({
    msg: 'eyJkZXBvc2l0Ijp7fX0K', // '{"deposit":{}}' -> base64
    ...params,
  });

  if(tx?.code){
    throw new Error(tx?.raw_log)
  }
  
  console.log(tx)
  return 'yooyoo';
};

export const Redeem = async (params: {
  secretjs: AsyncSender;
  address: string;
  amount: string;
  fee?: StdFee;
}): Promise<ExecuteResult> => {
  const { secretjs, address, amount, fee } = params;

  let result = await secretjs.asyncExecute(address, {
    redeem: {
      amount,
    },
  }, undefined, undefined, fee);
  
  if(result?.code){
    throw new Error(result?.raw_log)
  }
  return result;
};

export const Claim = async (params: { secretjs: AsyncSender; address: string }): Promise<ExecuteResult> => {
  const { secretjs, address } = params;

  let result = await secretjs.asyncExecute(address, {
    claim_reward_pool: {},
  });

  return result;
};
