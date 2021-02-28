import { EXCHANGE_MODE } from 'stores/interfaces';
import Web3 from 'web3';
import * as bech32 from 'bech32';

export const validateTokenInput = (token: any) => {
  if (!token || !token.symbol) return 'This field is required.'
  return ""
}

export const validateAmountInput = (value: string, tokenInfo: any) => {
  if (!value || !value.trim() || Number(value) <= 0) return 'This field is required.'
  if (Number(value) > Number(tokenInfo.maxAmount.replace(/,/g, ''))) return 'Exceeded the maximum amount.'
  if (Number(value) < Number(tokenInfo.minAmount.replace(/,/g, ''))) return 'Below the minimum amount.'

  return ""
}

export const validateAddressInput = (exchange: any) => {
  const value = exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH ? exchange.transaction.ethAddress : exchange.transaction.scrtAddress
  if (exchange.mode === EXCHANGE_MODE.SCRT_TO_ETH) {
    const web3 = new Web3();
    if (!web3.utils.isAddress(value) || !web3.utils.checkAddressChecksum(value)) return 'Not a valid Ethereum Address.'
  }
  if (exchange.mode === EXCHANGE_MODE.ETH_TO_SCRT) {
    if (!value.startsWith('secret')) return 'Not a valid Secret Address.'

    try {
      bech32.decode(value);
    } catch (error) {
      return 'Not a valid Secret Address.'
    }
  }
  return ""
}