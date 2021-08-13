import React from 'react';
import { Button, Input } from 'semantic-ui-react';

const BuyTicketModal = ((props: any) => {

    return (
        <>
            <div className="modal-container">

                <div className="modal-header-buy">
                    <h6>Buy Tickets</h6>
                    <h6>X</h6>
                </div>

                <div className="modal-nav">
                    <button className="active">Auto</button>
                    <button className="inactive">Manual</button>
                </div>

                <div className="modal-body-buy">
                    <div className="modal-input">
                        <Input fluid placeholder="000">
                            <Button type='submit'>-</Button>
                            <input />
                            <Button type='submit'>+</Button>
                        </Input>
                    </div>
                    <Button fluid color="black">Buy</Button>
                    <h6>You have bougth <span>20 Tickets</span> for this round</h6>
                </div>

                <div className="modal-footer-container">
                    <div className="row-footer">
                        <p>Ticket Price</p>
                        <h6>0.5 SEFI</h6>
                    </div>
                    <div className="row-footer">
                        <p>Disccount</p>
                        <h6>1.225%</h6>
                    </div>

                </div>
            </div>
        </>
    )
});

export default BuyTicketModal;
