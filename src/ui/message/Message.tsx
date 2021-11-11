import React, { useState } from 'react'
import './styles.scss';
import { Link } from 'react-router-dom';
import { useStores } from 'stores';

const MessageDismiss = () => {
  const { theme } = useStores();
  const [visible, setVisible] = useState(true);

  const handleDismiss = (e) => {
    e.preventDefault();
    setVisible(false);
  };

  return (
    <>
      {
        visible ?
          <div className={`messsage-body ${theme.currentTheme}`}>
            <div className="message-content">
              <p className="header">🚨SecretSwap will be undergoing <strong>maintenance</strong> on the <strong>10th</strong> for the <a href="https://scrt.network/blog/supernova-explosive-vision-future-secret-network">Supernova</a> upgrade🚨</p>
            </div>
            <div className="close-content">
              <a onClick={(e) => handleDismiss(e)}>
                <img src="/static/close.svg" alt="close icon" />
              </a>
            </div>
          </div>
          : null
      }
    </>
  );
}

export default MessageDismiss;
