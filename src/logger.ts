import fs from 'fs'
import { UnmatchedSellReport, Trade, Sale } from './types'
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
  var fields = Object.keys(json[0])
  var replacer = function (key: any, value: any) { return value === null ? '' : value }
  var csv = json.map(function (row) {
    return fields.map(function (fieldName) {
      return JSON.stringify(row[fieldName], replacer)
    }).join(',')
  })
  return (csv.join('\r\n'));
}

export async function writeSales(sells: Sale[]) {
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
    if (sell.costBasisUSD > 0) {
      totalPnl += sell.price - sell.costBasisUSD;
    } else {
      console.log(`no cost basis ${sell.price - sell.costBasisUSD}`);
      totalPnl += sell.price;
      costBasisError += sell.price;
    }
  })
  console.log(`cont basis error: ${costBasisError}`)
}
export async function writeSalesSummary(sells: Sale[]) {
  try {
    if(sells === undefined || sells.length===0){
      console.log("no sells")
      return 0;

    }
    const logger = fs.createWriteStream(gainLossOnSalesSummary, { flags: 'a' })
    const loggerError = fs.createWriteStream(gainLossOnSalesErrorsFile, { flags: 'a' })
    let pnl = 0;
    let maxpnl = 0;
    let yearOffset = 0;
    let tempPnl;
    let pnls =  Array(20).fill(0);
    const firstYear = new Date(sells[0].time!).getFullYear();


    sells.forEach((sell) => { 
      tempPnl = sell.price - sell.costBasisUSD;
      pnl += tempPnl;
      maxpnl = Math.max(maxpnl, sell.price - sell.costBasisUSD);
      yearOffset = new Date(sell.time).getFullYear() - firstYear ;
      pnls[yearOffset] += tempPnl;

      if (sell.costBasisUSD > 0) {
      } else {
        //loggerError.write(`${sells} \n`)
      }
    })
    console.log(`pnl: ${pnl}, maxPnl: ${maxpnl}, numSales: ${sells.length} \n`)
    logger.write(`pnl: ${pnl}, maxPnl: ${maxpnl}, numSales: ${sells.length} \n`)
    pnls.forEach( (pnl: number, index) => {
      if(pnl> 0) {
        console.log(`year: ${firstYear + index}, pnl: ${pnl}`)
      }
    })
  } catch (err) {
    console.log(`error with writeSalesSummary: ${err}`);
  }
}

export async function Log(message: string) {
  fs.appendFileSync("output/error.log", `${message} \n`);
}


