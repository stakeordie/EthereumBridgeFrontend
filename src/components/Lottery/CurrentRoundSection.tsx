import React, { useEffect } from "react";
import { useState } from "react";
import calcTotalPotSize from "../../utils/secret-lottery/calcTotalPotSize";
import formatNumber from "../../utils/secret-lottery/formatNumber";
import BuyTicketsModal from "./BuyTicketsModal";
import moment from 'moment';
import Countdown from 'react-countdown';
import { useStores } from "stores";
import numeral from 'numeral';
import { Accordion, Icon, Button, Loader } from "semantic-ui-react";
import { observer } from "mobx-react";

export default observer(() => {
  const { lottery } = useStores()
  const [active , setActive]=useState<boolean>(false);

  const getEstimateSEFI = (n:number):number =>{
      return Math.round(formatNumber(calcTotalPotSize(lottery.currentRoundsState, lottery.stakingRewards) * (lottery.currentRoundsState.round_reward_pot_allocations[`sequence_${n}`] * 0.01) / 1000000) / (parseInt(lottery.currentRoundsState.round_ticket_price) / 1000000) * 100) / 100
  }

  const getEstimateUSD = (n:number):number =>{
      return numeral(Math.round((formatNumber(calcTotalPotSize(lottery.currentRoundsState, lottery.stakingRewards) * (lottery.currentRoundsState.round_reward_pot_allocations[`sequence_${n}`] * 0.01) / 1000000) / (parseInt(lottery.currentRoundsState.round_ticket_price) / 1000000) * 100)* lottery.sefiPrice) / 100).format('$0.00');
  }
  const updateCounter = ()=>{
    lottery.setCalculating(true);
  } 

  return (
      <React.Fragment>
          {
              (!lottery.currentRoundsState || !lottery.configs) && <Loader inline='centered' size='big'></Loader>
          }
          {
              lottery.currentRoundsState  && lottery.configs && lottery.stakingRewards ?
                  <React.Fragment>

                  {/* Prize Pot */}
                  <div className="box-round">      
                      <div className="data-header hero-lottery">
                          <h4>Pot Size</h4>
                      </div>

                      <div className="data">
                          <div className="data-footer">
                              <h4>{lottery.currentRoundsState  && numeral((formatNumber(calcTotalPotSize(lottery.currentRoundsState , lottery.stakingRewards) / 1000000) * lottery.sefiPrice)).format('$0,0.00')}</h4>
                          </div>
                          <div className="data-body">
                              <h1>
                                  {lottery.currentRoundsState && formatNumber(calcTotalPotSize(lottery.currentRoundsState, lottery.stakingRewards) / 1000000)}
                                  <span> SEFI</span>
                              </h1>
                          </div>
                      </div>

                      <div className="round-bottom">
                          <div className="round-bottom-content">
                          <BuyTicketsModal>
                              <button disabled={!lottery.viewingKey || !lottery.client.execute || lottery.calculating} className="button-primary-lg">
                                  Buy Tickets
                              </button>
                          </BuyTicketsModal>
                         
                              <div className="round-bottom-footer">
                                  <p>You have bought <span>{lottery.currentRoundUserTicketsCount} tickets</span> for this round</p>
                              </div>
                          </div>
                      </div>

                      {/* Round Ends Countdown */}
                      <div className="counter-row">
                              {
                                (lottery.calculating)
                                  ? <> 
                                      <h4 className='calculating'>{lottery.calculatingMsg}</h4>
                                      <p>This may take a few minutes</p>
                                    </>
                                  : <h4>
                                      Round {lottery.currentRoundsState.round_number + 1} ends in  <Countdown overtime={true} onComplete={updateCounter} key='countdown' date={(moment.unix(lottery.currentRoundsState.round_expected_end_timestamp).toDate())} daysInHours={true} />
                                    </h4>
                              }
                      </div>

                      <div className="round-footer-tickets">
                              <div className="round-footer-tickets-item">
                              <p>Minimum Ticket Count</p>
                                  <h3>{lottery.currentRoundsState.min_ticket_count}</h3>
                          </div>
                          <div className="round-footer-tickets-item">
                              <p>Current Tickets</p>
                              <h3>{lottery.currentRoundsState.ticket_count}</h3>
                          </div>
                          </div>
                  </div>

                  {/* Round Pot Distribution */}
                  <div className="box-round-pot">
                      <Accordion >
                              <div className="round-pot-title">
                                  <h2>Round Pot Distribution </h2>

                              </div>
                          <Accordion.Title active={active} onClick={() => setActive(!active)}>
                              <div className="show-detail">
                                    <div className="show-detail">
                                        <button className="button-collapse-detail">
                                            <div className="button-content">
                                                <h6>Round Detail</h6>
                                                <img
                                                    src={active ? "/static/chevron-down.svg" : "/static/chevron-right.svg"}
                                                    alt="chevron down icon"
                                                />
                                            </div>
                                        </button>
                                    </div>
                              </div>
                          </Accordion.Title>

                          <Accordion.Content active={active}>
                              {
                                  lottery.configs &&
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
                                                  <p> {getEstimateUSD(6)}</p>
                                                  <h4>{getEstimateSEFI(6)} <span>SEFI</span> </h4>
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
                                                  <p> {getEstimateUSD(5)}</p>
                                                  <h4>{getEstimateSEFI(5)} <span>SEFI</span> </h4>
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
                                                  <p> {getEstimateUSD(4)}</p>
                                                  <h4>{getEstimateSEFI(4)} <span>SEFI</span> </h4>
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
                                                  <p> {getEstimateUSD(3)}</p>
                                                  <h4>{getEstimateSEFI(3)} <span>SEFI</span> </h4>
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
                                                  <p> {getEstimateUSD(2)}</p>
                                                  <h4>{getEstimateSEFI(2)} <span>SEFI</span> </h4>
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
                                                  <p> {getEstimateUSD(1)}</p>
                                                  <h4>{getEstimateSEFI(1)} <span>SEFI</span> </h4>
                                              </div>
                                          </div>

                                          <div className="row-match">
                                              <div className="col-title">
                                                  <h4 id="burn">Burn</h4>
                                              </div>
                                              <div className="col-results">

                                              </div>
                                              <div className="col-values">
                                                  <p>{numeral((Math.round(formatNumber(calcTotalPotSize(lottery.currentRoundsState, lottery.stakingRewards) * (lottery.currentRoundsState.round_reward_pot_allocations.burn * 0.01) / 1000000) / (parseInt(lottery.currentRoundsState.round_ticket_price) / 1000000) * 100) / 100) * lottery.sefiPrice).format('$0.00')}</p>
                                                  <h4>
                                                      {Math.round(formatNumber(calcTotalPotSize(lottery.currentRoundsState, lottery.stakingRewards) * (lottery.currentRoundsState.round_reward_pot_allocations.burn * 0.01) / 1000000) / (parseInt(lottery.currentRoundsState.round_ticket_price) / 1000000) * 100) / 100} <span>SEFI</span>
                                                  </h4>
                                              </div>
                                          </div>

                                          <div className="row-match">
                                              <div className="col-title">
                                                  <h4>Trigger Fee</h4>
                                              </div>

                                              <div className="col-results">

                                              </div>

                                              <div className="col-values">

                                                  <p>{numeral((Math.round(formatNumber(calcTotalPotSize(lottery.currentRoundsState, lottery.stakingRewards) * (lottery.currentRoundsState.round_reward_pot_allocations.triggerer * 0.01) / 1000000) / (parseInt(lottery.currentRoundsState.round_ticket_price) / 1000000) * 100) / 100) * lottery.sefiPrice).format('$0.00')}</p>
                                                  <h4>
                                                      {Math.round(formatNumber(calcTotalPotSize(lottery.currentRoundsState, lottery.stakingRewards) * (lottery.currentRoundsState.round_reward_pot_allocations.triggerer * 0.01) / 1000000) / (parseInt(lottery.currentRoundsState.round_ticket_price) / 1000000) * 100) / 100} <span>SEFI</span>
                                                  </h4>
                                              </div>
                                          </div>

                                      </div> {/* round-info-container */}

                                  </>
                              }
                          </Accordion.Content>

                          {
                              lottery.configs &&
                              <>
                                  <div className="box-pot-size">
                                      <div className="box-pot-size-container">
                                          <div className="col-pot-results">
                                              <h4>Pot Size</h4>
                                              <h6>{lottery.currentRoundsState && numeral(formatNumber(calcTotalPotSize(lottery.currentRoundsState, lottery.stakingRewards) / 1000000) * lottery.sefiPrice).format('$0,0.00')}</h6>
                                              <h5> {lottery.currentRoundsState && formatNumber(calcTotalPotSize(lottery.currentRoundsState, lottery.stakingRewards) / 1000000)}  <span> SEFI</span></h5>
                                          </div>
                                          <div className="col-pot-button">
                                              <BuyTicketsModal>
                                                  <button disabled={!lottery.viewingKey || !lottery.client.execute || lottery.calculating} className="button-primary-lg">
                                                      Buy Tickets
                                                  </button>
                                              </BuyTicketsModal>
                                          </div>
                                      </div>
                                  </div> {/*Box Pot Size */}
                              </>
                          }

                      </Accordion>
                  </div>
                  
              </React.Fragment>
                  :
                  <div className="ui active dimmer">
                      <div className="ui loader"> </div>
                  </div>
          }
      </React.Fragment>
  )
});
