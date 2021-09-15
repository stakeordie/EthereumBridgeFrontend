import React, {useEffect, useState} from 'react';
import MaintenanceModal from '../MaintenanceModal/index';
import { useStores } from 'stores';
import { observer } from 'mobx-react'; 

export default observer(() => {  
  const { user } = useStores();

  return (

      <>  
        <MaintenanceModal
            title="This functionality is currently disabled."
            subtitle="Please try again later or after an announcement is made regarding this feature."
            open={user.isMaintenanceOpen}
            setOpen={() => user.setMaintenanceModal(false)}
        />
      </>

  )

});
