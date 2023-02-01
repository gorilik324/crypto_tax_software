export interface Coin {
  amount: number;
  costBasis: number;
  time: number;
}

export interface CoinWallet {
  name: string;
  symbol: string;
  coins: Coin[];
}

export interface Sale {
  sym: string;
  time: number;
  amount: number;
  costBasisUSD: number;
  costBasisUnfound: boolean;
  price: number;
}

export interface Trade {
  buyName: string;
  sellName: string;
  buySymbol: string;
  sellSymbol: string;
  buyAmount: number;
  sellAmount: number;
  fee: number;
  time: number;
  feeUsd: number;
  isBuy: boolean;
  type: string;
  costBasisUSD: number;
}

export interface UnmatchedSell {
  amt: number;
  locOnList: number;
}

export interface UnmatchedSellReport extends UnmatchedSell {
};

export interface MarketPrice {
  timestamp: number;
  price: number;
}

export interface MarketPriceWithLoc {
  marketPrcs: MarketPrice[],
  loc: number
}

export type AllMarketPrices = Map<string, MarketPriceWithLoc>;

