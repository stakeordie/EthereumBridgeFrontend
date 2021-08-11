import React from 'react';
import { PageContainer } from 'components/PageContainer';
import { BaseContainer } from 'components/BaseContainer';
import { Box } from 'grommet';
import { observer } from 'mobx-react';
import { useStores } from 'stores';
import './index.scss';
import CurrentRound from 'components/SecretLottery/CurrentRound';

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
                        <CurrentRound> </CurrentRound>
                    </div>
                </Box>
            </PageContainer>
        </BaseContainer>
    )
});

export default SecretLottery;
