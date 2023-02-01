import fs from 'fs'
import { MarketPrice, AllMarketPrices, MarketPriceWithLoc } from './types'

export function getCoinPriceForEth(): MarketPrice[] {
  let data = fs.readFileSync(`data/prices/ETH_day.csv`, 'utf-8')
  let dataLines: string[] = data.split(/\r?\n/);
  let marketPrices: MarketPrice[] = []
  let values;
  dataLines.shift();

  dataLines.forEach((line) => {
    values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if(Number(values[5])>0){
      marketPrices.push({
        timestamp: Date.parse(values[0]),
        price: Number(values[5])
      })
    }
  })

  marketPrices.reverse();
  return marketPrices
}

export function getCoinPriceForUSDT(): MarketPrice[] {
  let data = fs.readFileSync(`data/prices/USDT-USD-all.csv`, 'utf-8')
  let dataLines: string[] = data.split(/\r?\n/);
  let marketPrices: MarketPrice[] = []
  let values;
  dataLines.shift();

  dataLines.forEach((line) => {
    values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if(Number(values[4])>0){
      marketPrices.push({
        timestamp: Date.parse(values[0]),
        price: Number(values[4])
      })
    }
  })

  marketPrices.reverse();
  return marketPrices
}


export function getZEC(): MarketPrice[] {
  let data = fs.readFileSync(`data/prices/zcash.csv`, 'utf-8')
  let dataLines: string[] = data.split(/\r?\n/);
  let marketPrices: MarketPrice[] = []
  let values;
  dataLines.shift();

  dataLines.forEach((line) => {
    values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if(Number(values[4])>0){
      marketPrices.push({
        timestamp: Date.parse(values[0]),
        price: Number(values[5])
      })
    }
  })
  return marketPrices
}



export function getCoinPrice(coin: string): MarketPrice[] {
  if(coin==="ETH"){
    return getCoinPriceForEth();
  } else if(coin==="USDT"){
    return getCoinPriceForUSDT();
  } else if(coin==="ZEC"){
    return getZEC();
  }
  let data = fs.readFileSync(`data/prices/${coin}-USD.csv`, 'utf-8')
  let dataLines: string[] = data.split(/\r?\n/);
  let marketPrices: MarketPrice[] = []
  let values;
  dataLines.shift();

  dataLines.forEach((line) => {
    values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    marketPrices.push({
      timestamp: Date.parse(values[0]),
      price: Number(values[5])
    })
  })


  return marketPrices
}

export function getPrice(sym: string, timeStamp: number, allMarketPrices: AllMarketPrices): number{
  let data = allMarketPrices.get(sym)
  if(data === undefined){
    console.log(`data is undefined for ${sym}`)
    return -99;
  }
  while(data.loc < data.marketPrcs.length && data.marketPrcs[data.loc].timestamp < timeStamp){
      data.loc++;
  }
  if(data.loc >= data.marketPrcs.length){
    data.loc--;
  }
  return data.marketPrcs[data.loc].price;
}

export function loadMktData(syms: string[]): AllMarketPrices {
  const allMarketPrcs: AllMarketPrices = new Map();
  syms.forEach( (sym) => {
    allMarketPrcs.set(sym, {
      marketPrcs: getCoinPrice(sym), loc: 0 })
  })
  return allMarketPrcs;
}








