import React from 'react';
import { Button, Input, Grid, Search } from 'semantic-ui-react';
import cn from 'classnames';
import * as styles from './styles/styles.styl';
import { Dictionary } from 'lodash';

export class ConfigPage extends React.Component<{}, { slippage: number }> {
  state = { slippage: 0.5 };
  handleClick = selected => this.setState(() => ({ slippage: selected }));

  render() {
    const { slippage } = this.state;

    return (
      <>
        <div>Transaction Settings</div>
        <div>Slippage tolerance</div>
        <Button
          basic={slippage !== 0.1}
          onClick={() => this.handleClick(0.1)}
          compact
          circular
          size="small"
          color="blue"
        >
          0.1%
        </Button>
        <Button
          basic={slippage !== 0.5}
          onClick={() => this.handleClick(0.5)}
          compact
          circular
          size="small"
          color="blue"
        >
          0.5%
        </Button>
        <Button
          basic={slippage !== 1}
          onClick={() => this.handleClick(1)}
          compact
          circular
          size="small"
          color="blue"
        >
          1%
        </Button>
        {/* <Input placeholder="0.5%" size="small" icon={'none'} /> */}
      </>
    );
  }
}
