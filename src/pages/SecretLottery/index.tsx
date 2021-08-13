import React from 'react';
import { observer } from 'mobx-react';
import { useStores } from 'stores';

// CONTEXT
import ClientContextProvider, { ClientContext, ClientDispatchContext, IClientState } from "../../stores/lottery-context/ClientContext";
import ViewKeyContextProvider, { ViewKeyContext } from '../../stores/lottery-context/ViewKeyContext';
import BalancesContextProvices from '../../stores/lottery-context/BalancesContext';
import ConfigsContextProvider, { ConfigsContext } from '../../stores/lottery-context/LotteryConfigsContext';

// Components
import { PageContainer } from 'components/PageContainer';
import { BaseContainer } from 'components/BaseContainer';
import { Box } from 'grommet';
import CurrentRound from 'components/SecretLottery/CurrentRound';
import RoundPotDistribution from 'components/SecretLottery/RoundPotDistribution';
import BuyTicketModal from 'components/SecretLottery/BuyTicketModal';

// Styles
import './index.scss';
import YourTickets from 'components/SecretLottery/YourTickets';

const SecretLottery = observer(() => {

    let { theme } = useStores();

    return (
        <BaseContainer>
            <PageContainer>
                <ClientContextProvider>
                    <ViewKeyContextProvider>
                        <BalancesContextProvices>
                            <ConfigsContextProvider>
                                <Box
                                    className={`${theme.currentTheme}`}
                                    pad={{ horizontal: '136px', top: 'small' }}
                                    style={{ alignItems: 'center' }}
                                >
                                    <div className="lottery-container">

                                        <CurrentRound>

                                        </CurrentRound>

                                        <BuyTicketModal>

                                        </BuyTicketModal>

                                        <RoundPotDistribution>

                                        </RoundPotDistribution>

                                        <YourTickets>

                                        </YourTickets>

                                    </div>
                                </Box>
                            </ConfigsContextProvider>
                        </BalancesContextProvices>
                    </ViewKeyContextProvider>
                </ClientContextProvider>
            </PageContainer>
        </BaseContainer>
    )
});

export default SecretLottery;
