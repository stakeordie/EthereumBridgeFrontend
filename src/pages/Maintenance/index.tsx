import React, { useState } from 'react';
import { Box } from 'grommet';
import { Title, Text } from 'components/Base';
import * as styles from './under-maintenance.styl';
import { PageContainer } from 'components/PageContainer';
import { BaseContainer } from 'components/BaseContainer';
import { Icon } from 'components/Base/components/Icons';

export const Maintenance = () => {
  return (
    <BaseContainer>
      <PageContainer>
        <Box className={styles.maintenance} pad={{ horizontal: 'large', top: 'large' }}>
          {/* <Box direction="row" justify="center" margin={{ bottom: 'medium' }}>
            <Title
              style={{
                // color: '#47b8eb',
                fontWeight: 600,
                letterSpacing: 0.2,
              }}
              size="large"
            >
              FAQ
            </Title>
          </Box> */}
          <Box style={{ background: 'transparent', borderRadius: 5 }} pad="xlarge">
            <div className={styles.maintenance__container}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M55.002 5C43.9863 5 35.002 13.9844 35.002 25C35.002 26.7773 35.4707 28.3789 35.9004 29.9609L34.6895 31.1719L25.002 21.4648V13.6133L23.8301 12.8906L12.1504 5.58594L5.58789 12.0312L13.5957 25H21.4668L31.1738 34.6875L12.9316 52.9297C9.04492 56.8164 9.04492 63.1836 12.9316 67.0703C16.8184 70.957 23.1855 70.957 27.0723 67.0703L40.0019 54.1406L52.9316 67.0703C56.8184 70.957 63.1855 70.957 67.0723 67.0703C70.959 63.1836 70.959 56.8164 67.0723 52.9297L58.752 44.6094C67.9902 42.8516 75.002 34.7266 75.002 25C75.002 21.6602 74.1035 18.5547 72.6973 15.8398L71.1152 12.8125L68.7129 15.2344L57.9707 25.957L54.0449 22.0312L67.1895 8.86719L64.1621 7.30469C61.4473 5.89844 58.3418 5 55.002 5ZM55.002 10C56.1348 10 57.1113 10.5469 58.1855 10.8203L46.9746 22.0312L57.9707 33.0273L69.2012 21.8164C69.4551 22.8906 70.002 23.8672 70.002 25C70.002 33.3203 63.3223 40 55.002 40C53.2832 40 51.6426 39.6484 50.002 39.0625L48.5176 38.5547L23.5371 63.5352C21.5644 65.5078 18.4395 65.5078 16.4668 63.5352C14.4941 61.5625 14.4941 58.4375 16.4668 56.4648L41.4473 31.4844L40.9394 30C40.3535 28.3594 40.0019 26.7188 40.0019 25C40.0019 16.6797 46.6816 10 55.002 10ZM12.8535 11.9141L20.002 16.3867V19.5898L19.5918 20H16.4082L11.9355 12.793L12.8535 11.9141ZM50.041 44.1016C50.5488 44.2383 51.0566 44.3555 51.5645 44.4922L63.5371 56.4648C65.5098 58.4375 65.5098 61.5625 63.5371 63.5352C61.5645 65.5078 58.4395 65.5078 56.4668 63.5352L43.5371 50.6055L50.041 44.1016Z" fill="#FF726E"/>
          </svg>

            <h1>Website under maintenance</h1>
            <p>We should be back shortly. Thanks for your patience.</p>
            </div>
          </Box>
        </Box>
      </PageContainer>
    </BaseContainer>
  );
};
