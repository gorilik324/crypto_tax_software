export interface Coin {
  amount: number;
  costBasis: number;
  time: number;
  exchange:  string;
}

export interface CoinWallet {
  name: string;
  symbol: string;
  coins: Coin[];
}

export interface CostBasisCoinInfo{
  time: number;
  exchange: string;
  coinLength: number;
  lastSize: number;
  cost: number;
}

export interface Sale {
  sym: string;
  time: number;
  amount: number;
  costBasisUSD: number;
  costBasisUnfound: boolean;
  price: number;
  exchange: string;
  date?: string;
  buyMktPrc?: number;
  buyAmt?: number;
  lineNum?: number;
  fileName?: string;
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
  exchange: string;
  lineNum?: number;
  fileName?: string;
  ordernum?: number;
  feeSym?: string;
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

export interface BoughtSold {
  buyAmt: number;
  sellAmt: number;  
}
