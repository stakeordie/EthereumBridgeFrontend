import React, { useEffect, useState } from 'react';
import { Button } from 'semantic-ui-react';
import { errorNotification, successNotification } from '../../utils/secret-lottery/notifications';
import { useStores } from 'stores';
import { observer } from 'mobx-react';

export default observer(() => {
  const [enablePermitLoading, setenablePermitLoading] = useState<Boolean>(false);

  const { lottery } = useStores();
  const { client, hasPermit } = lottery;

  return client?.execute && !hasPermit ? (
    <div style={{ width: '100%', justifyContent: 'center', padding: '1rem 0', display: 'flex' }}>
      <Button
        style={{ width: '210px' }}
        type="button"
        color="black"
        fluid
        onClick={async () => {
          setenablePermitLoading(true);
          try {
            await lottery.enablePermit(client);
            successNotification('Permit Enabled!');
          } catch (e) {
            errorNotification(e);
          }
          setenablePermitLoading(false);
        }}
      >
        {' '}
        {enablePermitLoading ? <i className="fa fa-spinner fa-spin"></i> : 'Enable Permit'}
      </Button>
    </div>
  ) : null;
});
