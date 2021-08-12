import React from 'react';

const RoundPotDistribution = (props: any) => {


    return (
        <>
            <div className="box-round-pot">
                <div className="round-pot-title">
                    <h2>Round Pot Distribution</h2>
                </div>
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
                            <h4>87,466 <span>SEFI</span></h4>
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
                            <h4>87,466 <span>SEFI</span></h4>
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
                            <i className="far fa-circle fa-lg" ></i>
                        </div>
                        <div className="col-values">
                            <h4>87,466 <span>SEFI</span></h4>
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
                            <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                            <i className="far fa-circle fa-lg" ></i>
                        </div>
                        <div className="col-values">
                            <h4>87,466 <span>SEFI</span></h4>
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
                            <i className="far fa-times-circle fa-lg" style={{ color: "#d9534f" }}></i>
                            <i className="far fa-circle fa-lg" ></i>
                            <i className="far fa-circle fa-lg" ></i>
                        </div>
                        <div className="col-values">
                            <h4>87,466 <span>SEFI</span></h4>
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
                            <i className="far fa-circle fa-lg" ></i>
                            <i className="far fa-circle fa-lg" ></i>
                            <i className="far fa-circle fa-lg" ></i>
                            <i className="far fa-circle fa-lg" ></i>
                        </div>
                        <div className="col-values">
                            <h4>87,466 <span>SEFI</span></h4>
                            <p>$26,239</p>
                        </div>
                    </div>

                    <div className="row-match">
                        <div className="col-title">
                            <h4 className="burn">Burn</h4>
                        </div>
                        <div className="col-results">

                        </div>
                        <div className="col-values">
                            <h4>1,975 <span>SEFI</span></h4>
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
                            <h4>543<span> SEFI</span></h4>
                            <p>$26,239</p>
                        </div>
                    </div>

                </div> {/* round-info-container */}

                <div className="box-pot-size">
                    <div className="box-pot-size-container">
                        <div className="col-pot-results">
                            <h4>Pot Size</h4>
                            <h5>218,665 <span>SEFI</span></h5>
                            <h6>$65,599</h6>
                        </div>
                        <div className="col-pot-button">
                            <button className="button-primary-lg">
                                Buy Tickets
                            </button>
                        </div>

                    </div>

                </div>
            </div> {/*box-round-pot*/}

        </>

    )
}

export default RoundPotDistribution
