import { StoreConstructor } from './core/StoreConstructor';
import { action, computed, observable } from 'mobx';
import createViewKey from 'pages/SecretLottery/api/createViewKey';
import { IClientState } from './lottery-context/ClientContext';
import getRounds, { IRound } from 'pages/SecretLottery/api/getRounds';
import getPaginatedUserRounds, { IPaginatedUserRounds } from 'pages/SecretLottery/api/getPaginatedUserRounds';
import { IBalances } from './lottery-context/BalancesContext';
import { IConfigs } from 'pages/SecretLottery/api/getConfigs';
import getRoundStakingRewards, { IStakingRewads } from 'pages/SecretLottery/api/getRoundStakingRewards';
import axios from 'axios';
import getUserRoundsTicketCount from 'pages/SecretLottery/api/getUserRoundsTicketCount';
import formatNumber from 'utils/secret-lottery/formatNumber';
import calcTotalPotSize from 'utils/secret-lottery/calcTotalPotSize';
import numeral from 'numeral';


export class Lottery extends StoreConstructor {

  //General porposes
  @observable public client: IClientState = null;
  @observable public viewingKey: string | null = null;
  @observable public balances: IBalances | null = null;
  @observable public configs: IConfigs | null = null;
  @observable public paginationValues: {
    page_size:number,
    page:number,
  } = {
    page_size:5,
    page:1
  };
  @observable public paginatedUserRounds: IPaginatedUserRounds | null = null;

  //Buy tickets modal and Current Round section
  @observable public currentRoundsState: IRound | null = null;
  @observable public sefiPrice: number = 0;
  @observable public currentRoundUserTicketsCount: number | null = null;
  @observable public stakingRewards: IStakingRewads | null = null;
  @observable public ticketsCount: string = '0';
  @observable public manualTickets: string[] = [];

  //User rounds
  @observable public userRoundTicketsModal: {
    open: boolean, 
    selectedUserRound: IRound | null, 
    userTicketsCount: number | null 
  } = {
    open: false,
    selectedUserRound: null,
    userTicketsCount: null
  };

  //Round viewer
  @observable public roundViewer: IRound | null = null;

  constructor(stores) {
    super(stores);
  }

  // Queries Index
  @action public async createViewing (menu: string, client: IClientState) {

    let contract = process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS;
    const response = await createViewKey(client, contract);
    this.viewingKey = response.create_viewing_key.key;
    localStorage.setItem(`${menu}_` + client.accountData.address, response.create_viewing_key.key);
  }

  @action public async  getPaginatedUserTicketsTrigger (
    client: IClientState,
    viewkey: string,
    page: number,
    page_size: number,
  ) {

    this.paginatedUserRounds = await getPaginatedUserRounds(
      client,
      process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS,
      viewkey,
      page - 1,
      page_size,
    );
    
  };

  // QUERIES CURRENT ROUND SECTION

  @action public async getSefiPrice() {

    try {
      const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=sefi&vs_currencies=usd');
      this.sefiPrice = data.sefi.usd
    } catch (error) {
      this.sefiPrice = 0.05;
      console.error(error);
    }

  }

  @action public setManualTickets = () => {
    const emptyArray = [];
    for (let i = 0; i < parseFloat(this.ticketsCount); i++) {
      if (this.manualTickets[i] !== "") {
        emptyArray[i] = this.manualTickets[i];
      } else {
        emptyArray.push("");
      }
    }
    this.manualTickets = emptyArray;
  }


  @action public getUserTicketsRound = async (client: IClientState, viewkey: string, current_round: number) => {
    try {

      const currentRoundUserTicketsCount = await getUserRoundsTicketCount(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, viewkey, [current_round]);
      this.currentRoundUserTicketsCount = (currentRoundUserTicketsCount.user_rounds_ticket_count[0])
    } catch (error) {
      console.error(error)
    }

  }

  @action public getCurrentRound = async (client: IClientState, current_round: number) => {
    try {
      const currentRound = await getRounds(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, [current_round])
      this.currentRoundsState = (currentRound.rounds[0])
    } catch (error) {
      console.error(error)
    }
  }

  // getCurrenRoundTrigger = Not Used in Current Round Section Component

  @action public getRoundStakingRewardsTrigger = async (client: IClientState, configs: IConfigs) => {
    const roundStakingRewards = await getRoundStakingRewards(client, configs.staking_contract.address, configs.staking_vk)
    this.stakingRewards = (roundStakingRewards);
  }

  // getSEFIBalance = Not Used in Current Round Section Component

  @action public getEstimateSEFI = (n: number): number => {
    return Math.round(formatNumber(calcTotalPotSize(this.currentRoundsState, this.stakingRewards) * (this.currentRoundsState.round_reward_pot_allocations[`sequence_${n}`] * 0.01) / 1000000) / (parseInt(this.currentRoundsState.round_ticket_price) / 1000000) * 100) / 100
  }

  @action public getEstimateUSD = (n: number): number => {
    return numeral(Math.round((formatNumber(calcTotalPotSize(this.currentRoundsState, this.stakingRewards) * (this.currentRoundsState.round_reward_pot_allocations[`sequence_${n}`] * 0.01) / 1000000) / (parseInt(this.currentRoundsState.round_ticket_price) / 1000000) * 100) * this.sefiPrice) / 100).format('$0.00');
  }

  // QUERIES USER ROUNDS

  // @action public setUserRoundTicketsModal = () => {
  //       this.userRoundTicketsModal =({
  //       open : true,
  //       selectedUserRound: userRound,
  //       userTicketsCount: this.paginatedUserRounds.user_tickets_count[index],
  //     })    
  // }

  // QUERIES ROUND VIEWER

  @action public getRoundViewer = async () => {
    try {
      const response = await getRounds(this.client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, [(this.configs.current_round_number - 1)]);
      this.roundViewer = (response.rounds[0]);
    } catch (error) {
      console.error(error)
    }
  }

}
