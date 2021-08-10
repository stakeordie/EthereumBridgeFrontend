import React, { Dispatch, useEffect, useState } from 'react';
import ClientContextProvider, { ClientContext, ClientDispatchContext, IClientState } from "../../stores/lottery-context/ClientContext";
import ReactNotification from 'react-notifications-component'
import logo from './logo.svg';
import { SigningCosmWasmClient } from 'secretjs';
import KeplrSetup from '../../components/Lottery/KeplrSetup';
import NavBar from '../../components/Lottery/NavBar';
import CreateViewkey from '../../components/Lottery/CreateViewkey';
import ViewKeyContextProvider, { ViewKeyContext } from '../../stores/lottery-context/ViewKeyContext';
import BalancesContextProvices from '../../stores/lottery-context/BalancesContext';
import ConfigsContextProvider, { ConfigsContext } from '../../stores/lottery-context/LotteryConfigsContext';
import {
    HashRouter as Router,
    Switch,
    Route,
    Link,
    Redirect
} from "react-router-dom";
import CurrentRoundSection from '../../components/Lottery/CurrentRoundSection';
import { Col, Container, Row } from 'react-bootstrap';
import UserRounds from '../../components/Lottery/UserRounds';
import getPaginatedUserRounds, { IPaginatedUserRounds } from '../../pages/SecretLottery/api/getPaginatedUserRounds';
import constants from '../../constants';
import RoundViewer from '../../components/Lottery/RoundViewer';
import { IRound } from '../../pages/SecretLottery/api/getRounds';


const Lottery = () => {

    const [roundViewer, setRoundViewer] = useState<IRound | null>(null);
    const [paginatedUserRounds, setPaginatedUserRounds] = useState<IPaginatedUserRounds | null>(null);
    const [paginationValues, setPaginationsValues] = useState<{
        page_size: number,
        page: number
    }>({
        page_size: 5,
        page: 1
    })

    const getPaginatedUserTicketsTrigger = async (client: IClientState, viewkey: string, page: number, page_size: number) => {
        const paginatedUserTickets = await getPaginatedUserRounds(client, constants.SECRET_LOTTERY_CONTRACT_ADDRESS, viewkey, page - 1, page_size)
        setPaginatedUserRounds(paginatedUserTickets);
    }

    console.log('Chain ID: ',process.env.CHAIN_ID);
    console.log('Contract Address:',process.env.SSCRT_CONTRACT);
    console.log('SEFI Contract:', process.env.SCRT_GOV_TOKEN_ADDRESS);
    // console.log(process.env.SECRET_LOTTERY_CONTRACT_ADDRESS);
    console.log('New Lottery:', process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS);

    return (
        <div className="App">
            
            <ClientContextProvider>
                <ViewKeyContextProvider>
                    <BalancesContextProvices>
                        <ConfigsContextProvider>
                            <div style={{ background: "linear-gradient(180deg, #242525 0%, #000 180%)", width: "100%", minHeight: "100vh" }}>
                                <ReactNotification />
                                <KeplrSetup />
                                <NavBar menu={"SEFI"} />
                                <Container fluid style={{ width: "80%", color: "white" }}>
                                    <CreateViewkey menu={"SEFI"} />
                                    <Row>
                                        <CurrentRoundSection
                                            getPaginatedUserTicketsTrigger={getPaginatedUserTicketsTrigger}
                                            paginationValues={paginationValues}
                                        />
                                    </Row>
                                    <Row>
                                        <div style={{ backgroundColor: "white", height: "1px", width: "100%", marginTop: "30px", marginBottom: "30px", }}>
                                        </div>
                                    </Row>
                                    <Row>
                                        <Col xs={7}>
                                            <UserRounds
                                                paginatedUserRounds={paginatedUserRounds}
                                                getPaginatedUserTicketsTrigger={getPaginatedUserTicketsTrigger}
                                                paginationValues={paginationValues}
                                                setRoundViewer={setRoundViewer}
                                            />
                                        </Col>
                                        <Col style={{ justifyContent: "center", marginLeft: "50px" }}>
                                            <RoundViewer
                                                roundViewer={roundViewer}
                                                setRoundViewer={setRoundViewer}
                                            />
                                        </Col>
                                    </Row>
                                </Container>
                                {
                                    //<Home menu={"SEFI"}/>
                                }
                            </div>
                        </ConfigsContextProvider>
                    </BalancesContextProvices>
                </ViewKeyContextProvider>
            </ClientContextProvider>
                 
        </div>
    )
}

export default Lottery;
