import React from "react";
import MaintenanceModal from 'components/MaintenanceModal';
import { observer } from "mobx-react";
import { useStores } from "stores";

export default observer(()=>{
  const {user} = useStores();
  return (
    <MaintenanceModal
      title="This functionality is currently disabled."
      subtitle="Please try again later or after an announcement is made regarding this feature"
      open={user.isModalOpen}
      setOpen={(open: boolean) => user.setModalOpen(open)}
    />
  )
})
