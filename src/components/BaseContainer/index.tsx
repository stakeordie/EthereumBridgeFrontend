import * as React from 'react';
import { Box, BoxProps } from 'grommet';
import { Head } from 'components';
import { MainFooter } from 'components';
import { withTheme } from 'styled-components';
import { IStyledChildrenProps } from 'interfaces';
import './notifications.css';
import Header from '../Header/Header';
import { useStores } from 'stores';
import * as styles from './styles.styl';
import MessageDismiss from 'ui/message/Message';

export const BaseContainer: React.FC<IStyledChildrenProps<BoxProps>> = withTheme(
  ({ theme, children, ...props }: IStyledChildrenProps<BoxProps>) => {
    // const { palette, container } = theme;
    // const { minWidth, maxWidth } = container;
    const [ignored, forceUpdate] = React.useReducer(x => x + 1, 0);
    const { theme: Theme } = useStores();

    return (
      <>
        {/*<div className={styles.backgroundImage} />*/}
        {/*<div className={styles.blur} />*/}
        <div
          style={{
            // minHeight: '100%',
            overflowY: "auto",
            overflowX: 'hidden',
          }}

        >
          <Header forceUpdate={forceUpdate} />

          <div
            className={`${styles[Theme.currentTheme]}`}
            {...props}
          >
            <div id="notifications_container"></div>
            {children}
            <div className={`${styles.bridge_link__container}`}><a href="https://bridge.scrt.network/">Bridge your assets to Secret Network</a></div>
            <div className={`${styles.secured_container}`}>
              <a href="https://scrt.network/"><img src="/static/securedby.svg" alt="" /></a>
            </div>
          </div>
          {/* <MainFooter /> */}
        </div>
      </>
    );
  },
);
