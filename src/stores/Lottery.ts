import { StoreConstructor } from './core/StoreConstructor';
import { action, computed, observable } from 'mobx';
import createViewKey from 'pages/SecretLottery/api/createViewKey';
import { IClientState } from './lottery-context/ClientContext';
import { IRound } from 'pages/SecretLottery/api/getRounds';
import getPaginatedUserRounds, { IPaginatedUserRounds } from 'pages/SecretLottery/api/getPaginatedUserRounds';
import { IBalances } from './lottery-context/BalancesContext';
import { IConfigs } from 'pages/SecretLottery/api/getConfigs';
import { IStakingRewads } from 'pages/SecretLottery/api/getRoundStakingRewards';


export class Lottery extends StoreConstructor {
  //General porposes
  @observable client: IClientState = null;
  @observable viewingKey: string | null = null;
  @observable balances: IBalances | null = null;
  @observable configs: IConfigs | null = null;
  @observable paginationValues: { 
    page_size:number,
    page:number,
  } = {
    page_size:5,
    page:1
  };
  @observable paginatedUserRounds:IPaginatedUserRounds | null = null;

  //Buy tickets modal and Current Round section
  @observable currentRoundState: IRound | null = null;
  @observable sefiPrice: number = 0;  
  @observable currentRoundUserTicketsCount: number | null = null;  
  @observable stakingRewards: IStakingRewads | null = null;
  @observable ticketsCount: string = '0'; 
  @observable manualTickets: string[] = [];

  //User rounds
  @observable userRoundTicketsModal: { 
    open: boolean, 
    selectedUserRound: IRound | null, 
    userTicketsCount: number | null 
  } = {
    open: false,
    selectedUserRound: null,
    userTicketsCount: null
  };
  //Round viewer
  @observable roundViewer:IRound | null = null;

  constructor(stores) {
    super(stores);
  }

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

}
