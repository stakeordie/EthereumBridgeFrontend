import React from 'react';
import { observer } from 'mobx-react';
import { useStores } from 'stores';

const CurrentRound = observer((props: any) => {

    let { theme } = useStores();

    return (
        <>
            <div className="box-round">

                <div className="data">
                    <div className="data-header">
                        <h4>Pot Size</h4>
                    </div>
                    <div className="data-body">
                        <h1>218,665 <span>SEFI</span></h1>
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
                            <p>You have bought <span>20 tickets</span> for this round</p>
                        </div>
                    </div>
                </div>

            </div>
        </>
    )
});

export default CurrentRound;
