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

    /*useEffect(() => {
        if (roundViewer) setSearchState("")
    }, [client, configs, roundViewer])*/

    useEffect(() => {
        if (!client) return
        (async () => {
            const response = await getRounds(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, [(configs.current_round_number - 1)]);
            setRoundViewer(response.rounds[0]);
        })()
    }, [client, configs])

    if (!configs || !client) return null;

    console.log(roundViewer);

    return ( 
        <React.Fragment>

            {
                roundViewer &&
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
                                if (!client) return
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
                                if (!client) return
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
            }

            {/* <Row style={{ marginBottom: "20px" }}>
                <Form.Control type="number" placeholder="Round" min={0} style={{ textAlign: "center", width: "20%", borderRadius: "0px", marginTop: "20px" }}
                    value={searchState}
                    onChange={(e) => setSearchState(e.target.value)}
                />
                <button type="button" style={{ width: "10%", borderRadius: "0px", marginTop: "20px" }}
                    disabled={
                        searchState === "" ||
                        parseInt(searchState) >= configs.current_round_number
                    }
                    onClick={async () => {
                        if (!client) return
                        const response = await getRounds(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, [parseInt(searchState)])
                        console.log(response);
                        setRoundViewer(response.rounds[0]);
                    }}
                    className="btn btn-info"><i className="fas fa-search"></i></button>
            </Row> */}


            {/* <Row style={{ justifyContent: "center", margin: "0px" }}>
                <h2>Search previous Rounds</h2>
            </Row>
            {
                roundViewer &&
                <Row style={{ padding: "20px", borderRadius: "30px", border: "solid", marginTop: "20px", fontSize: "0.9rem" }}>
                    <Col>
                        <Row>
                            <Col>
                                <span style={{ fontSize: "1.25rem", display: "block" }}>Round {roundViewer.round_number}</span>
                            </Col>
                            <Col>
                                <span style={{ fontSize: "1.25rem", display: "block" }}>{roundViewer.ticket_count} Tickets</span>
                            </Col>
                        </Row>
                        <Row style={{ justifyContent: "center" }}>
                            <Col>
                                <span style={{ fontSize: "1.75rem", display: "block" }}>{formatNumber(parseInt(roundViewer.final_pot_size ? roundViewer.final_pot_size : "0") / 1000000)} SEFI </span>
                            </Col>
                            <Col>
                                <span style={{ fontSize: "1.75rem", display: "block" }}>{roundViewer.drafted_ticket && roundViewer.drafted_ticket.split("").join(" ")}</span>
                            </Col>
                        </Row>
                        <br />
                        <Row>
                            <table className='table table-borderless'>
                                <thead>
                                    <tr>
                                        <th scope="col">Sequence</th>
                                        <th scope="col">Distributed Rewards (SEFI)</th>
                                        <th scope="col">Winners</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                        </td>
                                        <td>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_6_pot_size : "0") / 1000000)}</td>
                                        <td>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_6_ticket_win_count : "0"}</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                        </td>
                                        <td>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_5_pot_size : "0") / 1000000)}</td>
                                        <td>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_5_ticket_win_count : "0"}</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                            <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                        </td>
                                        <td>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_4_pot_size : "0") / 1000000)}</td>
                                        <td>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_4_ticket_win_count : "0"}</td>
                                    </tr>
                                    <tr>
                                        <td><i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                            <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                            <i className="far fa-circle" style={{ margin: "5px" }}></i></td>
                                        <td>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_3_pot_size : "0") / 1000000)}</td>
                                        <td>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_3_ticket_win_count : "0"}</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                            <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                            <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                            <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                        </td>
                                        <td>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_2_pot_size : "0") / 1000000)}</td>
                                        <td>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_2_ticket_win_count : "0"}</td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <i className="far fa-check-circle" style={{ margin: "5px", color: "#5cb85c" }}></i>
                                            <i className="far fa-times-circle" style={{ margin: "5px", color: "#d9534f" }}></i>
                                            <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                            <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                            <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                            <i className="far fa-circle" style={{ margin: "5px" }}></i>
                                        </td>
                                        <td>{formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_1_pot_size : "0") / 1000000)}</td>
                                        <td>{roundViewer.reward_distribution ? roundViewer.reward_distribution.sequence_1_ticket_win_count : "0"}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </Row>
                        <Row>
                            <Col>
                                <i className="fas fa-fire" style={{ margin: "2px", color: "#d9534f", marginLeft: "5px", marginRight: "10px" }}></i>Burn:
                                <span>{" " + formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.burn_pot_size : "0") / 1000000) + " SEFI"}</span>
                            </Col>
                            <Col>
                                <i className="fas fa-coins" style={{ margin: "2px", color: "#f0ad4e", marginLeft: "5px", marginRight: "10px" }}></i>Triggerer Fee:
                                <span>{" " + formatNumber(parseInt(roundViewer.reward_distribution ? roundViewer.reward_distribution.triggerer_pot_size : "0") / 1000000) + " SEFI"}</span>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            }*/}



        </React.Fragment>
    )
}