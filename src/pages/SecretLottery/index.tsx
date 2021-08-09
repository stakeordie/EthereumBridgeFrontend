import React from 'react';
import { PageContainer } from 'components/PageContainer';
import { BaseContainer } from 'components/BaseContainer';
import { Box } from 'grommet';
import { observer } from 'mobx-react';
import { useStores } from 'stores';
import './index.scss';

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
                    <h1>Hello From Secret Lottery</h1>
                </Box>
            </PageContainer>
        </BaseContainer>
    )
});

export default SecretLottery;
