import React from 'react';
import { Button, Input, Grid, Search, Radio } from 'semantic-ui-react';
import cn from 'classnames';
import * as styles from './styles/styles.styl';

export class ConfigPage extends React.Component<{}, { slippage: number }> {
  state = { slippage: 0.5 };
  handleClick = selected => this.setState(() => ({ slippage: selected }));

  render() {
    const { slippage } = this.state;

    return (
      <>
        <div>Transaction Settings</div>
        <div>Slippage tolerance</div>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
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
          <Input placeholder="0.5%" size="small" icon={'none'}>
            <input className={cn(styles.slippageInput)}></input>
          </Input>
        </div>
        <div>
          Toggle Expert Mode <Radio toggle />
        </div>
      </>
    );
  }
}
