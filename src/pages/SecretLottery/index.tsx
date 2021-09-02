import React, { useEffect } from 'react';
import { useStores } from 'stores';
import ReactNotification from 'react-notifications-component';
import KeplrSetup from '../../components/Lottery/KeplrSetup';
import CreateViewkey from '../../components/Lottery/CreateViewkey';
import CurrentRoundSection from '../../components/Lottery/CurrentRoundSection';
import UserRounds from '../../components/Lottery/UserRounds';
import RoundViewer from '../../components/Lottery/RoundViewer';
import './lottery.scss';
import { BaseContainer, PageContainer } from 'components';
import { Box } from 'grommet';
import { observer } from 'mobx-react';

const Lottery = observer(() => {
  let { theme,lottery } = useStores();
  const { configs,viewingKey,client,ticketsCount,paginationValues,userRoundTicketsModal} = lottery


  useEffect(() => {
    (async()=>{
      await lottery.getConfigsTrigger(client);
    })();
    setInterval(async() => {
        await lottery.getConfigsTrigger(client)
    }, 30000); // check 30 seconds
  }, [client])

  useEffect(()=>{
    (async()=>{
        try {
          await lottery.getSefiPrice();
        } catch (error) {
            console.error(error);
        }          
    })()
  },[])

  useEffect(()=>{
      lottery.setManualTickets();
  },[ticketsCount])

  useEffect(() => {
    (async()=>{
      if(viewingKey && configs){
          await lottery.getUserTicketsRound(client, viewingKey, configs.current_round_number);
      }

      if (configs) {
          await lottery.getCurrentRound(client, configs.current_round_number);
          await lottery.getRoundStakingRewardsTrigger(client, configs)
      }
    })()
  }, [configs])

    useEffect(() => {
      (async()=>{
        if (viewingKey) {
           await lottery.getPaginatedUserTicketsTrigger(client, viewingKey, paginationValues.page, paginationValues.page_size)
        }
      })()
    }, [client, viewingKey,configs])

    useEffect(() => {
      (async () => {
        if(!lottery.roundViewer){
          await lottery.getRoundViewer(lottery.configs.current_round_number - 1);
        }else{
          await lottery.getRoundViewer(lottery.roundViewer.round_number);
        }
      })()
  }, [client, configs])

  useEffect(() => {
    if (client && viewingKey && userRoundTicketsModal.selectedUserRound && userRoundTicketsModal.userTicketsCount) {
      lottery.setUserRoundTickets(null)
      lottery.getUserRoundPaginatedTicketsTrigger(client, viewingKey, userRoundTicketsModal.selectedUserRound, userRoundTicketsModal.userTicketsCount)
    }
  }, [userRoundTicketsModal])

  return (
    <div className="App">
      <BaseContainer>
        <PageContainer>
          <Box
            className={`${theme.currentTheme}`}
            pad={{ horizontal: '136px', top: 'small' }}
            style={{ alignItems: 'center' }}
          >
            <ReactNotification />
            <KeplrSetup />
            <CreateViewkey menu={'SEFI'} />
            <div className={`lottery-container ${theme.currentTheme}`}>
              <CurrentRoundSection />
              <UserRounds />
              <RoundViewer />
            </div>
          </Box>
        </PageContainer>
      </BaseContainer>
    </div>
  );
});

export default Lottery;
