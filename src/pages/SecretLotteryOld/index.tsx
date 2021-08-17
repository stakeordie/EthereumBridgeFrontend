import React, { Dispatch, useEffect, useState } from 'react';
import { useStores } from 'stores';
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
import RoundViewer from '../../components/Lottery/RoundViewer';
import { IRound } from '../../pages/SecretLottery/api/getRounds';
import './lottery.scss';
import { BaseContainer, PageContainer } from 'components';
import { Box } from 'grommet';


const Lottery = () => {

    let { theme } = useStores();

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
        const paginatedUserTickets = await getPaginatedUserRounds(client, process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS, viewkey, page - 1, page_size)
        setPaginatedUserRounds(paginatedUserTickets);
    }

    return (
        <div className="App">
            <BaseContainer>
                <PageContainer>
                    <ClientContextProvider>
                        <ViewKeyContextProvider>
                            <BalancesContextProvices>
                                <ConfigsContextProvider>
                                    <ReactNotification />
                                    <Box className={`${theme.currentTheme}`}
                                        pad={{ horizontal: '136px', top: 'small' }}
                                        style={{ alignItems: 'center' }}
                                    >
                                        <KeplrSetup />
                                        <NavBar menu={"SEFI"} />
                                        <CreateViewkey menu={"SEFI"} />
                                        <div className="lottery-container">
                                            <CurrentRoundSection
                                                getPaginatedUserTicketsTrigger={getPaginatedUserTicketsTrigger}
                                                paginationValues={paginationValues}
                                            />


                                            <Row>
                                                <Col xs={12}>
                                                    <UserRounds
                                                        paginatedUserRounds={paginatedUserRounds}
                                                        getPaginatedUserTicketsTrigger={getPaginatedUserTicketsTrigger}
                                                        paginationValues={paginationValues}
                                                        setRoundViewer={setRoundViewer}
                                                    />
                                                </Col>
                                                <Col xs={12} style={{ justifyContent: "center" }}>
                                                    <RoundViewer
                                                        roundViewer={roundViewer}
                                                        setRoundViewer={setRoundViewer}
                                                    />
                                                </Col>
                                            </Row>
                                        </div>
                                    </Box>
                                </ConfigsContextProvider>
                            </BalancesContextProvices>
                        </ViewKeyContextProvider>
                    </ClientContextProvider>
                </PageContainer>
            </BaseContainer>
                 
        </div>
    )
}

export default Lottery;
