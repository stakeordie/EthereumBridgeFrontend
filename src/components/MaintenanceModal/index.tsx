import React from 'react';
import { observer } from 'mobx-react';
import { Modal } from 'semantic-ui-react';
import './style.scss';
import { CloseIcon } from 'ui/Icons';
import { useStores } from 'stores';

interface MaintenanceModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  subtitle: string;
  children?: any;
}
const MaintenanceModal = ({ open, setOpen, children, title, subtitle }: MaintenanceModalProps) => {
  const { theme } = useStores();
  return (
    <Modal  trigger={children} className={`maintenance ${theme.currentTheme}`} open={open} onClose={() => setOpen(false)}>
      <div className="img-wrapper">
        <img src="/static/maintenance_icon.png" alt="Maintenance icon" />
        <CloseIcon onClick={()=>setOpen(false)}/>
      </div>
      <h2>{title}</h2>
      <span>{subtitle}</span>
      <button onClick={() => setOpen(false)}>Ok</button>
    </Modal>
  );
};

export default MaintenanceModal;
