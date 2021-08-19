import BootstrapSwitchButton from "bootstrap-switch-button-react";
import React from "react";
import { Button, Input } from 'semantic-ui-react';
import { useContext, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import buyTickets from "../../pages/SecretLottery/api/buyTickets";
import getBalance from "../../pages/SecretLottery/api/getBalance";
import getConfigs, { IConfigs } from "../../pages/SecretLottery/api/getConfigs";
import getRounds, { IRound } from "../../pages/SecretLottery/api/getRounds";
import getRoundStakingRewards, { IStakingRewads } from "../../pages/SecretLottery/api/getRoundStakingRewards";
import getUserRoundsTicketCount from "../../pages/SecretLottery/api/getUserRoundsTicketCount";
import Scrollbars from 'react-custom-scrollbars';
import { BalancesDispatchContext } from "../../stores/lottery-context/BalancesContext";
import { ClientContext, IClientState } from "../../stores/lottery-context/ClientContext";
import { ConfigsContext, ConfigsDispatchContext } from "../../stores/lottery-context/LotteryConfigsContext";
import { ViewKeyContext } from "../../stores/lottery-context/ViewKeyContext";
import calcBulkDiscountTicketPrice from "../../utils/secret-lottery/calcBulkDiscountTicketPrice";
import calcTotalPotSize from "../../utils/secret-lottery/calcTotalPotSize";
import formatNumber from "../../utils/secret-lottery/formatNumber";
import generateRandomTickets from "../../utils/secret-lottery/generateRandomTickets";
import { errorNotification, successNotification } from "../../utils/secret-lottery/notifications";
import { isNaN } from "lodash";
import moment from 'moment';
import Countdown from 'react-countdown';

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
    const [currentRoundUserTicketsCount, setCurrentRoundUserTicketsCount] = useState<number | null>(null)
    const [stakingRewards, setStakingRewards] = useState<IStakingRewads | null>(null)

    const [loadingBuyTickets, setLoadingBuyTickets] = useState<boolean>(false)
    const [isManualTickets, setIsManualTickets] = useState<boolean>(false);
    const [ticketsCount, setTicketsCount] = useState<string>("0");
    const [manualTickets, setManualTickets] = useState<string[]>([]);

    

    useEffect(() => {
        if (client && viewkey) {
            getConfigsTrigger(client)
            setInterval(() => {
                getConfigsTrigger(client)
            }, 30000); // check 30 seconds
        }
    }, [client, viewkey])
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
        if (client && viewkey && configs) {
            getCurrentRoundTrigger(client, viewkey, configs.current_round_number);
            getRoundStakingRewardsTrigger(client, configs)
        }
    }, [configs])

    const getConfigsTrigger = async (client: IClientState) => {
        const configs = await getConfigs(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS)
        configsDispatch(configs)
    }

    const getCurrentRoundTrigger = async (client: IClientState, viewkey: string, current_round: number) => {
        const currentRoundPromise = getRounds(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, [current_round])
        const currentRoundUserTicketsCountPromise = getUserRoundsTicketCount(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, viewkey, [current_round]);

        const [currentRound, currentRoundUserTicketsCount] = await Promise.all([currentRoundPromise, currentRoundUserTicketsCountPromise]);

        setCurrentRoundsState(currentRound.rounds[0])
        setCurrentRoundUserTicketsCount(currentRoundUserTicketsCount.user_rounds_ticket_count[0])
    }

    const getRoundStakingRewardsTrigger = async (client: IClientState, configs: IConfigs) => {
        const roundStakingRewards = await getRoundStakingRewards(client, configs.staking_contract.address, configs.staking_vk)
        setStakingRewards(roundStakingRewards);
    }

    const getSEFIBalance = async () => {
        if (!client) return null
        const response = await getBalance(client, process.env.SCRT_GOV_TOKEN_ADDRESS)
        const accountData = await client.execute.getAccount(client.accountData.address);
        balancesDispatch({
            native: parseInt(accountData ? accountData.balance[0].amount : "0"),
            SEFI: response
        })
    }

    if (!client) return (
        <div>
            <i className="fa fa-spinner fa-spin" style={{ color: "white" }}></i>
        </div>
    )
    if (!viewkey) return null
    

    const renderThumbVertical=()=>{
        //TODO: add dark support
        return <div className={`thumb`}></div>
    }

    //TODO: add dark support
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

                        <div className="data-header">
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
                                <h4>$65,599</h4>
                            </div>
                        </div>

                        <div className="round-bottom">
                            <div className="round-bottom-content">
                                <button className="button-primary-lg">
                                    Buy Tickets
                                </button>
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
                            Round {currentRoundsState.round_number} ends in
                            <span> <Countdown date={(moment.unix(currentRoundsState.round_expected_end_timestamp).toDate())} daysInHours={true} /></span>
                        </h4>
                    </div>


                    {/* Buy Tickets */}
                    <div className="modal-container">

                        <div className="modal-header-buy">
                            <h6>Buy Tickets</h6>
                            <h6>X</h6>
                        </div>

                        <div className="modal-nav">
                            <button onClick={()=>setIsManualTickets(false)} className={(isManualTickets)?'inactive':'active'}>Auto</button>
                            <button onClick={()=>setIsManualTickets(true)} className={(isManualTickets)?'active':'inactive'}>Manual</button>
                        </div>

                        <div className="modal-body-buy">
                            <div className="modal-input">
                                <Input
                                    fluid
                                    placeholder="000"
                                    type="number"
                                    value={ticketsCount}
                                    onChange={(e) => {
                                        if (!e.target.value || e.target.value === "") setTicketsCount("0")
                                        else if (parseInt(e.target.value) >= 500) setTicketsCount("500")
                                        else setTicketsCount(e.target.value)
                                    }}
                                >
                                    <Button
                                        type='submit'
                                        onClick={() => {
                                            if (parseInt(ticketsCount) > 0) setTicketsCount("" + (parseInt(ticketsCount) - 1))
                                        }}>-
                                    </Button>
                                    <input />
                                    <Button
                                        type='submit'
                                        onClick={() => {
                                            if (parseInt(ticketsCount) >= 500) setTicketsCount("500")
                                            else setTicketsCount("" + (parseInt(ticketsCount) + 1))
                                        }}>+
                                    </Button>
                                </Input> 
                            </div>
                            {
                                (isManualTickets && parseFloat(ticketsCount)>0)&& 
                                <Scrollbars autoHide renderThumbVertical={renderThumbVertical} className='inputs-container'>
                                    {
                                        manualTickets.map((currentValue:string,index:number)=>(
                                            <Input
                                                key={`input-${index}`}
                                                className='manual-input' 
                                                fluid
                                                placeholder="000000"
                                                type="number"
                                                value={currentValue}
                                                onChange={(e)=>{
                                                    let value:any = e.target.value;
                                                    let valueInt = parseInt(value);
                                                    
                                                    if(isNaN(valueInt) || value.length > 6 ) return;
                                                    if(valueInt < 0) value = (valueInt * -1).toString()

                                                    setManualTickets(manualTickets.map((v,i)=> i===index ? value : v ))
                                                }}
                                            />
                                        ))
                                    }
                                </Scrollbars>
                            }
                            <Button
                                fluid
                                color="black"
                                type="button"
                                disabled={
                                    loadingBuyTickets ||
                                    (isManualTickets && manualTickets.filter((e)=>e?.length === 6).length !== manualTickets.length) ||
                                    (!isManualTickets && parseInt(ticketsCount) === 0)
                                }
                                onClick={async () => {
                                    if (!configs) return

                                    setLoadingBuyTickets(true)

                                    try {
                                        let tickets = null;
                                        let ticketPrice = null;
                                        if (isManualTickets) {
                                            tickets = manualTickets;
                                            ticketPrice = "" + calcBulkDiscountTicketPrice(configs.per_ticket_bulk_discount, manualTickets.length, currentRoundsState.round_ticket_price).finalPrice
                                        } else {
                                            const autoGeneratedTickets = generateRandomTickets(parseInt(ticketsCount));
                                            tickets = autoGeneratedTickets;
                                            ticketPrice = "" + calcBulkDiscountTicketPrice(configs.per_ticket_bulk_discount, parseInt(ticketsCount), currentRoundsState.round_ticket_price).finalPrice
                                        }

                                        await buyTickets(
                                            client,
                                            process.env.SCRT_GOV_TOKEN_ADDRESS,
                                            process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS,
                                            tickets,
                                            ticketPrice
                                        )
                                        await getRoundStakingRewardsTrigger(client, configs)
                                        await getCurrentRoundTrigger(client, viewkey, configs.current_round_number);
                                        await getPaginatedUserTicketsTrigger(client, viewkey, paginationValues.page, paginationValues.page_size)
                                        await getSEFIBalance()
                                        successNotification("Buy Tickets Success!")
                                        setTicketsCount('0')
                                        setManualTickets([])
                                        setLoadingBuyTickets(false)
                                    }
                                    catch (e) {
                                        setLoadingBuyTickets(false)
                                        errorNotification(e)
                                    }
                                }}
                                loading={loadingBuyTickets}
                            >Buy

                            </Button>

                            <div>
                                {
                                    currentRoundUserTicketsCount && currentRoundUserTicketsCount > 0
                                        ?
                                        <h6>You have bought <span>{(currentRoundUserTicketsCount)}</span> tickets for this round</h6>
                                        : null
                                }
                            </div>

                        </div>

                        <div className="modal-footer-container">
                            <div className="row-footer">
                                <p>Ticket Price</p>
                                <h6>
                                    {`${formatNumber(calcBulkDiscountTicketPrice(configs.per_ticket_bulk_discount, parseInt(ticketsCount), currentRoundsState.round_ticket_price).finalPrice / 1000000)} SEFI`}
                                </h6>
                            </div>
                            <div className="row-footer">
                                <p>Disccount</p>
                                <h6>
                                    {
                                        calcBulkDiscountTicketPrice(
                                            configs.per_ticket_bulk_discount, 
                                            parseInt(ticketsCount), 
                                            currentRoundsState.round_ticket_price).discount + "%"
                                    }
                                </h6>
                            </div>

                        </div>

                        {/* TODO: Unhide Switch and implement functionallity */}

                        {/* <Row style={{ textAlign: "center" }}>
                            <BootstrapSwitchButton
                                checked={isManualTickets}
                                width={100}
                                onlabel='Manual'
                                onstyle="dark"
                                // offstyle="outline-light"
                                style="border"
                                offlabel='Auto'
                                size="sm"
                                onChange={(checked: boolean) => {
                                    setIsManualTickets(checked);
                                    setTicketsCount("0");
                                    setManualTickets([]);
                                }}
                            />
                        </Row> */}




                        {/* OLD VERSION - INPUT */}

                        {/*
                            <Row>
                                {
                                    !isManualTickets &&
                                    <div style={{ width: "100%" }}>
                                        <div style={{ display: "flex", justifyContent: "center", margin: "10px" }}>
                                            <button className="btn btn-dark" style={{ borderRadius: "0px", borderColor: "white" }}
                                                onClick={() => {
                                                if (parseInt(ticketsCount) > 0) setTicketsCount("" + (parseInt(ticketsCount) - 1))
                                                }}>
                                                <i className="fas fa-minus"></i>
                                            </button>
                                            <input
                                                style={{ textAlign: "center", width: "30%", backgroundColor: "transparent", color: "white" }}
                                                type="number"
                                                value={ticketsCount}
                                                onChange={(e) => {
                                                    if (!e.target.value || e.target.value === "") setTicketsCount("0")
                                                    else if (parseInt(e.target.value) >= 500) setTicketsCount("500")
                                                    else setTicketsCount(e.target.value)
                                                }} />
                                            <button className="btn btn-dark" style={{ borderRadius: "0px", borderColor: "white" }}
                                                onClick={() => {
                                                if (parseInt(ticketsCount) >= 500) setTicketsCount("500")
                                                else setTicketsCount("" + (parseInt(ticketsCount) + 1))
                                                }}>
                                                <i className="fas fa-plus"></i>
                                            </button>
                                        </div>

                                    </div>
                                }
                            </Row>
                        */}

                        {/* OLD VERSION - BUTTOn */}

                        {/*

                        <Row style={{ justifyContent: "center" }}>
                            <Col>
                                <button type="button" className="btn btn-success" style={{ borderRadius: "10px", margin: "10px" }}
                                    disabled={
                                        loadingBuyTickets ||
                                        (isManualTickets && manualTickets.length === 0) ||
                                        (!isManualTickets && parseInt(ticketsCount) === 0)
                                    }
                                    onClick={async () => {
                                        if (!configs) return

                                        setLoadingBuyTickets(true)

                                        try {
                                            let tickets = null;
                                            let ticketPrice = null;
                                            if (isManualTickets) {
                                                tickets = manualTickets;
                                                ticketPrice = "" + calcBulkDiscountTicketPrice(configs.per_ticket_bulk_discount, manualTickets.length, currentRoundsState.round_ticket_price).finalPrice
                                            } else {
                                                const autoGeneratedTickets = generateRandomTickets(parseInt(ticketsCount));
                                                tickets = autoGeneratedTickets;
                                                ticketPrice = "" + calcBulkDiscountTicketPrice(configs.per_ticket_bulk_discount, parseInt(ticketsCount), currentRoundsState.round_ticket_price).finalPrice
                                            }

                                            await buyTickets(
                                                client,
                                                process.env.SCRT_GOV_TOKEN_ADDRESS,
                                                process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS,
                                                tickets,
                                                ticketPrice
                                            )
                                            await getRoundStakingRewardsTrigger(client, configs)
                                            await getCurrentRoundTrigger(client, viewkey, configs.current_round_number);
                                            await getPaginatedUserTicketsTrigger(client, viewkey, paginationValues.page, paginationValues.page_size)
                                            await getSEFIBalance()
                                            successNotification("Buy Tickets Success!")

                                            setLoadingBuyTickets(false)
                                        }
                                        catch (e) {
                                            setLoadingBuyTickets(false)
                                            errorNotification(e)
                                        }
                                    }}>
                                    {
                                        loadingBuyTickets
                                            ?
                                            <i className="fa fa-spinner fa-spin"></i>
                                            :
                                            <div>
                                                Buy
                                                <br />
                                                {
                                                    isManualTickets ?
                                                        formatNumber(calcBulkDiscountTicketPrice(configs.per_ticket_bulk_discount, manualTickets.length, currentRoundsState.round_ticket_price).finalPrice / 1000000) :
                                                        formatNumber(calcBulkDiscountTicketPrice(configs.per_ticket_bulk_discount, parseInt(ticketsCount), currentRoundsState.round_ticket_price).finalPrice / 1000000)
                                                } SEFI
                                            </div>
                                    }

                                </button>
                            </Col>
                        </Row>
                        */}

                    </div>



                    {/* Round Pot Distribution */}
                    <div className="box-round-pot">
                        <div className="round-pot-title">
                            <h2>Round Pot Distribution</h2>
                        </div>

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
                                            <h4>
                                                {Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_6 * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100} <span>SEFI</span>
                                            </h4>
                                            <p>$26,239</p>
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
                                            <h4>
                                                {Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_5 * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100} <span>SEFI</span>
                                            </h4>
                                            <p>$26,239</p>
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
                                            <i className="far fa-circle fa-lg"></i>
                                        </div>
                                        <div className="col-values">
                                            <h4>
                                                {Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_4 * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100} <span>SEFI</span>
                                            </h4>
                                            <p>$26,239</p>
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
                                            <i className="far fa-circle fa-lg"></i>
                                            <i className="far fa-circle fa-lg"></i>
                                        </div>
                                        <div className="col-values">
                                            <h4>
                                                {Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_3 * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100} <span>SEFI</span>
                                            </h4>
                                            <p>$26,239</p>
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
                                            <i className="far fa-circle fa-lg"></i>
                                            <i className="far fa-circle fa-lg"></i>
                                            <i className="far fa-circle fa-lg"></i>
                                        </div>
                                        <div className="col-values">
                                            <h4>
                                                {Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_2 * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100} <span>SEFI</span>
                                            </h4>
                                            <p>$26,239</p>
                                        </div>
                                    </div>


                                    <div className="row-match">
                                        <div className="col-title">
                                            <h4>Match first 1</h4>
                                        </div>
                                        <div className="col-results">
                                            <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                            <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                                            <i className="far fa-circle fa-lg"></i>
                                            <i className="far fa-circle fa-lg"></i>
                                            <i className="far fa-circle fa-lg"></i>
                                            <i className="far fa-circle fa-lg"></i>
                                        </div>
                                        <div className="col-values">
                                            <h4>
                                                {Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_1 * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100} <span>SEFI</span>
                                            </h4>
                                            <p>$26,239</p>
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
                                            <p>$26,239</p>
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
                                            <p>$26,239</p>
                                        </div>
                                    </div>

                                </div> {/* round-info-container */}

                                <div className="box-pot-size">
                                    <div className="box-pot-size-container">
                                        <div className="col-pot-results">
                                            <h4>Pot Size</h4>
                                            <h5>
                                                {currentRoundsState && formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) / 1000000)}
                                                <span> SEFI</span>
                                            </h5>
                                            <h6>$65,599</h6>
                                        </div>
                                        <div className="col-pot-button">
                                            <button className="button-primary-lg">
                                                Buy Tickets
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>

                        }

                    </div> {/*Box-round-pot*/}
                </React.Fragment>
            }
        </React.Fragment>
    )
}