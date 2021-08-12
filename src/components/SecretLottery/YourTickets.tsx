import React from 'react';

const YourTickets = (props: any) => {

    return (
        <>
            <div className="box-tickets">
                <h2>Your Tickets</h2>
                <div className="tickets-result">

                    <h6>Round</h6>
                    <h6>End Date</h6>
                    <h6>Winning Ticket</h6>
                    <h6>My Tickets</h6>

                    <h6>1</h6>
                    <h6>Tue 29 Jun, 19:00</h6>
                    <h6>498494</h6>
                    <button>
                        50 Tickets
                    </button>

                    <h6>2</h6>
                    <h6>Wed 30 Jun, 19:00</h6>
                    <h6>798465</h6>
                    <button>
                        35 Tickets
                    </button>

                </div>

            </div>
        </>
    )
}

export default YourTickets;
