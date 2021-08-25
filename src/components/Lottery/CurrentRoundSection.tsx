import React from "react";
import { useContext, useEffect, useState } from "react";
import getBalance from "../../pages/SecretLottery/api/getBalance";
import getConfigs, { IConfigs } from "../../pages/SecretLottery/api/getConfigs";
import getRounds, { IRound } from "../../pages/SecretLottery/api/getRounds";
import getRoundStakingRewards, { IStakingRewads } from "../../pages/SecretLottery/api/getRoundStakingRewards";
import getUserRoundsTicketCount from "../../pages/SecretLottery/api/getUserRoundsTicketCount";
import { BalancesDispatchContext } from "../../stores/lottery-context/BalancesContext";
import { ClientContext, IClientState } from "../../stores/lottery-context/ClientContext";
import { ConfigsContext, ConfigsDispatchContext } from "../../stores/lottery-context/LotteryConfigsContext";
import { ViewKeyContext } from "../../stores/lottery-context/ViewKeyContext";
import calcTotalPotSize from "../../utils/secret-lottery/calcTotalPotSize";
import formatNumber from "../../utils/secret-lottery/formatNumber";
import BuyTicketsModal from "./BuyTicketsModal";
import moment from 'moment';
import Countdown from 'react-countdown';
import { useStores } from "stores";
import axios from "axios";
import numeral from 'numeral';
import { Accordion, Icon } from "semantic-ui-react";
export default ({
    getPaginatedUserTicketsTrigger,
    paginationValues
}: {
    getPaginatedUserTicketsTrigger: Function
    paginationValues: {
        page_size: number,
        page: number
    }
}
) => {
    const client = useContext(ClientContext);
    const viewkey = useContext(ViewKeyContext);
    const balancesDispatch = useContext(BalancesDispatchContext);
    const configs = useContext(ConfigsContext);
    const configsDispatch = useContext(ConfigsDispatchContext);

    const [currentRoundsState, setCurrentRoundsState] = useState<IRound | null>(null)
    const [sefiPrice, setSefiPrice] = useState<number>(0)
    const [currentRoundUserTicketsCount, setCurrentRoundUserTicketsCount] = useState<number | null>(null)
    const [stakingRewards, setStakingRewards] = useState<IStakingRewads | null>(null)
    const {tokens}=useStores();

    const [ticketsCount, setTicketsCount] = useState<string>("0");
    const [manualTickets, setManualTickets] = useState<string[]>([]);
    const [active,setActive]=useState<boolean>(false);

    useEffect(() => {
        getConfigsTrigger(client)
        setInterval(() => {
            getConfigsTrigger(client)
        }, 30000); // check 30 seconds
    }, [client])

    useEffect(()=>{
        //GET sefi price
        (async()=>{
            try {
                const { data } = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=sefi&vs_currencies=usd');
                setSefiPrice(data.sefi.usd)                
            } catch (error) {
                setSefiPrice(0.05)
                console.error(error);
            }
            
        })()
    },[])
    
    useEffect(()=>{
        const emptyArray=[];
        for (let i = 0; i < parseFloat(ticketsCount); i++) {
            if(manualTickets[i] !== ""){
                emptyArray[i]= manualTickets[i];
            }else{
                emptyArray.push("");
            }
        }
        setManualTickets(emptyArray);
    },[ticketsCount])

    useEffect(() => {
        if(viewkey && configs){
            getUserTicketsRound(client, viewkey, configs.current_round_number);
        }

        if (configs) {
            getCurrentRound(client, configs.current_round_number);
            getRoundStakingRewardsTrigger(client, configs)
        }
    }, [configs])

    const getConfigsTrigger = async (client: IClientState) => {
        const configs = await getConfigs(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS)
        configsDispatch(configs)
    }

    const getUserTicketsRound = async (client: IClientState, viewkey: string, current_round: number) => {
        try {
    
            const currentRoundUserTicketsCount = await getUserRoundsTicketCount(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, viewkey, [current_round]);
            setCurrentRoundUserTicketsCount(currentRoundUserTicketsCount.user_rounds_ticket_count[0])
        } catch (error) {
            console.error(error)
        }

    }
    const getCurrentRound = async (client: IClientState, current_round: number) => {
        try {
            const currentRound = await getRounds(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, [current_round])
            setCurrentRoundsState(currentRound.rounds[0])
            
        } catch (error) {
            console.error(error)
        }
    }

    const getCurrentRoundTrigger = async(client: IClientState, viewkey: string, current_round: number)=>{
        try {
            const currentRoundUserTicketsCount = await getUserRoundsTicketCount(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, viewkey, [current_round]);
            setCurrentRoundUserTicketsCount(currentRoundUserTicketsCount.user_rounds_ticket_count[0])
            const currentRound = await getRounds(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, [current_round])
            setCurrentRoundsState(currentRound.rounds[0])
        } catch (error) {
           console.error(error) 
        }
    }

    const getRoundStakingRewardsTrigger = async (client: IClientState, configs: IConfigs) => {
        const roundStakingRewards = await getRoundStakingRewards(client, configs.staking_contract.address, configs.staking_vk)
        setStakingRewards(roundStakingRewards);
    }

    const getSEFIBalance = async () => {
        // if (!client) return null
        const response = await getBalance(client, process.env.SCRT_GOV_TOKEN_ADDRESS)
        const accountData = await client.execute.getAccount(client.accountData.address);
        balancesDispatch({
            native: parseInt(accountData ? accountData.balance[0].amount : "0"),
            SEFI: response
        })
    }
    const getEstimateSEFI = (n:number):number =>{
        return Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations[`sequence_${n}`] * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100
    }

    const getEstimateUSD = (n:number):number =>{
        return numeral(Math.round((formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations[`sequence_${n}`] * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100)* sefiPrice) / 100).format('$0.00');
    }

    return (
        <React.Fragment>
            {
                (!currentRoundsState || !configs) && <i className="fa fa-spinner fa-spin" style={{ color: "white" }}></i>
            }
            {
                currentRoundsState && configs && stakingRewards &&
                <React.Fragment>
                    {/* Prize Pot */}
                    <div className="box-round">      
                        <div className="data-header hero-lottery">
                            <h4>Pot Size</h4>
                        </div>

                        <div className="data">
                            <div className="data-body">
                                <h1>
                                    {currentRoundsState && formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) / 1000000)}
                                    <span> SEFI</span>
                                </h1>
                            </div>
                            <div className="data-footer">
                                <h4>{currentRoundsState && numeral((formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) / 1000000)*sefiPrice)).format('$0,0.00')}</h4>
                            </div>
                        </div>

                        <div className="round-bottom">
                            <div className="round-bottom-content">
                            <BuyTicketsModal 
                                getPaginatedUserTicketsTrigger={getPaginatedUserTicketsTrigger}
                                paginationValues={paginationValues}
                            >
                                <button disabled={!viewkey || !client.execute} className="button-primary-lg">
                                    Buy Tickets
                                </button>
                            </BuyTicketsModal>
                           
                                <div className="round-bottom-footer">
                                    <p>You have bought <span>{currentRoundUserTicketsCount} tickets</span> for this round</p>
                                </div>
                            </div>
                        </div>

                        <div className="round-footer-tickets">
                            <div className="round-footer-tickets-item">
                                <p>Minimum Ticket Count</p>
                                <h3>{configs.min_ticket_count_per_round}</h3>
                            </div>
                            <div className="round-footer-tickets-item">
                                <p>Current Tickets</p>
                                <h3>{currentRoundsState.ticket_count}</h3>
                            </div>
                        </div>

                        {/* Add This To Buy Tickets Modal */}

                        {/* <Row style={{ justifyContent: "center", fontSize: "1.25rem", marginTop: "10px" }}>
                            {
                                "Expected to End at: " + new Date(currentRoundsState.round_expected_end_timestamp*1000).toLocaleString()
                            }
                            {
                                "Min Ticket Count: " + configs.min_ticket_count_per_round
                            }
                        </Row> */}
                    </div>

                    {/* Round Ends Countdown */}
                    <div className="counter-row">
                        <h4>
                            Round {currentRoundsState.round_number} ends in <Countdown date={(moment.unix(currentRoundsState.round_expected_end_timestamp).toDate())} daysInHours={true} />
                        </h4>
                    </div>



                    {/* Round Pot Distribution */}
                    <div className="box-round-pot">
                        <Accordion >
                            <Accordion.Title active={active} onClick={()=> setActive(!active)}>
                                <div className="round-pot-title">
                                    <h2>Round Pot Distribution </h2>
                                    <h3><Icon  name="dropdown" /></h3>
                                </div>
                                {
                                    configs && 
                                    <>
                                        <div className="box-pot-size">
                                                <div className="box-pot-size-container">
                                                    <div className="col-pot-results">
                                                        <h4>Pot Size</h4>
                                                        <h5>
                                                            {currentRoundsState && formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) / 1000000)}
                                                            <span> SEFI</span>
                                                        </h5>
                                                        <h6>{currentRoundsState && numeral(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) / 1000000)).format('$0,0.00')}</h6>
                                                    </div>
                                                    <div className="col-pot-button">
                                                        <BuyTicketsModal 
                                                            getPaginatedUserTicketsTrigger={getPaginatedUserTicketsTrigger}
                                                            paginationValues={paginationValues}
                                                        >
                                                            <button disabled={!viewkey || !client.execute} className="button-primary-lg">
                                                                Buy Tickets
                                                            </button>
                                                        </BuyTicketsModal>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                        
                                    </>
                                }
                            </Accordion.Title>
                            <Accordion.Content active={active}>
                                {
                                    configs &&
                                    <>
                                        <div className="round-info-container">
                                            <div className="row-match">
                                                <div className="col-title">
                                                    <h4>Match all 6</h4>
                                                </div>
                                                <div className="col-results">
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                </div>
                                                <div className="col-values">
                                                    <h4>{getEstimateSEFI(6)} <span>SEFI</span> </h4>
                                                    <p> {getEstimateUSD(6)}</p>
                                                </div>
                                            </div>


                                            <div className="row-match">
                                                <div className="col-title">
                                                    <h4>Match first 5</h4>
                                                </div>
                                                <div className="col-results">
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                                                </div>
                                                <div className="col-values">
                                                    <h4>{getEstimateSEFI(5)} <span>SEFI</span> </h4>
                                                    <p> {getEstimateUSD(5)}</p>
                                                </div>
                                            </div>

                                            <div className="row-match">
                                                <div className="col-title">
                                                    <h4>Match first 4</h4>
                                                </div>
                                                <div className="col-results">
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                                </div>
                                                <div className="col-values">
                                                    <h4>{getEstimateSEFI(4)} <span>SEFI</span> </h4>
                                                    <p> {getEstimateUSD(4)}</p>
                                                </div>
                                            </div>

                                            <div className="row-match">
                                                <div className="col-title">
                                                    <h4>Match first 3</h4>
                                                </div>
                                                <div className="col-results">
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                                </div>
                                                <div className="col-values">
                                                    <h4>{getEstimateSEFI(3)} <span>SEFI</span> </h4>
                                                    <p> {getEstimateUSD(3)}</p>
                                                </div>
                                            </div>

                                            <div className="row-match">
                                                <div className="col-title">
                                                    <h4>Match first 2</h4>
                                                </div>
                                                <div className="col-results">
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                                </div>
                                                <div className="col-values">
                                                    <h4>{getEstimateSEFI(2)} <span>SEFI</span> </h4>
                                                    <p> {getEstimateUSD(2)}</p>
                                                </div>
                                            </div>


                                            <div className="row-match">
                                                <div className="col-title">
                                                    <h4>Match first 1</h4>
                                                </div>
                                                <div className="col-results">
                                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                                    <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                                </div>
                                                <div className="col-values">
                                                    <h4>{getEstimateSEFI(1)} <span>SEFI</span> </h4>
                                                    <p> {getEstimateUSD(1)}</p>
                                                </div>
                                            </div>

                                            <div className="row-match">
                                                <div className="col-title">
                                                    <h4 id="burn">Burn</h4>
                                                </div>
                                                <div className="col-results">

                                                </div>
                                                <div className="col-values">
                                                    <h4>
                                                        {Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.burn * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100} <span>SEFI</span>
                                                    </h4>
                                                    <p>{numeral((Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.burn * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100)*sefiPrice).format('$0.00')}</p>
                                                </div>
                                            </div>

                                            <div className="row-match">
                                                <div className="col-title">
                                                    <h4>Trigger Fee</h4>
                                                </div>

                                                <div className="col-results">

                                                </div>

                                                <div className="col-values">

                                                    <h4>
                                                        {Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.triggerer * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100} <span>SEFI</span>
                                                    </h4>
                                                    <p>{numeral((Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.triggerer * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100)*sefiPrice).format('$0.00')}</p>
                                                </div>
                                            </div>

                                        </div> {/* round-info-container */}

                                    
                                    </>

                                }
                            </Accordion.Content>

                        </Accordion>
                    </div>
                    
                </React.Fragment>
            }
        </React.Fragment>
    )
}