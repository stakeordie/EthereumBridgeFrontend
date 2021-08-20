import React, { Dispatch, useContext, useEffect, useState } from "react"
import { Col, Form, Row } from "react-bootstrap"
import getRounds, { IRound } from "../../pages/SecretLottery/api/getRounds";
import { ClientContext } from "../../stores/lottery-context/ClientContext";
import { ConfigsContext } from "../../stores/lottery-context/LotteryConfigsContext";
import formatNumber from "../../utils/secret-lottery/formatNumber";

export default ({
    roundViewer,
    setRoundViewer
}: {
    roundViewer: IRound | null,
    setRoundViewer: Dispatch<IRound | null>
}) => {
    const client = useContext(ClientContext);
    const configs = useContext(ConfigsContext);
    const [searchState, setSearchState] = useState<string>("");

    useEffect(() => {
        (async () => {
            const response = await getRounds(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, [(configs.current_round_number - 1)]);
            setRoundViewer(response.rounds[0]);
        })()
    }, [client, configs])

    if (!configs) return null;

    return ( 
        <React.Fragment>

            {
                roundViewer ?
                <div className="box-previous-round">
                    <div className="round-title">
                        <h2>Previous Round</h2>
                    </div>

                    <div className="round-navigation">

                        <button
                            disabled={
                                roundViewer.round_number === 1
                            }
                            onClick={async () => {
                                const response = await getRounds(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, [(roundViewer.round_number - 1)])
                                setRoundViewer(response.rounds[0]);
                            }}
                        >Previous
                        </button>

                        <h4>Round {roundViewer.round_number} </h4>
                        <button
                            disabled={
                                roundViewer.round_number + 1 >= configs.current_round_number
                            }
                            onClick={async () => {
                                const response = await getRounds(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, [(roundViewer.round_number + 1)])
                                setRoundViewer(response.rounds[0]);
                            }}
                        >Next
                        </button>
                    </div>

                    <div className="round-result-container">

                        <div className="round-result-header">
                            <div className="header-item">
                                <h3 id="sefi-price">{formatNumber(parseInt(roundViewer.final_pot_size ? roundViewer.final_pot_size : "0") / 1000000)} SEFI</h3>
                                <p>Prize Pot</p>
                            </div>
                            <div className="header-item">
                                <h3>{roundViewer.ticket_count}</h3>
                                <p>Total Tickets</p>
                            </div>
                            <div className="header-item">
                                <h3>{roundViewer.drafted_ticket ? roundViewer.drafted_ticket : "-"}</h3>
                                <p>Winning Ticket</p>
                            </div>
                        </div>

                        <div className="table-titles">
                            <div className="title-sequence">
                                <h6>Sequence</h6>
                            </div>
                            <div className="title-rewards">
                                <h6>Distributed Rewards (SEFI)</h6>
                            </div>
                            <div className="title-winners">
                                <h6>Winners</h6>
                            </div>
                        </div>

                        <div className="round-result-body">

                            <div className="row-body">
                                <div className="col-sequence">
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                </div>
                                <div className="col-dist-rewards">
                                    <h4>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_6_pot_size : "0") / 1000000)}</h4>
                                    <p>$0</p>
                                </div>
                                <div className="col-winners">
                                    <h4>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_6_ticket_win_count : "0"}</h4>
                                </div>
                            </div>

                            <div className="row-body">
                                <div className="col-sequence">
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                                </div>
                                <div className="col-dist-rewards">
                                    <h4>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_5_pot_size : "0") / 1000000)}</h4>
                                    <p>$0</p>
                                </div>
                                <div className="col-winners">
                                    <h4>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_5_ticket_win_count : "0"}</h4>
                                </div>
                            </div>

                            <div className="row-body">
                                <div className="col-sequence">
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                </div>
                                <div className="col-dist-rewards">
                                    <h4>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_4_pot_size : "0") / 1000000)}</h4>
                                    <p>$0</p>
                                </div>
                                <div className="col-winners">
                                    <h4>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_4_ticket_win_count : "0"}</h4>
                                </div>
                            </div>

                            <div className="row-body">
                                <div className="col-sequence">
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                </div>
                                <div className="col-dist-rewards">
                                    <h4>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_3_pot_size : "0") / 1000000)}</h4>
                                    <p>$0</p>
                                </div>
                                <div className="col-winners">
                                    <h4>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_3_ticket_win_count : "0"}</h4>
                                </div>
                            </div>

                            <div className="row-body">
                                <div className="col-sequence">
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                </div>
                                <div className="col-dist-rewards">
                                    <h4>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_2_pot_size : "0") / 1000000)}</h4>
                                    <p>$0</p>
                                </div>
                                <div className="col-winners">
                                    <h4>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_2_ticket_win_count : "0"}</h4>
                                </div>
                            </div>

                            <div className="row-body">
                                <div className="col-sequence">
                                    <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                    <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                    <i className="far fa-circle fa-lg" style={{ color: "#5F5F6B" }}></i>
                                </div>
                                <div className="col-dist-rewards">
                                    <h4>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_1_pot_size : "0") / 1000000)}</h4>
                                    <p>$0</p>
                                </div>
                                <div className="col-winners">
                                    <h4>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_1_ticket_win_count : "0"}</h4>
                                </div>
                            </div>

                        </div>

                        <div className="round-result-footer">
                            <div className="row-body">
                                <div className="col-sequence">
                                    <h4>Burn</h4>
                                </div>
                                <div className="col-dist-rewards">
                                    <h4>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.burn_pot_size : "0") / 1000000)}</h4>
                                    <p>$36</p>
                                </div>
                                <div className="col-winners">
                                    <h4>
                                        {
                                            roundViewer.reward_distribution ?
                                                roundViewer.reward_distribution.sequence_1_ticket_win_count +
                                                roundViewer.reward_distribution.sequence_2_ticket_win_count +
                                                roundViewer.reward_distribution.sequence_3_ticket_win_count +
                                                roundViewer.reward_distribution.sequence_4_ticket_win_count +
                                                roundViewer.reward_distribution.sequence_5_ticket_win_count +
                                                roundViewer.reward_distribution.sequence_6_ticket_win_count
                                                :
                                                "0"
                                        }
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                    : null
            }
        </React.Fragment>
    )
}