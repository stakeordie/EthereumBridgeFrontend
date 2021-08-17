import React from 'react';


const PreviousRound = ((props: any) => {
    return (
        <>
            <div className="box-previous-round">
                <div className="round-title">
                    <h2>Previous Round</h2>
                </div>

                <div className="round-navigation">
                    <button>Left</button>
                    <h4>Round 2</h4>
                    <button>Right</button>
                </div>

                <div className="round-result-container">

                    <div className="round-result-header">
                        <div className="header-item">
                            <h3 id="sefi-price">20,886 SEFI</h3>
                            <p>Prize Pot</p>
                        </div>
                        <div className="header-item">
                            <h3>700</h3>
                            <p>Total Tickets</p>
                        </div>
                        <div className="header-item">
                            <h3>620225</h3>
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
                                <h4>0</h4>
                                <p>$0</p>
                            </div>
                            <div className="col-winners">
                                <h4>0</h4>
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
                                <h4>0</h4>
                                <p>$0</p>
                            </div>
                            <div className="col-winners">
                                <h4>0</h4>
                            </div>
                        </div>

                        <div className="row-body">
                            <div className="col-sequence">
                                <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                                <i className="far fa-circle fa-lg"></i>
                            </div>
                            <div className="col-dist-rewards">
                                <h4>0</h4>
                                <p>$0</p>
                            </div>
                            <div className="col-winners">
                                <h4>0</h4>
                            </div>
                        </div>

                        <div className="row-body">
                            <div className="col-sequence">
                                <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                                <i className="far fa-circle fa-lg"></i>
                                <i className="far fa-circle fa-lg"></i>
                            </div>
                            <div className="col-dist-rewards">
                                <h4>0</h4>
                                <p>$0</p>
                            </div>
                            <div className="col-winners">
                                <h4>0</h4>
                            </div>
                        </div>

                        <div className="row-body">
                            <div className="col-sequence">
                                <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                                <i className="far fa-circle fa-lg"></i>
                                <i className="far fa-circle fa-lg"></i>
                                <i className="far fa-circle fa-lg"></i>
                            </div>
                            <div className="col-dist-rewards">
                                <h4>0</h4>
                                <p>$0</p>
                            </div>
                            <div className="col-winners">
                                <h4>0</h4>
                            </div>
                        </div>

                        <div className="row-body">
                            <div className="col-sequence">
                                <i className="far fa-check-circle fa-lg" style={{ color: "#5cb85c" }}></i>
                                <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                                <i className="far fa-circle fa-lg"></i>
                                <i className="far fa-circle fa-lg"></i>
                                <i className="far fa-circle fa-lg"></i>
                                <i className="far fa-circle fa-lg"></i>
                            </div>
                            <div className="col-dist-rewards">
                                <h4>0</h4>
                                <p>$0</p>
                            </div>
                            <div className="col-winners">
                                <h4>0</h4>
                            </div>
                        </div>

                    </div>

                    <div className="round-result-footer">
                        <div className="row-body">
                            <div className="col-sequence">
                                <h4>Burn</h4>
                            </div>
                            <div className="col-dist-rewards">
                                <h4>120</h4>
                                <p>$36</p>
                            </div>
                            <div className="col-winners">
                                <h4>15</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
})

export default PreviousRound;
