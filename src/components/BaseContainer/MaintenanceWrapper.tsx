import React from "react";
import MaintenanceModal from 'components/MaintenanceModal';
import { observer } from "mobx-react";
import { useStores } from "stores";

export default observer(()=>{
  const {user} = useStores();
  return (
    <MaintenanceModal
      title="We are working to add functionality back to Secret Swap as soon as possible."
      subtitle="Please try again a little later."
      open={user.isModalOpen}
      setOpen={(open: boolean) => user.setModalOpen(open)}
    />
  )
})
