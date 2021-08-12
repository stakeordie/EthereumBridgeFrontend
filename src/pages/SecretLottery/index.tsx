import React from 'react';
import { observer } from 'mobx-react';
import { useStores } from 'stores';

// Components
import { PageContainer } from 'components/PageContainer';
import { BaseContainer } from 'components/BaseContainer';
import { Box } from 'grommet';
import CurrentRound from 'components/SecretLottery/CurrentRound';
import RoundPotDistribution from 'components/SecretLottery/RoundPotDistribution';

// Styles
import './index.scss';
import YourTickets from 'components/SecretLottery/YourTickets';

const SecretLottery = observer(() => {

    let { theme } = useStores();

    return (
        <BaseContainer>
            <PageContainer>
                <Box
                    className={`${theme.currentTheme}`}
                    pad={{ horizontal: '136px', top: 'small' }}
                    style={{ alignItems: 'center' }}
                >
                    <div className="lottery-container">

                        <CurrentRound>

                        </CurrentRound>

                        <RoundPotDistribution>

                        </RoundPotDistribution>

                        <YourTickets>

                        </YourTickets>

                    </div>
                </Box>
            </PageContainer>
        </BaseContainer>
    )
});

export default SecretLottery;
