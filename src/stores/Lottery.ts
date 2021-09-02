import { StoreConstructor } from './core/StoreConstructor';
import { action, observable } from 'mobx';
import createViewKey from 'pages/SecretLottery/api/createViewKey';
import { IClientState } from './lottery-context/ClientContext';
import getRounds, { IRound } from 'pages/SecretLottery/api/getRounds';
import getPaginatedUserRounds, { IPaginatedUserRounds } from 'pages/SecretLottery/api/getPaginatedUserRounds';
import { IBalances } from './lottery-context/BalancesContext';
import getConfigs, { IConfigs } from 'pages/SecretLottery/api/getConfigs';
import getRoundStakingRewards, { IStakingRewads } from 'pages/SecretLottery/api/getRoundStakingRewards';
import axios from 'axios';
import getUserRoundsTicketCount from 'pages/SecretLottery/api/getUserRoundsTicketCount';
import getBalance from 'pages/SecretLottery/api/getBalance';
import { CosmWasmClient, SigningCosmWasmClient } from 'secretjs';
import getUserRoundPaginatedTickets, { IUserTicket } from 'pages/SecretLottery/api/getUserRoundPaginatedTickets';
import moment from 'moment';

export class Lottery extends StoreConstructor {

  //General porposes
  @observable public client: IClientState = null;
  @observable public viewingKey: string | null = null;
  @observable public balances: IBalances | null = null;
  @observable public configs: IConfigs | null = null;
  @observable public paginatedUserRounds: IPaginatedUserRounds | null = null;
  @observable public paginationValues: {
    page_size:number,
    page:number,
  } = {
      page_size: 1000,
      page: 1
    };
  //Buy tickets modal and Current Round section
  @observable public currentRoundsState: IRound | null = null;
  @observable public calculating: boolean = false;
  @observable public calculatingMsg: 'Calculating next round ...' | 'Extending this round ...' | '' = '';
  @observable public sefiPrice: number = 0;
  @observable public currentRoundUserTicketsCount: number | null = null;
  @observable public stakingRewards: IStakingRewads | null = null;
  @observable public ticketsCount: string = '';
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
  @observable public userRoundTickets: IUserTicket[] | null = null;

  //Round viewer
  @observable public roundViewer: IRound | null = null;
  @observable public loadingRound: boolean = false;

  constructor(stores) {
    super(stores);
  }
  @action public setUserRoundTickets (v:IUserTicket[]|null){
    this.userRoundTickets = v;
  }
  @action public getUserRoundPaginatedTicketsTrigger = async (client: IClientState, viewkey: string, round: IRound, userTicketsCount: number) => {
    // To get all the tickets depending on the amount of tickets, we will section this by the max size of each request
    const ticketPageSize = 500;
    const requestsNumber = Math.ceil(userTicketsCount / ticketPageSize);
    let allTickets: IUserTicket[] = [];
    for (var i = 0; i < requestsNumber; i++) {
      const response = await getUserRoundPaginatedTickets(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, viewkey, round.round_number, i, ticketPageSize)
      allTickets = allTickets.concat(response.user_round_paginated_tickets)
    }
    this.userRoundTickets = allTickets;
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
    
    this.paginationValues.page_size = this.paginatedUserRounds.rounds.length
  };

  // QUERIES CURRENT ROUND SECTION
  @action public getCurrentRoundTrigger = async (client: IClientState, viewkey: string, current_round: number) => {
    try {
      const currentRoundUserTicketsCount = await getUserRoundsTicketCount(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, viewkey, [current_round]);
      this.currentRoundUserTicketsCount = (currentRoundUserTicketsCount.user_rounds_ticket_count[0])
      const currentRound = await getRounds(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, [current_round])
      this.currentRoundsState = (currentRound.rounds[0])
    } catch (error) {
      console.error(error)
    }
  }

  @action public async getSefiPrice() {

    try {
      const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=secret-finance&vs_currencies=usd');
      if(data['secret-finance']){
        this.sefiPrice = data['secret-finance'].usd
      }else{
        this.sefiPrice = 0.05;  
      }
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
  @action setTicketsCount (tickets:string){
    this.ticketsCount = tickets;
  }
  @action setCustomManualTickets (manualTickets:Array<string>){
    this.manualTickets = manualTickets;
  }
  @action setCalculating (b:boolean){
    this.calculating = b;
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
      this.calculating = moment.unix(this.currentRoundsState?.round_expected_end_timestamp).isBefore()
      console.log(this.currentRoundsState?.round_expected_end_timestamp)
      if(this.currentRoundsState.min_ticket_count > this.currentRoundsState.ticket_count ){
        // Not reach minimum ticket count
        this.calculatingMsg ='Extending this round ...'
      }else {
        this.calculatingMsg = 'Calculating next round ...'
      }
    } catch (error) {
      console.error(error)
    }
  }


  @action public getRoundStakingRewardsTrigger = async (client: IClientState, configs: IConfigs) => {
    const roundStakingRewards = await getRoundStakingRewards(client, configs.staking_contract.address, configs.staking_vk)
    this.stakingRewards = (roundStakingRewards);
  }

  @action public getSEFIBalance = async () => {
    if (!this.client) return null

    const response = await getBalance(this.client, process.env.SCRT_GOV_TOKEN_ADDRESS)
    const accountData = await this.client.execute.getAccount(this.client.accountData.address);
    this.balances = ({
      native: parseInt(accountData ? accountData.balance[0].amount : "0"),
      SEFI: response
    })
  }

  // QUERIES USER ROUNDS

  @action public setUserRoundTicketsModal (
    open: boolean, 
    selectedUserRound: IRound | null, 
    userTicketsCount: number | null
   ) {
        this.userRoundTicketsModal = {
        open:open,
        selectedUserRound,
        userTicketsCount,
      }    
  }

  // QUERIES ROUND VIEWER

  @action public getRoundViewer = async (index:number) => {
    try {
      this.loadingRound = true;
      const response = await getRounds(this.client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, [index]);
      this.roundViewer = (response.rounds[0]);
      this.loadingRound = false;
    } catch (error) {
      this.loadingRound = false;
      console.error(error)
    }
  }

  @action public setClient(execute:SigningCosmWasmClient,query:CosmWasmClient,address:string,balance:string){
    this.client = {
      execute,
      query,
      accountData:{
        address,
        balance
      }
    }
  }
  @action public async getConfigsTrigger(client:any){
    this.configs = await getConfigs(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS);
  }
  @action public setViewingKey(vk:string | null){
    this.viewingKey = vk;
  } 
}
