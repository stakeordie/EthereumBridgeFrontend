import React,{ useEffect, useState} from 'react';
import {Link} from 'react-router-dom'
import { Redirect, useHistory } from 'react-router';
import { observer } from 'mobx-react-lite';
import { useStores } from '../../stores';
import {SefiModal} from '../SefiModal';
import  "./header.scss";
import { getNativeBalance, wrongViewingKey } from './utils';
import { BigNumber } from 'bignumber.js';
import { displayHumanizedBalance, fixUnlockToken, humanizeBalance, unlockToken } from 'utils';
import { SwapToken, SwapTokenMap, TokenMapfromITokenInfo } from 'pages/TokenModal/types/SwapToken';
import { ITokenInfo } from 'stores/interfaces';
import { notify } from 'pages/Earn';
// Import Icons
const Header = observer(({forceUpdate}:{forceUpdate:any}) =>{
    const history = useHistory(); 
    const governancePaths = ['governance','proposal','sefistaking']
    const { user, tokens,userMetamask,theme } = useStores();
    const isSwap = history.location.pathname === '/swap';
    const isPool = history.location.pathname === '/pool';
    const isEarn = history.location.pathname === '/earn';
    const isCashback = history.location.pathname === '/cashback';
    const isGovernance = governancePaths.map((string) => (history.location.pathname.match(string)) ? true : false).includes(true);
    // const isApplications = history.location.pathname === '/secret-lottery';
    const isApplications = history.location.pathname === '/lottery';
    

    const handleSignIn = async()=>{
        if(user.isKeplrWallet){
            user.signIn();
        }else{
            console.log("Not keplr extention")
            notify("error","It seems like you don't have Keplr extention installed in your browser. Install Keplr, reload the page and try again")
        }
    }

    const getAddress = ():string=>{
        if(user.address){
            return (user?.address?.substring(0,7) +'...' + user?.address?.substring(user?.address?.length - 3,user?.address?.length));
        }else{
            return '';
        }
    }
    function switchTheme(){  
        theme.switchTheme();
        forceUpdate();
        // window.location.reload();
    }

    return(
        <>
            <div className={theme.currentTheme}>
                    <nav className={`menu`} > 
                    <div className="menu-left">
                        <a href="https://www.secretswap.io/">
                            <img src='/static/secret-swap.svg' alt="brand logo"/> 
                        </a>

                        <ul className='nav_menu__items'>
                            <li className={(isSwap) ? 'active':''}><Link  to={"/swap"}>Swap</Link></li>
                            <li className='hide_mobile'><span>|</span></li>
                            <li  className={(isPool)  ? 'active hide_mobile':'hide_mobile'}><Link  to={"/pool"}>Pool</Link></li>
                            <li><span>|</span></li>
                            <li  className={(isEarn) ? 'active':''}><Link  to="/earn">Earn</Link></li>
                            <li className='hide_mobile'><span>|</span></li>
                            <li className={(isCashback)  ? 'active hide_mobile':'hide_mobile'}><Link  to="/cashback">Cashback</Link></li> 
                            <li><span>|</span></li>
                            <li className={(isGovernance)  ? 'active hide_mobile':'hide_mobile'}><Link  to="/governance">Governance</Link></li> 
                            <li><span>|</span></li>
                            {/* <li className={(isApplications) ? 'active hide_mobile' : 'hide_mobile'}><Link to="/secret-lottery">Applications</Link></li> */}
                            <li className={(isApplications) ? 'active hide_mobile' : 'hide_mobile'}><Link to="/lottery">Applications</Link></li>
                        </ul>
                    </div>
                    
                    <div className="menu-right">
                        
                        <SefiModal
                            tokens={tokens}
                            user={user}
                            metaMask={userMetamask}
                        />
                        <div className="btn-main">
                            <div className="wallet-icon"> 
                                <img src="/static/wallet-icon.svg" alt="wallet icon"/>
                            </div>
                    {(!user.address || !user.isAuthorized)?
                        <div>
                            
                            {
                                (user.isUnconnected == 'true')&&
                                    <span onClick={handleSignIn} className="connect_btn">Click to Connect</span> 
                            }
                            {
                                (user.isUnconnected === 'UNINSTALLED')&&
                                    <span onClick={handleSignIn} className="connect_btn">Install Keplr to Continue</span>
                            }
                        </div>
                        : 
                        <div className="address_container">
                            <p>{getAddress()}</p>
                            <span className="separator">|</span>
                            <div>
                                <p className="balance">{user.balanceSCRT}</p>
                                <p>SCRT</p>
                            </div>
                        </div>
                    }
                    </div>
                    {/* <div className="kpl_images__container">
                        <div className={(!user.address || !user.isAuthorized)? 'keplr__status':'keplr__status keplr__status--online'}></div>
                        <img onClick={handleSignIn} src='/static/keplricon.svg' alt="Key Icon"/>
                    </div> */}
                        <div className="theme__container">
                            {(theme.currentTheme == 'light')?
                                <img onClick={switchTheme} src='/static/moon.svg' alt="Key Icon"/>:
                                <img onClick={switchTheme} src='/static/sun.svg' alt="Key Icon"/>
                            
                            }
                        </div>
                    </div>

                </nav> 
            </div>
        </>
    )

})

export default Header;