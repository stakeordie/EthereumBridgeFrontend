import BootstrapSwitchButton from "bootstrap-switch-button-react";
import React from "react";
import { useContext, useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import buyTickets from "../../pages/SecretLottery/api/buyTickets";
import getBalance from "../../pages/SecretLottery/api/getBalance";
import getConfigs, { IConfigs } from "../../pages/SecretLottery/api/getConfigs";
import getRounds, { IRound } from "../../pages/SecretLottery/api/getRounds";
import getRoundStakingRewards, { IStakingRewads } from "../../pages/SecretLottery/api/getRoundStakingRewards";
import getUserRoundsTicketCount from "../../pages/SecretLottery/api/getUserRoundsTicketCount";

import { BalancesDispatchContext } from "../../stores/lottery-context/BalancesContext";
import { ClientContext, IClientState } from "../../stores/lottery-context/ClientContext";
import { ConfigsContext, ConfigsDispatchContext } from "../../stores/lottery-context/LotteryConfigsContext";
import { ViewKeyContext } from "../../stores/lottery-context/ViewKeyContext";
import calcBulkDiscountTicketPrice from "../../utils/secret-lottery/calcBulkDiscountTicketPrice";
import calcTotalPotSize from "../../utils/secret-lottery/calcTotalPotSize";
import formatNumber from "../../utils/secret-lottery/formatNumber";
import generateRandomTickets from "../../utils/secret-lottery/generateRandomTickets";
import { errorNotification, successNotification } from "../../utils/secret-lottery/notifications";
import Countdown from "./Countdown";

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
    const [autoTicketsCount, setAutoTicketsCount] = useState<string>("0");
    const [manualTickets, setManualTickets] = useState<string[]>([]);

    useEffect(() => {
        if (client && viewkey) {
            getConfigsTrigger(client)
            setInterval(() => {
                getConfigsTrigger(client)
            }, 30000); // check 30 seconds
        }
    }, [client, viewkey])

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
                        <div className="data-body">
                            <h1>
                                {currentRoundsState && formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) / 1000000)}
                                <span>SEFI</span>
                            </h1>
                        </div>
                        <div className="data-footer">
                            <h4>$65,599</h4>
                        </div>

                        <div className="round-bottom">
                            <div className="round-bottom-content">
                                <button className="button-primary-lg">
                                    Buy Tickets
                                </button>
                                <div className="round-bottom-footer">
                                    <p>You have bought <span>20 tickets</span> for this round</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ backgroundColor: "white", height: "1px", width: "100%", marginTop: "15px", marginBottom: "15px" }}>
                        </div>
                        <Row>
                            <Col style={{ justifyContent: "center" }}>
                                <span style={{ fontSize: "1.5rem" }}>Round {currentRoundsState.round_number} </span>
                            </Col>
                            <Col style={{ justifyContent: "center" }}>
                                <span style={{ fontSize: "1.5rem" }}> {currentRoundsState.ticket_count} Tickets</span>
                            </Col>
                        </Row>


                        {/* Add This To Buy Tickets Modal */}

                        <Row style={{ justifyContent: "center", fontSize: "1.25rem", marginTop: "10px" }}>
                            {
                                "Expected to End at: " + new Date(currentRoundsState.round_expected_end_timestamp*1000).toLocaleString()
                            }
                            {
                                "Min Ticket Count: " + configs.min_ticket_count_per_round
                            }
                        </Row>
                    </div>


                    {/* Buy Tickets */}
                    <Row style={{ borderRadius: "30px", border: "solid", marginLeft: "10px", marginRight: "10px" }}>
                        <Row style={{ justifyContent: "center", marginTop: "10px", marginBottom: "10px" }}>
                            <Col style={{ textAlign: "right", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                                <span style={{ fontSize: "20px", lineHeight: "28px" }}>Buy Tickets</span>
                            </Col>
                            <Col style={{ textAlign: "left" }}>
                                <BootstrapSwitchButton
                                    checked={isManualTickets}
                                    width={100}
                                    onlabel='Manual'
                                    onstyle="outline-light"
                                    offstyle="outline-light"
                                    style="border"
                                    offlabel='Auto'
                                    size="sm"
                                    onChange={(checked: boolean) => {
                                        setIsManualTickets(checked);
                                        setAutoTicketsCount("0");
                                        setManualTickets([]);
                                    }}
                                />
                            </Col>
                        </Row>
                        <Row style={{ justifyContent: "center" }}>
                            <div style={{ backgroundColor: "white", height: "1px", width: "80%", marginBottom: "20px", }}>
                            </div>
                        </Row>
                        <Row>
                            {
                                !isManualTickets &&
                                <div style={{ width: "100%" }}>
                                    <span>How many tickets to buy?</span>
                                    <br />
                                    <div style={{ display: "flex", justifyContent: "center", margin: "10px" }}>
                                        <button className="btn btn-dark" style={{ borderRadius: "0px", borderColor: "white" }} onClick={() => {
                                            if (parseInt(autoTicketsCount) > 0) setAutoTicketsCount("" + (parseInt(autoTicketsCount) - 1))
                                        }}><i className="fas fa-minus"></i></button>
                                        <input
                                            style={{ textAlign: "center", width: "30%", backgroundColor: "transparent", color: "white" }}
                                            type="number"
                                            value={autoTicketsCount}
                                            onChange={(e) => {
                                                if (!e.target.value || e.target.value === "") setAutoTicketsCount("0")
                                                else if (parseInt(e.target.value) >= 500) setAutoTicketsCount("500")
                                                else setAutoTicketsCount(e.target.value)
                                            }} />
                                        <button className="btn btn-dark" style={{ borderRadius: "0px", borderColor: "white" }} onClick={() => {
                                            if (parseInt(autoTicketsCount) >= 500) setAutoTicketsCount("500")
                                            else setAutoTicketsCount("" + (parseInt(autoTicketsCount) + 1))
                                        }}><i className="fas fa-plus"></i></button>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "center" }}>
                                        <button className="btn btn-dark" style={{ margin: "5px", borderColor: "white" }} onClick={() => {
                                            if (parseInt(autoTicketsCount) + 5 >= 500) setAutoTicketsCount("500")
                                            else setAutoTicketsCount("" + (parseInt(autoTicketsCount) + 5))
                                        }}>+5</button>
                                        <button className="btn btn-dark" style={{ margin: "5px", borderColor: "white" }} onClick={() => {
                                            if (parseInt(autoTicketsCount) + 10 >= 500) setAutoTicketsCount("500")
                                            else setAutoTicketsCount("" + (parseInt(autoTicketsCount) + 10))
                                        }}>+10</button>
                                        <button className="btn btn-dark" style={{ margin: "5px", borderColor: "white" }} onClick={() => {
                                            if (parseInt(autoTicketsCount) + 25 >= 500) setAutoTicketsCount("500")
                                            else setAutoTicketsCount("" + (parseInt(autoTicketsCount) + 25))
                                        }}>+25</button>
                                        <button className="btn btn-dark" style={{ margin: "5px", borderColor: "white" }} onClick={() => setAutoTicketsCount("" + ("0"))}>Reset</button>
                                    </div>
                                </div>
                            }
                        </Row>
                        <Row style={{ justifyContent: "center" }}>
                            <Col xs={5}>
                                {
                                    `${formatNumber(parseInt(currentRoundsState.round_ticket_price) / 1000000)} SEFI / ticket`
                                }
                                <br />
                                {
                                    "Discount: " + calcBulkDiscountTicketPrice(configs.per_ticket_bulk_discount, isManualTickets ? manualTickets.length : parseInt(autoTicketsCount), currentRoundsState.round_ticket_price).discount + "%"
                                }
                                <br />
                            </Col>
                            <Col>
                                <button type="button" className="btn btn-success" style={{ borderRadius: "10px", margin: "10px" }}
                                    disabled={
                                        loadingBuyTickets ||
                                        (isManualTickets && manualTickets.length === 0) ||
                                        (!isManualTickets && parseInt(autoTicketsCount) === 0)
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
                                                const autoGeneratedTickets = generateRandomTickets(parseInt(autoTicketsCount));
                                                tickets = autoGeneratedTickets;
                                                ticketPrice = "" + calcBulkDiscountTicketPrice(configs.per_ticket_bulk_discount, parseInt(autoTicketsCount), currentRoundsState.round_ticket_price).finalPrice
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
                                        loadingBuyTickets ? <i className="fa fa-spinner fa-spin"></i> :
                                            <div>
                                                Buy
                                                <br />
                                                {
                                                    isManualTickets ?
                                                        formatNumber(calcBulkDiscountTicketPrice(configs.per_ticket_bulk_discount, manualTickets.length, currentRoundsState.round_ticket_price).finalPrice / 1000000) :
                                                        formatNumber(calcBulkDiscountTicketPrice(configs.per_ticket_bulk_discount, parseInt(autoTicketsCount), currentRoundsState.round_ticket_price).finalPrice / 1000000)
                                                } SEFI
                                            </div>
                                    }

                                </button>
                            </Col>
                        </Row>
                        {
                            currentRoundUserTicketsCount && currentRoundUserTicketsCount > 0 ?
                                <Row style={{ justifyContent: "center" }}>
                                    <span>{"You already have "} <b> {(currentRoundUserTicketsCount + " tickets")} </b> {" this round!"} </span>
                                </Row>
                                : null
                        }

                    </Row>



                    {/* Round Pot Distribution */}
                    <Row style={{ borderRadius: "30px", border: "solid", marginLeft: "10px" }}>
                        <Row style={{ justifyContent: "center", marginTop: "10px", marginBottom: "10px" }}>
                            <Col style={{ textAlign: "right", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontSize: "20px", lineHeight: "28px" }}>Round Pot Distribution</span>
                            </Col>
                        </Row>
                        <Row style={{ justifyContent: "center" }}>
                            <div style={{ backgroundColor: "white", height: "1px", width: "80%", marginBottom: "20px", }}>
                            </div>
                        </Row>
                        {
                            configs &&
                            <React.Fragment>
                                <Row>
                                    <Col xs={6}>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                    </Col>
                                    <Col style={{ textAlign: "left" }}>
                                        {
                                            `${Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_6 * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100 }x 
                                            (${Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_6 * 0.01) / 1000000)* 100) / 100}
                                            SEFI)`
                                        }
                                    </Col>
                                </Row>
                                <Row>
                                    <Col xs={6}>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                    </Col>
                                    <Col style={{ textAlign: "left" }}>
                                        {
                                            `${Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_5 * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100 }x 
                                            (${Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_5 * 0.01) / 1000000)* 100) / 100}
                                            SEFI)`
                                        }
                                    </Col>
                                </Row>
                                <Row>
                                    <Col xs={6}>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                        <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                    </Col>
                                    <Col style={{ textAlign: "left" }}>
                                        {
                                            `${Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_4 * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100 }x 
                                            (${Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_4 * 0.01) / 1000000)* 100) / 100}
                                            SEFI)`
                                        }
                                    </Col>
                                </Row>
                                <Row>
                                    <Col xs={6}>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                        <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                        <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                    </Col>
                                    <Col style={{ textAlign: "left" }}>
                                        {
                                            `${Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_3 * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100 }x 
                                            (${Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_3 * 0.01) / 1000000)* 100) / 100}
                                            SEFI)`
                                        }
                                    </Col>
                                </Row>
                                <Row>
                                    <Col xs={6}>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                        <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                        <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                        <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                    </Col>
                                    <Col style={{ textAlign: "left" }}>
                                        {
                                            `${Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_2 * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100 }x 
                                            (${Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_2 * 0.01) / 1000000)* 100) / 100}
                                            SEFI)`
                                        }
                                    </Col>
                                </Row>
                                <Row>
                                    <Col xs={6}>
                                        <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                        <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                        <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                        <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                        <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                    </Col>
                                    <Col style={{ textAlign: "left" }}>
                                        {
                                            `${Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_1 * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100 }x 
                                            (${Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.sequence_1 * 0.01) / 1000000)* 100) / 100}
                                            SEFI)`
                                        }
                                    </Col>
                                </Row>
                                <br />
                                <Row>
                                    <Col xs={6}>
                                        <i className="fas fa-fire" style={{ margin: "2px", color: "#d9534f", marginLeft: "5px", marginRight: "10px" }}></i>Burn
                                    </Col>
                                    <Col style={{ textAlign: "left" }}>
                                        {
                                            `${Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.burn * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100 }x 
                                            (${Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.burn * 0.01) / 1000000)* 100) / 100}
                                            SEFI)`
                                        }
                                    </Col>
                                </Row>
                                <Row style={{ marginBottom: "10px" }}>
                                    <Col xs={6}>
                                        <i className="fas fa-coins" style={{ margin: "2px", color: "#f0ad4e", marginLeft: "5px", marginRight: "10px" }}></i>Triggerer Fee
                                    </Col>
                                    <Col style={{ textAlign: "left" }}>
                                        {
                                            `${Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.triggerer * 0.01) / 1000000) / (parseInt(currentRoundsState.round_ticket_price) / 1000000) * 100) / 100 }x 
                                            (${Math.round(formatNumber(calcTotalPotSize(currentRoundsState, stakingRewards) * (currentRoundsState.round_reward_pot_allocations.triggerer * 0.01) / 1000000)* 100) / 100}
                                            SEFI)`
                                        }
                                    </Col>
                                </Row>
                            </React.Fragment>
                        }
                    </Row>
                </React.Fragment>
            }
        </React.Fragment>
    )
}