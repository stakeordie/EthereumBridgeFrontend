import React from 'react';
import { Button, Input, Radio, Icon } from 'semantic-ui-react';
import cn from 'classnames';
import * as styles from './styles/styles.styl';

class Warning extends React.Component {
  render() {
    return <></>;
  }
}

export class ConfigPage extends React.Component<{}, {}> {
  slippageValues = [0.1, 0.5, 1];
  state = {
    selectedSlippage: this.slippageValues[1],
    customSlippage: false,
    expertMode: false,
  };

  changeSelectedSlippage = selected =>
    this.setState(() => ({
      selectedSlippage: selected,
      customSlippage: false,
    }));

  changeCustomSlippage = (_, slippage) => {
    if (slippage.value === '') {
      this.setState(() => ({
        selectedSlippage: this.slippageValues[1],
        customSlippage: false,
      }));
    } else {
      this.setState(() => ({
        selectedSlippage: Number(slippage.value),
        customSlippage: true,
      }));
    }
  };

  checkSlippage = slip => {
    const slipNumber = Number(slip);

    if (slipNumber === NaN || slipNumber <= 0 || slipNumber >= 50) {
      return {
        type: 'error',
        msg: 'Enter a valid slippage percentage',
      };
    }

    if (slipNumber < 0.5) {
      return {
        type: 'warning',
        msg: 'This transaction may fail',
      };
    }

    return { type: 'valid', msg: '' };
  };

  render() {
    const selectedSlippage = this.state.selectedSlippage;

    return (
      <>
        <div>Transaction Settings</div>
        <div>Slippage Tolerance</div>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          {this.slippageValues.map(slip => (
            <Button
              key={'slip-button-' + slip}
              basic={selectedSlippage !== slip}
              onClick={() => this.changeSelectedSlippage(slip)}
              compact
              circular
              size="small"
              color="blue"
            >
              {slip}%
            </Button>
          ))}
          <Input
            placeholder={this.state.selectedSlippage}
            size="small"
            onChange={this.changeCustomSlippage}
            icon={true}
          >
            <input className={cn(styles.slippageInput)}></input>
            <Icon name="percent" />
          </Input>
        </div>
        <div>
          Toggle Expert Mode <Radio toggle />
        </div>
      </>
    );
  }
}
