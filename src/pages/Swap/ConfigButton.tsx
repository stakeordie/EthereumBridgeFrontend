import React from 'react';
import { Icon, Popup } from 'semantic-ui-react';
import cn from 'classnames';
import * as styles from './styles/styles.styl';
import { ConfigPage } from './ConfigPage';

export class ConfigButton extends React.Component {
  constructor(props: Readonly<{}>) {
    super(props);
  }

  render() {
    return (
      <div className={cn(styles.configButton)}>
        <Popup
          content={<ConfigPage></ConfigPage>}
          on="click"
          trigger={<Icon link name="cog" size="large" />}
          position="bottom right"
          basic
        ></Popup>
      </div>
    );
  }
}
