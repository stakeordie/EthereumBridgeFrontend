import React, { useState } from 'react';
import formatNumber from '../../utils/secret-lottery/formatNumber';
import numeral from 'numeral';
import { Accordion, Icon, Button, Dimmer, Loader, Segment, Image } from 'semantic-ui-react';
import { useStores } from 'stores';
import { observer } from 'mobx-react';

export default observer(() => {

    const { lottery, theme } = useStores();
    const [active, setActive] = useState<boolean>(false);

    if (!lottery.configs) { return null; }

    return (
        <React.Fragment>
            {lottery.roundViewer ? (
                <div className="box-previous-round">
                    <Accordion>
                        <div className="round-title">
                            <h2>Previous Rounds</h2>
                        </div>
                        {lottery.loadingRound && (
                            <>
                                <Loader size='large' inverted={theme.currentTheme == 'dark'} active inline='centered' />
                            </>
                        )}
                        <div className="round-navigation">
                            <button
                                disabled={lottery.roundViewer.round_number === 0 || lottery.loadingRound}
                                onClick={async () => await lottery.getRoundViewer(lottery.roundViewer.round_number - 1)}
                            >
                                <img src={'/static/arrow-left-lottery.svg'} alt="arrowleft" />
                            </button>

                            <h4>Round {lottery.roundViewer.round_number + 1} </h4>
                            <button
                                className="logo-img"
                                disabled={lottery.roundViewer.round_number + 1 >= lottery.configs.current_round_number || lottery.loadingRound}
                                onClick={async () => await lottery.getRoundViewer(lottery.roundViewer.round_number + 1)}
                            >
                                <img src={'/static/arrow-right-lottery.svg'} alt="arrow right" />
                            </button>
                        </div>

                        <div className="round-result-container">
                            <div className="round-result-header">
                                <div className="header-item">
                                    <h6>
                                        {numeral(formatNumber(parseInt(lottery.roundViewer.final_pot_size ? lottery.roundViewer.final_pot_size : '0',) / 1000000,) * lottery.sefiPrice,).format('$0.00')}
                                    </h6>
                                    <h3 id="sefi-price">
                                        {formatNumber(
                                            parseInt(lottery.roundViewer.final_pot_size ? lottery.roundViewer.final_pot_size : '0') / 1000000,
                                        )}{' '}
                                        SEFI
                                    </h3>
                                    <p>Prize Pot</p>
                                </div>
                                <div className="header-item">
                                    <h6>
                                        {numeral(formatNumber(parseInt(lottery.roundViewer.reward_distribution ? lottery.roundViewer.reward_distribution.burn_pot_size : '0',) / 1000000,) * lottery.sefiPrice,).format('$0.00')}
                                    </h6>
                                    <h3>
                                        {formatNumber(
                                            parseInt(
                                                lottery.roundViewer.reward_distribution
                                                    ? lottery.roundViewer.reward_distribution.burn_pot_size
                                                    : '0',
                                            ) / 1000000,
                                        )}{' '}
                                        SEFI
                                    </h3>
                                    <p>Burn</p>
                                </div>
                                <div className="header-item">
                                    <h3>{lottery.roundViewer.ticket_count}</h3>
                                    <p>Total Tickets</p>
                                </div>
                                <div className="header-item">
                                    <h3>{lottery.roundViewer.drafted_ticket ? lottery.roundViewer.drafted_ticket : '-'}</h3>
                                    <p>Winning Ticket</p>
                                </div>
                            </div>

                            <Accordion.Title active={active} onClick={() => setActive(!active)}>
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
                            </Accordion.Title>

                            <Accordion.Content active={active}>
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
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                        </div>
                                        <div className="col-dist-rewards">
                                            <p>
                                                {numeral(
                                                    formatNumber(
                                                        parseInt(
                                                            lottery.roundViewer.reward_distribution
                                                                ? lottery.roundViewer.reward_distribution.sequence_6_pot_size
                                                                : '0',
                                                        ) / 1000000,
                                                    ) * lottery.sefiPrice,
                                                ).format('$0.00')}
                                            </p>
                                            <h4>
                                                {formatNumber(
                                                    parseInt(
                                                        lottery.roundViewer.reward_distribution
                                                            ? lottery.roundViewer.reward_distribution.sequence_6_pot_size
                                                            : '0',
                                                    ) / 1000000,
                                                )}
                                            </h4>
                                        </div>
                                        <div className="col-winners">
                                            <h4>
                                                {lottery.roundViewer.reward_distribution
                                                    ? lottery.roundViewer.reward_distribution.sequence_6_ticket_win_count
                                                    : '0'}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="row-body">
                                        <div className="col-sequence">
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-times-circle fa-lg" style={{ color: '#d9534f' }}></i>
                                        </div>
                                        <div className="col-dist-rewards">
                                            <p>
                                                {numeral(
                                                    formatNumber(
                                                        parseInt(
                                                            lottery.roundViewer.reward_distribution
                                                                ? lottery.roundViewer.reward_distribution.sequence_5_pot_size
                                                                : '0',
                                                        ) / 1000000,
                                                    ) * lottery.sefiPrice,
                                                ).format('$0.00')}
                                            </p>
                                            <h4>
                                                {formatNumber(
                                                    parseInt(
                                                        lottery.roundViewer.reward_distribution
                                                            ? lottery.roundViewer.reward_distribution.sequence_5_pot_size
                                                            : '0',
                                                    ) / 1000000,
                                                )}
                                            </h4>
                                        </div>
                                        <div className="col-winners">
                                            <h4>
                                                {lottery.roundViewer.reward_distribution
                                                    ? lottery.roundViewer.reward_distribution.sequence_5_ticket_win_count
                                                    : '0'}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="row-body">
                                        <div className="col-sequence">
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-times-circle fa-lg" style={{ color: '#d9534f' }}></i>
                                            <i className="far fa-circle fa-lg" style={{ color: '#5F5F6B' }}></i>
                                        </div>
                                        <div className="col-dist-rewards">
                                            <p>
                                                {numeral(
                                                    formatNumber(
                                                        parseInt(
                                                            lottery.roundViewer.reward_distribution
                                                                ? lottery.roundViewer.reward_distribution.sequence_4_pot_size
                                                                : '0',
                                                        ) / 1000000,
                                                    ) * lottery.sefiPrice,
                                                ).format('$0.00')}
                                            </p>
                                            <h4>
                                                {formatNumber(
                                                    parseInt(
                                                        lottery.roundViewer.reward_distribution
                                                            ? lottery.roundViewer.reward_distribution.sequence_4_pot_size
                                                            : '0',
                                                    ) / 1000000,
                                                )}
                                            </h4>
                                        </div>
                                        <div className="col-winners">
                                            <h4>
                                                {lottery.roundViewer.reward_distribution
                                                    ? lottery.roundViewer.reward_distribution.sequence_4_ticket_win_count
                                                    : '0'}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="row-body">
                                        <div className="col-sequence">
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-times-circle fa-lg" style={{ color: '#d9534f' }}></i>
                                            <i className="far fa-circle fa-lg" style={{ color: '#5F5F6B' }}></i>
                                            <i className="far fa-circle fa-lg" style={{ color: '#5F5F6B' }}></i>
                                        </div>
                                        <div className="col-dist-rewards">
                                            <p>
                                                {numeral(
                                                    formatNumber(
                                                        parseInt(
                                                            lottery.roundViewer.reward_distribution
                                                                ? lottery.roundViewer.reward_distribution.sequence_3_pot_size
                                                                : '0',
                                                        ) / 1000000,
                                                    ) * lottery.sefiPrice,
                                                ).format('$0.00')}
                                            </p>
                                            <h4>
                                                {formatNumber(
                                                    parseInt(
                                                        lottery.roundViewer.reward_distribution
                                                            ? lottery.roundViewer.reward_distribution.sequence_3_pot_size
                                                            : '0',
                                                    ) / 1000000,
                                                )}
                                            </h4>
                                        </div>
                                        <div className="col-winners">
                                            <h4>
                                                {lottery.roundViewer.reward_distribution
                                                    ? lottery.roundViewer.reward_distribution.sequence_3_ticket_win_count
                                                    : '0'}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="row-body">
                                        <div className="col-sequence">
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-times-circle fa-lg" style={{ color: '#d9534f' }}></i>
                                            <i className="far fa-circle fa-lg" style={{ color: '#5F5F6B' }}></i>
                                            <i className="far fa-circle fa-lg" style={{ color: '#5F5F6B' }}></i>
                                            <i className="far fa-circle fa-lg" style={{ color: '#5F5F6B' }}></i>
                                        </div>
                                        <div className="col-dist-rewards">
                                            <p>
                                                {numeral(
                                                    formatNumber(
                                                        parseInt(
                                                            lottery.roundViewer.reward_distribution
                                                                ? lottery.roundViewer.reward_distribution.sequence_2_pot_size
                                                                : '0',
                                                        ) / 1000000,
                                                    ) * lottery.sefiPrice,
                                                ).format('$0.00')}
                                            </p>
                                            <h4>
                                                {formatNumber(
                                                    parseInt(
                                                        lottery.roundViewer.reward_distribution
                                                            ? lottery.roundViewer.reward_distribution.sequence_2_pot_size
                                                            : '0',
                                                    ) / 1000000,
                                                )}
                                            </h4>
                                        </div>
                                        <div className="col-winners">
                                            <h4>
                                                {lottery.roundViewer.reward_distribution
                                                    ? lottery.roundViewer.reward_distribution.sequence_2_ticket_win_count
                                                    : '0'}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="row-body">
                                        <div className="col-sequence">
                                            <i className="far fa-check-circle fa-lg" style={{ color: '#5cb85c' }}></i>
                                            <i className="far fa-times-circle fa-lg" style={{ color: '#d9534f' }}></i>
                                            <i className="far fa-circle fa-lg" style={{ color: '#5F5F6B' }}></i>
                                            <i className="far fa-circle fa-lg" style={{ color: '#5F5F6B' }}></i>
                                            <i className="far fa-circle fa-lg" style={{ color: '#5F5F6B' }}></i>
                                            <i className="far fa-circle fa-lg" style={{ color: '#5F5F6B' }}></i>
                                        </div>
                                        <div className="col-dist-rewards">
                                            <p>
                                                {numeral(
                                                    formatNumber(
                                                        parseInt(
                                                            lottery.roundViewer.reward_distribution
                                                                ? lottery.roundViewer.reward_distribution.sequence_1_pot_size
                                                                : '0',
                                                        ) / 1000000,
                                                    ) * lottery.sefiPrice,
                                                ).format('$0.00')}
                                            </p>
                                            <h4>
                                                {formatNumber(
                                                    parseInt(
                                                        lottery.roundViewer.reward_distribution
                                                            ? lottery.roundViewer.reward_distribution.sequence_1_pot_size
                                                            : '0',
                                                    ) / 1000000,
                                                )}
                                            </h4>
                                        </div>
                                        <div className="col-winners">
                                            <h4>
                                                {lottery.roundViewer.reward_distribution
                                                    ? lottery.roundViewer.reward_distribution.sequence_1_ticket_win_count
                                                    : '0'}
                                            </h4>
                                        </div>
                                    </div>
                                </div>

                                <div className="round-result-footer">
                                    <div className="row-body">
                                        <div className="col-sequence">
                                            <h4>Burn</h4>
                                        </div>
                                        <div className="col-dist-rewards">
                                            <p>
                                                {numeral(
                                                    formatNumber(
                                                        parseInt(
                                                            lottery.roundViewer.reward_distribution
                                                                ? lottery.roundViewer.reward_distribution.burn_pot_size
                                                                : '0',
                                                        ) / 1000000,
                                                    ) * lottery.sefiPrice,
                                                ).format('$0.00')}
                                            </p>
                                            <h4>
                                                {formatNumber(
                                                    parseInt(
                                                        lottery.roundViewer.reward_distribution
                                                            ? lottery.roundViewer.reward_distribution.burn_pot_size
                                                            : '0',
                                                    ) / 1000000,
                                                )}
                                            </h4>
                                        </div>
                                        <div className="col-winners">
                                            <h4>
                                                {lottery.roundViewer.reward_distribution
                                                    ? lottery.roundViewer.reward_distribution.sequence_1_ticket_win_count +
                                                    lottery.roundViewer.reward_distribution.sequence_2_ticket_win_count +
                                                    lottery.roundViewer.reward_distribution.sequence_3_ticket_win_count +
                                                    lottery.roundViewer.reward_distribution.sequence_4_ticket_win_count +
                                                    lottery.roundViewer.reward_distribution.sequence_5_ticket_win_count +
                                                    lottery.roundViewer.reward_distribution.sequence_6_ticket_win_count
                                                    : '0'}
                                            </h4>
                                        </div>
                                    </div>

                                    <div className="row-body">
                                        <div className="col-sequence-trigger">
                                            <h4>Trigger</h4>
                                        </div>
                                        <div className="col-dist-rewards">
                                            <p>
                                                {numeral(
                                                    formatNumber(
                                                        parseInt(
                                                            lottery.roundViewer.reward_distribution
                                                                ? lottery.roundViewer.reward_distribution.triggerer_pot_size
                                                                : '0',
                                                        ) / 1000000,
                                                    ) * lottery.sefiPrice,
                                                ).format('$0.00')}
                                            </p>
                                            <h4>
                                                {formatNumber(
                                                    parseInt(
                                                        lottery.roundViewer.reward_distribution
                                                            ? lottery.roundViewer.reward_distribution.triggerer_pot_size
                                                            : '0',
                                                    ) / 1000000,
                                                )}
                                            </h4>
                                        </div>
                                        <div className="col-winners">

                                        </div>
                                    </div>
                                </div>
                            </Accordion.Content>
                        </div>
                    </Accordion>
                </div>
            ) : null}
        </React.Fragment>
    );
});
