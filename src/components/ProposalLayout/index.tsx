import { BaseContainer, PageContainer } from 'components';
import { Box } from 'grommet';
import React, { ReactChild } from 'react';
import { Link } from 'react-router-dom';
import { useStores } from 'stores';
import './style.scss';

const ProposalLayout = (props: {
    children: ReactChild,
    width?: string,
    maxWidth?:string,
}) => {
    const { theme } = useStores();
    return (
        <BaseContainer>
            <PageContainer>
                <Box
                    className={`proposal-layout ${theme.currentTheme}`}
                    pad={{ horizontal: '136px', top: 'small' }}
                    style={{ alignItems: 'center' }}
                >
                    <div style={{ width: props.width || '90%',maxWidth: props.maxWidth || '90%' }}>
                        <div className='go-back'>
                            <Link className='go-back' to='/governance' >
                                <img src="/static/arrow-left.svg" alt="go-back" />
                                <h3>Proposals</h3>
                            </Link>
                        </div>
                        <div className='proposal-layout-content'>
                            {props.children}
                        </div>

                    </div>
                </Box>
            </PageContainer>
        </BaseContainer>
    )
}

export default ProposalLayout;
