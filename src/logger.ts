import fs from 'fs'
import { UnmatchedSellReport, Trade, Sale, AllMarketPrices } from './types'
import { getPrice } from './mktDataInput'
const unMatchedFilledFile = 'output/unmatchedFilledTxt.log'
const unMatchedFilledErrorFile = 'output/unmatchedFilledTxtError.log'
const gainLossOnSalesFile = 'output/gainLosses.log'
const gainLossOnSalesErrorsFile = 'output/gainLosses.log'
const gainLossOnSalesSummary = 'output/gainLossesSummary.log'


function writefilledUnmatchedSells(sells: UnmatchedSellReport[], trades: Trade[]) {
  var logger = fs.createWriteStream(unMatchedFilledFile, {
    flags: 'w'
  })

  var loggerErrors = fs.createWriteStream(unMatchedFilledErrorFile, {
    flags: 'w'
  })

  sells.forEach((sell: UnmatchedSellReport) => {
    if (sell.locOnList < 0 || sell.locOnList > trades.length - 1) {
      loggerErrors.write(`${sell.amt},${sell.locOnList}, ${trades.length} \n`)
    } else {
      logger.write(`${JSON.stringify(sell)}, ${JSON.stringify(trades[sell.locOnList])} \n`)
    }
  })

  logger.end()
  loggerErrors.end()
}

function JsonToCsv(json: any[]) {
  if(!json || json.length===0){
    throw("no data to write")
  }
  var fields = Object.keys(json[0])
  var replacer = function (key: any, value: any) { return value === null ? '' : value }
  var csv = json.map(function (row) {
    return fields.map(function (fieldName) {
      return JSON.stringify(row[fieldName], replacer)
    }).join(',')
  })
  csv.unshift(fields.join(','))
  return (csv.join('\r\n'));
}

export async function writeSales(sells: Sale[], year: number = 0) {
  sells.forEach( sell => {
    sell.date = `${sell.time.toLocaleString()}`
  })
  if(year>0){
    const startTime = new Date(`${year}-01-01`).getTime();
    const endTime = new Date(`${year+1}-01-01`).getTime();
    sells.filter( sell => startTime > sell.time && sell.time < endTime);
  }

  fs.writeFile(gainLossOnSalesFile, JsonToCsv(sells), function (err) {
    if (err) {
      console.log(`error with writeSales: ${err}`);
    } else {
      console.log('Sales successfully written to file');
    }
  });

  

  let totalPnl = 0;
  let costBasisError = 0;
  sells.forEach((sell) => {
    if (sell.costBasisUSD > 0 || sell.exchange==='bitmex') {
      totalPnl += sell.proceedsUsd - sell.costBasisUSD;
    } else {
     // console.log(`no cost basis ${sell.price - sell.costBasisUSD}`);
      totalPnl += sell.proceedsUsd;
      costBasisError += sell.proceedsUsd;
    
    }
  })
  console.log(`cost basis error: ${costBasisError}`)
}

export async function writeUnfoundCostBasis(unfounds: Map<string, number>, time: number, mktPrcs: AllMarketPrices) {
  console.log("Unfound Cost Basis START\n")
  unfounds.forEach( (value: number, key: string) => {
    const mktPrc = getPrice(key, time, mktPrcs, {time: 0});
    console.log(`${key} ${value} ${mktPrc*value}`)
  })
  console.log("Unfound Cost Basis END\n")
}

function numberWithCommas(x: number) {
  
  const commaNumber = x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if(x<0){
    return `\u001b[31m$ ${commaNumber}\u001b[0m`
  } else if(x > 0){
    return `\u001b[32m$ ${commaNumber}\u001b[0m`
  }
}

export async function writeSalesSummary(sells: Sale[]) {
  try {
    if(sells === undefined || sells.length===0){
      console.log("no sells")
      return 0;
    }
    const exchs = new Map<string, number>();
    const currencies = new Map<string, number>();
    const logger = fs.createWriteStream(gainLossOnSalesSummary, { flags: 'a' })
    const loggerError = fs.createWriteStream(gainLossOnSalesErrorsFile, { flags: 'a' })
    let pnl = 0;
    let maxpnl = 0;
    let maxCostBasis = 0;
    let maxPrice = 0;
    let maxQaunt = 0;
    let maxSale ={}
    let yearOffset = 0;
    let tempPnl;
    let pnls =  Array(20).fill(0);
    const firstYear = new Date(sells[0].time!).getUTCFullYear();
    let amountUSDSold = 0;
    let maxAmountSold= 0;
    let tradeAtMaxAmtSold = {}
  

    sells.forEach((sell) => { 
      if(sell.sym=="USD"){
        return;
      }
      tempPnl = sell.proceedsUsd - sell.costBasisUSD;
      amountUSDSold += sell.proceedsUsd;
      pnl += tempPnl;
      if(tempPnl > maxpnl && sell.exchange !=="bitmex"){
        maxpnl = tempPnl;
        maxPrice = sell.proceedsUsd;
        maxQaunt = sell.amount;
        maxCostBasis = sell.costBasisUSD;
        maxSale = sell;

      }

      if(maxAmountSold > sell.proceedsUsd){
        tradeAtMaxAmtSold = sell;
        maxAmountSold = sell.proceedsUsd;
      }

     // maxpnl = Math.max(maxpnl, sell.price - sell.costBasisUSD);
      yearOffset = new Date(sell.time).getUTCFullYear() - firstYear ;
      pnls[yearOffset] += tempPnl;
      if(exchs.has(sell.exchange)){
        exchs.set(sell.exchange, exchs.get(sell.exchange)! + tempPnl)
      } else{
        exchs.set(sell.exchange, tempPnl);
      }
      if(currencies.has(sell.sym)){
        currencies.set(sell.sym, currencies.get(sell.sym)! + tempPnl)
      } else {
        currencies.set(sell.sym, tempPnl);
      }
    })
    console.log(`pnl: ${pnl}, maxPnl: ${maxpnl}, numSales: ${sells.length}, maxPrice: ${maxPrice}, maxCostBasis: ${maxCostBasis}, maxQaunt: ${maxQaunt} ${JSON.stringify(maxSale)} \n`)
    logger.write(`pnl: ${pnl}, maxPnl: ${maxpnl}, numSales: ${sells.length} \n`)
    pnls.forEach( (pnl: number, index) => {
      if(pnl !== 0) {
        console.log(`year: ${firstYear + index}, pnl: ${Math.floor(pnl)}`)
      }
    })
    exchs.forEach( (value, key) => {
      console.log(`exchange: ${key}, pnl: ${numberWithCommas(Math.floor(value))}`)
    })
    console.log("PNL BY SYMBOL")
    currencies.forEach( (value, key) => {
      console.log(`exchange: ${key}, pnl: ${numberWithCommas(Math.floor(value))}`)
    })
    
    console.log(`Amount USD sold: ${numberWithCommas(Math.floor(amountUSDSold))}`)
    console.log(`Max Amount USD sold: ${JSON.stringify(tradeAtMaxAmtSold)}, ${maxAmountSold}`)
  } catch (err) {
    console.log(`error with writeSalesSummary: ${err}`);
  }
}

export async function Log(message: string) {
  fs.appendFileSync("output/error.log", `${message} \n`);
}


