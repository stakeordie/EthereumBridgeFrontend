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
import ReservePot from 'components/Lottery/ReservePot';
import CreatePermit from 'components/Lottery/CreatePermit';

const Lottery = observer(() => {
  let { theme,lottery } = useStores();
  const { configs,client,ticketsCount,paginationValues,userRoundTicketsModal,currentPage, hasPermit } = lottery

  useEffect(() => {
    if(!client) return;
    (async()=>{
      await lottery.getConfigsTrigger(client);
      await lottery.getSEFIBalance();
    })();
    setInterval(async() => {
        await lottery.getConfigsTrigger(client)
    }, 60000); // check 1 minute
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
      if(hasPermit && configs){
          await lottery.getUserTicketsRound(client, configs.current_round_number);
      }

      if (configs) {
          await lottery.getCurrentRound(client, configs.current_round_number);
          await lottery.getRoundStakingRewardsTrigger(client, configs)            
      }
    })()
  }, [configs])

    useEffect(() => {
      (async()=>{
        if (!hasPermit || !client || !configs) return;        
        await lottery.getPaginatedUserTicketsTrigger(client, paginationValues.page, paginationValues.page_size)
        
      })()
    }, [client, hasPermit,configs])

    useEffect(() => {
      (async () => {
        if (!client || !configs) return;
        if(!lottery.roundViewer){
          await lottery.getRoundViewer(lottery.configs.current_round_number - 1);
        }else{
          await lottery.getRoundViewer(lottery.roundViewer.round_number);
        }
      })()
  }, [client, configs])

  useEffect(() => {
    if (client && hasPermit && userRoundTicketsModal.selectedUserRound && userRoundTicketsModal.userTicketsCount) {
      lottery.setUserRoundTickets(null)
      lottery.getUserRoundPaginatedTicketsTrigger(client, hasPermit, userRoundTicketsModal.selectedUserRound, userRoundTicketsModal.userTicketsCount)
    }
  }, [userRoundTicketsModal, currentPage])
  
  useEffect(() => {
    if (!client || !lottery.setPermit || !lottery) {return;}

    lottery.setPermit(false);

    if (localStorage.getItem('lottery_permit_' + client.accountData.address)) {
      lottery.setPermit(true);
    }
  }, [client, lottery.setPermit, hasPermit]);


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
            <CreatePermit/>
            <div className={`lottery-container ${theme.currentTheme}`}>
              <CurrentRoundSection />
              <UserRounds />
              <RoundViewer />
              <ReservePot value={parseInt(configs?.current_reserve_pot) / 1000000}/>
            </div>
          </Box>
        </PageContainer>
      </BaseContainer>
    </div>
  );
});

export default Lottery;
