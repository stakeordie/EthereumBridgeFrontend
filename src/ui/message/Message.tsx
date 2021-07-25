import React, { useState } from 'react'
import './styles.scss';
import { Link } from 'react-router-dom';

const MessageDismiss = () => {
  const [visible, setVisible] = useState(true);

  const handleDismiss = (e) => {
    e.preventDefault();
    setVisible(false);
  };

  return (
    <>
      {
        visible ?
          <div className="messsage-body">
            <div className="message-content">
              <p className="header">SecretSwap X pool has been upgraded.</p>
              <p className="subtitle">
                <a>Migrate your tokens</a> to continue to earn rewards.
              </p>
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
