import fs from 'fs'
import { MarketPrice, AllMarketPrices, MarketPriceWithLoc } from './types'
const axios = require('axios');

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
  let avgPrc;
  let values;
  dataLines.shift();
  for(let i = 0; i< dataLines.length; ++i ){
  //dataLines.forEach((line) => {
    values = dataLines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if(Number(values[4])>0){
      marketPrices.push({
        timestamp: Date.parse(values[0]),
        price: Number(values[4])
      })
    }
 // })
  }

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

export function getBNBDaily(): MarketPrice[] {
  let data = fs.readFileSync(`data/prices/BNB-USD.csv`, 'utf-8')
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

function sortMktPrice(prcs: MarketPrice[]){
  return prcs.sort((a: MarketPrice, b: MarketPrice) => a.timestamp - b.timestamp);
}



export function getCoinPrice(coin: string): MarketPrice[] {
  if(coin==="ETH"){
    return sortMktPrice(getHourlyCoinBaseEth());
  } else if(coin==="USDT"){
    return sortMktPrice(getCoinPriceForUSDT());
  } else if(coin==="ZEC"){
    return sortMktPrice(getZEC());
  } else if(coin=="BTC"){
    return sortMktPrice(get15minCoinBaseBtc());
  } else if(coin=="BNB"){
    return sortMktPrice(getBNBDaily());
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
  return sortMktPrice(marketPrices)
}

export function getPrice(sym: string, timeStamp: number, allMarketPrices: AllMarketPrices, debugInfo: any): number{
  let data = allMarketPrices.get(sym)
  if(sym==="USD"){
      return 1;
  }
  if(data === undefined){
    console.log(`data is undefined for ${sym} ${timeStamp}`)
    throw('undefined data in getPrice')
    return -99;
  }
  while(data.loc < data.marketPrcs.length && data.marketPrcs[data.loc].timestamp < timeStamp){
      data.loc++;
  }
  if(data.loc >= data.marketPrcs.length){
    data.loc--;
  }
  if(sym==="BTC"){
    //if(data.marketPrcs[data.loc].timestamp===1544238000000)
    // throw("zzzzzzzzz")
    if(data.marketPrcs[data.loc].price>20000){
      throw(`price too large: ${data.marketPrcs[data.loc].price}`)
    }

    //fs.appendFileSync("output/debug443.log", `${data.marketPrcs[data.loc].timestamp} ${data?.marketPrcs[data.loc].timestamp}}\n`);
  }
  
  debugInfo.time =  data.marketPrcs[data.loc].timestamp;
  if(data.loc>0){
    return (data.marketPrcs[data.loc-1].price + data.marketPrcs[data.loc].price)/2.0;
  } else {
    return data.marketPrcs[data.loc].price;
  } 
}

export function loadMktData(syms: string[]): AllMarketPrices {
  const allMarketPrcs: AllMarketPrices = new Map();
  syms.forEach( (sym) => {
    allMarketPrcs.set(sym, {
      marketPrcs: getCoinPrice(sym), loc: 0 })
  })
  return allMarketPrcs;
}


export async function getCoinBaseProData(sym:string){
  let startTime = new Date("2016-10-01").getTime()/1000;
  const endTime = new Date("2019-03-01").getTime()/1000;
  const gradularity = 900;
  let lastTime = startTime + 300*gradularity;
  let data = [];
  let i = 0;
  while(lastTime < endTime){
    let config = {
      method: 'get',
      url: `https://api.exchange.coinbase.com/products/${sym}/candles?granularity=${gradularity}&start=${startTime}&end=${lastTime}`,
      headers: { 
        'Content-Type': 'application/json'
      }
    };
    ++i;
    const response = await axios(config);
    console.log(response)
    data.push(...response.data);
    await new Promise(resolve => setTimeout(resolve, 15000));
    startTime = lastTime;
    lastTime += 300*gradularity;
  }
  console.log(endTime)
  fs.writeFileSync(`data/prices/${sym}-15min.csv`, `[`);
  data.forEach( (array1: any, index: number) => {
    array1[0] *= 1000;
    fs.appendFileSync(`data/prices/${sym}-15min.csv`, `${JSON.stringify(array1)}`)
    if(index < data.length-1){
      fs.appendFileSync(`data/prices/${sym}-15min.csv` ,',\r\n')
    }
  })
  fs.appendFileSync(`data/prices/${sym}-15min.csv`, `]`)
  // fs.writeFileSync(`data/prices/${sym}-USD-Hourly.csv`, `${JSON.stringify(data)})}`)
  return
}

export function getHourlyCoinBaseBtc():  MarketPrice[]{
  let data1 = fs.readFileSync('data/prices/BTC-USD-Hourly.csv');
  let data = JSON.parse(data1.toString());
  const mktPrcs: MarketPrice[] = [];
  data.forEach( (array1: any) => {
    mktPrcs.push({
      timestamp: array1[0],
      price: array1[4]
    })
  })
  mktPrcs.sort((a: any, b: any) => a.timestamp - b.timestamp)
  // let log = fs.createWriteStream("output/debugBTChourly.log", {flags: 'w'});
 // mktPrcs.forEach( (mktPrc: MarketPrice) => log.write(`${mktPrc.timestamp} ${mktPrc.price}\n`))
 // log.end();
  return mktPrcs;
}

export function get15minCoinBaseBtc():  MarketPrice[]{
  let data1 = fs.readFileSync('data/prices/BTC-USD-15min.csv');
  let data = JSON.parse(data1.toString());
  const mktPrcs: MarketPrice[] = [];
  data.forEach( (array1: any) => {
    mktPrcs.push({
      timestamp: array1[0],
      price: array1[4]
    })
  })
  mktPrcs.sort((a: any, b: any) => a.timestamp - b.timestamp)
  // let log = fs.createWriteStream("output/debugBTChourly.log", {flags: 'w'});
 // mktPrcs.forEach( (mktPrc: MarketPrice) => log.write(`${mktPrc.timestamp} ${mktPrc.price}\n`))
 // log.end();
  return mktPrcs;
}

export function getHourlyCoinBaseEth():  MarketPrice[]{
  let data1 = fs.readFileSync('data/prices/ETH-USD-USD-Hourly.csv');
  let data = JSON.parse(data1.toString());
  const mktPrcs: MarketPrice[] = [];
  data.forEach( (array1: any) => {
    mktPrcs.push({
      timestamp: array1[0],
      price: array1[4]
    })
  })
  mktPrcs.sort((a: any, b: any) => a.timestamp - b.timestamp)
  return mktPrcs;
}






