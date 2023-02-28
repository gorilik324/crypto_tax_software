import fs from 'fs'
import { MarketPriceWithLoc, BoughtSold } from './types'
import { Trade, Sale, CoinWallet, Coin, UnmatchedSell, MarketPrice, AllMarketPrices } from './types'
import { loadMktData, getCoinPrice, getPrice } from "./mktDataInput"


export function loadDataPoloniex(): Trade[] {
  const fileName = 'data/polo_trades.csv'
  let trades: Trade[] = []
  let stringLine: string[] = []
  let isbuy: boolean = false;
  let sym1: string, sym2: string;
  let syms: string[] = []
  let sellAmt: number = 0;
  let buyAmt: number = 0;
  let feeAmt: number = 0;
  let feePrct: number = 0;
  // Date,Market,Category,Type,Price,Amount,Total,Fee,Order Number,Base Total Less Fee,Quote Total Less Fee
  let data = fs.readFileSync(fileName, 'utf-8')
  var errata = fs.createWriteStream('output/polo_input_errata.csv');
  // console.log("here")
  let dataLines: string[] = data.split(/\r?\n/);
  dataLines.shift();
  let price;
  let feeSym: string;
  dataLines.forEach((line, index) => {
    stringLine = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (stringLine.length === 11) {
      // console.log(`xx: ${line}`)
      //- console.log(stringLine)
      //- console.log(stringLine.length)
      //- console.log(Date.parse(stringLine[0]))
      isbuy = stringLine[3].toLocaleLowerCase() === 'buy'
      syms = stringLine[1].split('/')
      if (syms.length === 2) {
        sym1 = isbuy ? syms[0] : syms[1]
        sym2 = isbuy ? syms[1] : syms[0]
      } else {
        //console.log('syms wrong');
      }

      sellAmt = Math.abs(parseFloat(stringLine[9].replace(/[,\"]/g, '')));
      
      buyAmt = parseFloat(stringLine[5].replace(/[,\"]/g, ''));
      price = parseFloat(stringLine[4].replace(/[,\"]/g, ''));
      feePrct = parseFloat(stringLine[7].replace('%',''));
      
      feeSym = isbuy ? syms[0] : syms[1]
      
      // console.log(`fee: ${fee}, ${1-fee} ${stringLine}`)
      if (buyAmt < 0 || sellAmt < 0) {
        console.log(`buyAmt: ${buyAmt}, sellAmt: ${sellAmt}`)
      }

      if (buyAmt < 1e-10 || sellAmt < 1e-10) {
        errata.write(`${line}\r\n`);
        // console.log(`buyAmt too small in poloniex : ${stringLine}`)
        //throw('buyAmt too small in poloniex')
      }
      // console.log(`buyAmt: ${buyAmt}, sellAmt: ${sellAmt}`)
      // console.log(`fee: ${fee}, ${stringLine}`)
      if(isbuy) {
        buyAmt =  sellAmt / price * (1.0 - feePrct*1.0/100);
        feeAmt =  sellAmt / price * (feePrct*1.0/100)
       // console.log(`${line}`)
        //throw(`zzzz ${buyAmt} ${price} ${sellAmt} ${fee}`)
      } else {
        feeAmt =  Math.abs(parseFloat(stringLine[10].replace(/[,\"]/g, ''))) - sellAmt;
      }

      trades.push({
        buyName: sym1,
        sellName: sym2,
        buySymbol: sym1,
        sellSymbol: sym2,
        buyAmount: isbuy ? (buyAmt)  : sellAmt,
        sellAmount: isbuy ? sellAmt : buyAmt,
        fee: feeAmt,
        time: Date.parse(stringLine[0] + ' GMT+0000') - 1000*3600*1.5,
        feeUsd: -99,
        isBuy: isbuy,
        type: stringLine[2],
        costBasisUSD: -99,
        exchange: 'poloniex',
        lineNum: index,
        fileName,
        feeSym
      });
      /*
      if(sellAmt === 2.29714281){

          throw(`sellAmount: ${sellAmt} ${JSON.stringify(trades.at(-1))} ${trades.at(-1)?.sellAmount===2.29714281}`)

      }
      */
    }
  })
  //trades.push(trade)
  return trades.reverse();
}


export function writeDataPoloniex() {
  let trades: Trade[] = []
  let stringLine: string[] = []
  let isbuy: boolean = false;
  let sym1: string, sym2: string;
  let syms: string[] = []
  let sellAmt: number = 0;
  let buyAmt: number = 0;
  let fee: number = 0;
  // Date,Market,Category,Type,Price,Amount,Total,Fee,Order Number,Base Total Less Fee,Quote Total Less Fee
  let data = fs.readFileSync('data/polo_trades.csv', 'utf-8')
  var errata = fs.createWriteStream('output/polo_input_errata.csv');
  // console.log("here")
  let dataLines: string[] = data.split(/\r?\n/);
  dataLines.shift();
  const zz = fs.createWriteStream('output/debugPolo.csv',{'flags': 'w'});
  zz.write("dkasdjfaafsdf");
  zz.end();
  let writer = fs.createWriteStream('test_gfg.txt') 
  writer.write('Hello World!')
  writer.end()
  fs.appendFileSync('output/debugPolo.csv', 'dkasdjfaafsdf', { flag: 'a' })
  //return;
  dataLines.forEach((line) => {
    stringLine = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (stringLine.length === 11) {
      // console.log(`xx: ${line}`)
      //- console.log(stringLine)
      //- console.log(stringLine.length)
      //- console.log(Date.parse(stringLine[0]))
      isbuy = stringLine[3].toLocaleLowerCase() === 'buy'
      syms = stringLine[1].split('/')
      if (syms.length === 2) {
        sym1 = isbuy ? syms[0] : syms[1]
        sym2 = isbuy ? syms[1] : syms[0]
      } else {
        //console.log('syms wrong');
      }
     
        sellAmt = Math.abs(parseFloat(stringLine[9].replace(/[,\"]/g, '')));
        buyAmt = parseFloat(stringLine[5].replace(/[,\"]/g, ''));
      
      fee = parseFloat(stringLine[7]) / 100;
      // console.log(`fee: ${fee}, ${1-fee} ${stringLine}`)
      if (buyAmt < 0 || sellAmt < 0) {
        console.log(`buyAmt: ${buyAmt}, sellAmt: ${sellAmt}`)
      }

      if (buyAmt < 1e-10 || sellAmt < 1e-10) {
        errata.write(`${line}\r\n`);
        // console.log(`buyAmt too small in poloniex : ${stringLine}`)
        //throw('buyAmt too small in poloniex')
      }
      
      fs.appendFileSync('output/debugPolo.csv',(`${JSON.stringify({
        timew: stringLine[0],
        buyName: sym1,
        sellName: sym2,
        buySymbol: sym1,
        sellSymbol: sym2,
        buyAmount: isbuy ? (buyAmt) * (1 - fee) : sellAmt,
        sellAmount: isbuy ? sellAmt : buyAmt,
        fee: fee,
        time: Date.parse(stringLine[0]),
        feeUsd: -99,
        isBuy: isbuy,
        type: stringLine[2],
        costBasisUSD: -99,
        exchange: 'poloniex'
      })}\r\n`));
    }
  })

}
export function loadDataBinanceCoinTracking(): Trade[] {
  return loadDataFromCoinTracking('Binance');
}
export function loadDataPoloniexFromCointracking(): Trade[] {
  return loadDataFromCoinTracking('Poloniex');
}

export function loadDataFromCoinTracking(exchange: string): Trade[] {
  const fileName = 'data/Cointracking_all.csv';
  let trades: Trade[] = []
  let values: string[] = []
  let isbuy: boolean = false;
  let sym1: string, sym2: string;
  let syms: string[] = []
  let sellAmt: number = 0;
  let buyAmt: number = 0;
  let exchangeField: string;
  let ordernum: number;
  enum Cols {
    Type,
    BuyAmt,
    BuySym,
    SellAmt,
    SellSym,
    Fee,
    FeeSym,
    Exchange,
    Group,
    Comment,
    Date,
    TxID,
  }
  // "Type": 0 
  // "Buy": 1
  // "Cur.": 2
  // "Sell": 3
  // "Cur.": 4
  // "Fee": 5
  // "Cur.": 6
  // "Exchange": 7
  // "Group": 8
  // "Comment": 9
  // "Date": 10
  // "Tx-ID": 11
  let data = fs.readFileSync(fileName, 'utf-8').replace(/\"/g, '');
  var errata = fs.createWriteStream('output/polo_input_errata.csv');
  console.log("here")
  let dataLines: string[] = data.split(/\r?\n/)
  dataLines.shift();
  dataLines.forEach((line, index: number) => {
    values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    //if(values[Cols.Exchange]!=="Poloniex")
    //console.log(values[Cols.Exchange])
    if(values[Cols.Exchange]===exchange && values[Cols.Type]==="Trade"){
     // console.log(values[Cols.Exchange])
    
      //if (stringLine.length === 11) {
      // console.log(`xx: ${line}`)
      //- console.log(stringLine)
      //- console.log(stringLine.length)
      //- console.log(Date.parse(stringLine[0]))
      isbuy = values[3].toLocaleLowerCase() === 'buy'
      // syms = stringLine[1].split('/')
      // if (syms.length === 2) {
      sym1 = values[2].replace(/[,\"]/g, '')
      sym2 = values[4].replace(/[,\"]/g, '')
      let fee = Number(values[Cols.Fee])
      let feeSym = values[Cols.FeeSym]
      // } else {
      //console.log('syms wrong');
      // }
      // console.log("zzzzzz")

      sellAmt = Math.abs(parseFloat(values[3].replace(/[,\"]/g, '')));
      buyAmt = parseFloat(values[1].replace(/[,\"]/g, ''));
      if (buyAmt < 0 || sellAmt < 0) {
        console.log(`buyAmt: ${buyAmt}, sellAmt: ${sellAmt}`)
      }

      if (buyAmt < 1e-10 || sellAmt < 1e-10) {
        errata.write(`${line}\r\n`);
        console.log(`buyAmt too small in poloniex : ${values}`)
        //throw('buyAmt too small in poloniex')
      }

      let values2 = values[11].replace(/[,\"]/g, '').split(/(?<!E)-/g);

      if(values[7]==='Coinbase Pro') {
        ordernum = Number(values[11].split('_')[0]);
      } 
      
      // con/sole.log(`buyAmt: ${buyAmt}, sellAmt: ${sellAmt}`)
      trades.push({
        buyName: sym1,
        sellName: sym2,
        buySymbol: sym1,
        sellSymbol: sym2,
        buyAmount: buyAmt,
        sellAmount: sellAmt,
        fee,
        time: Date.parse(`${values[Cols.Date].replace(' ','T')}Z`),
        feeUsd: -97,
        isBuy: isbuy,
        type: values[0].replace(/[,\"]/g, '') === 'Trade' ? 'Exchange' : values[0],
        costBasisUSD: -99,
        exchange: values[Cols.Exchange],
        lineNum: index,
        fileName: fileName,
        ordernum,
        feeSym
      });
      // console.log(`${line}`)
     //  console.log(`${JSON.stringify(trades.at(-1))}`)
      //}
    }
  })
  //trades.push(trade)
  return trades.sort((a, b) => a.time - b.time);
}


export function loadDataFromBitmex(): Trade[] {
  let trades: Trade[] = [];
  var files = fs.readdirSync('data').filter(fn => fn.includes('bitmex'));
  files.forEach((file) => {
    trades.push.apply(trades, loadDataFromBitmexfile(`data/${file}`));
  })
  console.log("done loadDataFromBitmex")
  return trades.sort((a, b) => a.time - b.time);
}

export function loadDataFromBitmexfile(fileName: string): Trade[] {
  let trades: Trade[] = []
  let stringLine: string[] = []
  let isbuy: boolean = false;
  let sym1: string, sym2: string;
  let syms: string[] = []
  let sellAmt: number = 0;
  let buyAmt: number = 0;

  // Date,Market,Category,Type,Price,Amount,Total,Fee,Order Number,Base Total Less Fee,Quote Total Less Fee
  let data = fs.readFileSync(fileName, 'utf-8')

  let dataLines: string[] = data.split(/\r?\n/);
  dataLines.shift();
  let amt: number, dateStr: string;
  dataLines.forEach((line: any) => {
    stringLine = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    dateStr = stringLine[11].slice(0, stringLine[11].indexOf("."));
    dateStr = `${dateStr.replace('D', 'T')}Z`
    // console.log(`datestr2: ${dateStr}`)
    // console.log(`bitmex date: ${new Date(dateStr).getTime()}`)
    if (stringLine[4] === 'RealisedPNL') {
      amt = Number(stringLine[5]) / 10 ** 8
      trades.push({
        buyName: 'BTC',
        sellName: 'BTC',
        buySymbol: 'BTC',
        sellSymbol: 'BTC',
        buyAmount: amt > 0 ? amt : 0,
        sellAmount: amt < 0 ? -amt : 0,
        fee: -99,
        time: new Date(dateStr).getTime(),
        feeUsd: -99,
        isBuy: amt > 0,
        type: stringLine[4],
        costBasisUSD: -99,
        exchange: 'bitmex'
      });


    }
  })
  console.log(`Num bitmexTrades: ${trades.length}`)
  return trades;
}


function getTestData(): Trade[] {
  const data: Trade[] = []

  data.push({
    buySymbol: 'USDT', sellSymbol: 'USD', buyAmount: 6000, sellAmount: 6000, time: 151476486000, type: 'Exchange',
    buyName: 'USDT', sellName: 'USD', fee: .0025, feeUsd: .0025, isBuy: true, costBasisUSD: 6000, exchange: 'poloniex'
  });

  data.push({
    buySymbol: 'BTC', sellSymbol: 'USDT', buyAmount: 1, sellAmount: 6000, time: 151476486000, type: 'Exchange',
    buyName: 'BTC', sellName: 'USDT', fee: .0025, feeUsd: .0025, isBuy: true, costBasisUSD: 6000, exchange: 'poloniex'
  });

  data.push({
    buySymbol: 'USDT', sellSymbol: 'BTC', buyAmount: 6000, sellAmount: 1, time: 151476486000, type: 'Exchange',
    buyName: 'BTC', sellName: 'USDT', fee: .0025, feeUsd: .0025, isBuy: true, costBasisUSD: 6000, exchange: 'poloniex'
  });

  data.push({
    buySymbol: 'USDT', sellSymbol: 'BTC', buyAmount: 2000, sellAmount: 1, time: 151476486000, type: 'Exchange',
    buyName: 'BTC', sellName: 'USDT', fee: .0025, feeUsd: .0025, isBuy: true, costBasisUSD: 6000, exchange: 'poloniex'
  });

  return data;
}

export function loadCointrackingSales(fileName: string): Sale[] {
  let sales: Sale[] = []
  let values: string[] = [], times: string[] = [];
  let isbuy: boolean = false;
  let sym1: string, sym2: string;
  let syms: string[] = []
  let sellAmt: number = 0;
  let buyAmt: number = 0;
  let ordernum = -99;

  // Date,Market,Category,Type,Price,Amount,Total,Fee,Order Number,Base Total Less Fee,Quote Total Less Fee
  let data = fs.readFileSync(fileName, 'utf-8')

  let dataLines: string[] = data.split(/\r?\n/);
  dataLines.shift();
  let amt: number, dateStr: string;

  dataLines.forEach((line: any) => {
    values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (values.length > 1) {
      sales.push({
        sym: values[1],
        time: new Date(values[3]).getTime(),
        amount: Number(values[0]),
        costBasisUSD: Number(values[8].replace(/[,\"]/g, '')),
        costBasisUnfound: false,
        price: Number(values[9].replace(/[,\"]/g, '')),
        exchange: values[5],
      });
    }
  })
  return sales;
}

export function loadAllBitfinexTrades(): Trade[] {
  let trades = loadDataFromBitfinex('data/bitfinex_oab102_trades.csv')
  trades.push.apply(trades, loadDataFromBitfinex('data/bitfinex_saidia12_trades.csv'));
  return trades.sort((a, b) => a.time - b.time);
}

export function loadDataFromBitfinex(fileName: string): Trade[] {
  const exchange = 'bitfinex'
  let trades: Trade[] = []
  let syms: string[] = []
  
  let data = fs.readFileSync(fileName, 'utf-8')

  let dataLines: string[] = data.split(/\r?\n/);
  dataLines.shift();
  let amt: number, dateStr: string;
  let values, fee, price;
  let isBuy;
  let feeSym;
  let addFeeTrans = false;
  dataLines.forEach((line: any, index: number) => {
    values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if(values.length>4){
      //console.log(`dkdkddkdk ${JSON.stringify(values)}`)
     // console.log(values.length)
     dateStr = values[7]
      dateStr = `20${dateStr.slice(6, 8)}-${dateStr.slice(3, 5)}-${dateStr.slice(0, 2)}T${dateStr.slice(9, 21)}Z`

      
      // 86860882,LTC/BTC,-1.59974493,0.008261,-0.00001322,0.10%,BTC,08-11-17 15:03:36.000,4955482088
      // console.log(`datestr2: ${dateStr}`)
      // console.log(`bitmex date: ${new Date(dateStr).getTime()}`)
      amt = Number(values[2])
      isBuy = amt > 0;
      // 86860882,LTC/BTC,-1.59974493,0.008261,-0.00001322,0.10%,BTC,08-11-17 15:03:36.000,4955482088
      // 86741807,LTC/USD,0.2,61.492,-0.0002,0.10%,LTC,08-11-17 08:06:46.000,4949322806
      syms = isBuy ? values[1].split("/") : values[1].split("/").reverse()
      fee = Math.abs(Number(values[4]));
      price = Math.abs(Number(values[3]));
      feeSym = values[6];  
      if(fee==0 || feeSym === syms[0]){
        addFeeTrans = false;
      } else{
        fee = 0;
        addFeeTrans = true;
      }
      
      trades.push({
        buyName: syms[0],
        sellName: syms[1],
        buySymbol: syms[0],
        sellSymbol: syms[1],
        buyAmount: amt > 0 ? amt - fee : -amt * price - fee,
        sellAmount: amt > 0 ? amt * price : -amt,
        fee: fee,
        time: new Date(`${dateStr}`).getTime(),
        feeUsd: -99,
        isBuy: amt > 0,
        type: "Exchange",
        costBasisUSD: -99,
        exchange: "bitfinex",
        lineNum: index,
        fileName: fileName
      })
      /*
      if(trades.at(-1)!.time===1579055783000){
        console.log(`BSV: ${line}`)
        throw(`trade added: ${JSON.stringify(trades.at(-1))}`)
      }
      */
      if(addFeeTrans){
        trades.push({
          buyName: "",
          sellName: feeSym,
          buySymbol: "",
          sellSymbol: feeSym,
          buyAmount: 0,
          sellAmount: Math.abs(Number(values[4])),
          fee: 0,
          time: new Date(`${dateStr}`).getTime(),
          feeUsd: -99,
          isBuy: false,
          type: "Other Fee",
          costBasisUSD: -99,
          exchange: "bitfinex",
          lineNum: index,
          fileName: fileName
        })
        //throw(`fee added: ${JSON.stringify(trades.at(-1))}`)
        
      }
      
      }
    })
  
  console.log(`Num ${exchange} Trades: ${trades.length}`)
  return trades;
  /*
} catch(e){
  console.log(`error: ${e}`)
  return []
}
*/
}

export function loadDataFromCoinbaseAll(): Trade[]{
  return loadDataFromCoinbase('data/coinbase_pro_fills.csv').sort((a, b) => a.time - b.time); 
}

function createTrade(
  isbuy: boolean,
  buyAmount: number, 
  sellAmount: number, 
  buySymbol: string, 
  sellSymbol: string, 
  time: number, 
  fee: number, 
  price: number,
  type: string,
  exchange: string,
  lineNum: number = -99,
  fileName: string = "",
  ordernum: number = -99)
  : Trade {
    return {
      buyName: buySymbol,
      sellName: sellSymbol,
      buySymbol,
      sellSymbol,
      buyAmount,
      sellAmount,
      fee,
      time,
      feeUsd: fee,
      isBuy:isbuy,
      type: type,
      costBasisUSD: -99,
      exchange,
      lineNum: lineNum,
      fileName: fileName,
      ordernum: ordernum
    };


}

export function loadDataFromCoinbase(fileName: string): Trade[] {
  const exchangeName = "coinbase";
  const defaultOrderType = "Exchange"
  let trades: Trade[] = []
  let syms: string[] = []
  let ordernum: number;
  let data = fs.readFileSync(fileName, 'utf-8')
  let values: string[], fee:number , price: number, myDate: number, isBuy: boolean, buyAmt: number, sellAmt: number;
/*
portfolio,trade id,product,side,created at,size,size unit,price,fee,total,price/fee/total unit
default,598831,BCH-BTC,BUY,2018-11-11T15:40:26.086Z,0.01000000,BCH,0.08336,0,-0.0008336,BTC
default,599012,BCH-BTC,BUY,2018-11-11T16:01:27.875Z,0.01000000,BCH,0.0824,0,-0.000824,BTC
default,599017,BCH-BTC,BUY,2018-11-11T16:01:43.513Z,0.01000000,BCH,0.0824,0,-0.000824,BTC
default,599018,BCH-BTC,BUY,2018-11-11T16:01:56.315Z,0.01000000,BCH,0.08234,0,-0.0008234,BTC
default,599047,BCH-BTC,SELL,2018-11-11T16:05:05.819Z,0.01000000,BCH,0.0822,0,0.000822,BTC
default,599053,BCH-BTC,BUY,2018-11-11T16:06:30.717Z,0.01000000,BCH,0.08263,0,-0.0008263,BTC
default,599054,BCH-BTC,SELL,2018-11-11T16:09:52.960Z,0.01000000,BCH,0.08268,0,0.0008268,BTC
*/
  let dataLines: string[] = data.split(/\r?\n/);
  dataLines.shift();
  dataLines.forEach((line: any, index: number) => {
    values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    
    if(values.length>4){
      if(values[0]!=="default"){
        console.log(`default value: ${values[0]}`)
        throw("no default value")
      }
      myDate = new Date(values[4]).getTime()
      isBuy = values[3].toLocaleLowerCase()==="buy"
      buyAmt = isBuy ? Number(values[5]) : Number( values[9])
      sellAmt = isBuy ? Math.abs(Number(values[9])) : Number(values[5])
      syms = isBuy ? values[2].split("-") : values[2].split("-").reverse()
      fee = Math.abs(Number(values[8]));
      price = Number(values[7]);
      ordernum = Number(values[1])
      trades.push(createTrade(isBuy, buyAmt, sellAmt, syms[0], syms[1],
        myDate, fee, price, defaultOrderType, exchangeName, index, fileName, ordernum))
    }
  })
  
  console.log(`Num coinBase: ${trades.length}`)
  trades.sort((a: Trade, b: Trade) => a.time - b.time )
  console.log(`minYear: ${new Date(trades[0].time).getFullYear()} ${new Date(trades[0].time).getMonth()} `)
  console.log(`maxYear: ${new Date(trades.at(-1)!.time).getFullYear()}`)
 // throw("fdkdkdk")

  return trades;
}

function splitNumStr(x: string): [string , string ]{
  const strAdj = x.replace(/[,\"]/g, '');
  const numPart = strAdj.match(/[\d\.]+/g)?.at(0)
  const strPart = strAdj.match(/[a-zA-Z]+/g)?.at(0)
  if(!numPart || !strPart){
    throw(`splitNumStr: ${numPart} ${strPart} ${strAdj}`) 
  } 
    return [numPart, strPart ]
}

function debugSum(trade: Trade, data: Map<string, BoughtSold>){
  if(data.has(trade.buyName)){
    data.get(trade.buyName)!.buyAmt += trade.buyAmount
  } else {
    data.set(trade.buyName, { buyAmt: trade.buyAmount, sellAmt: 0 })
  }

  if(data.has(trade.sellName)){
    data.get(trade.sellName)!.sellAmt += trade.sellAmount
  } else {
    data.set(trade.sellName, { buyAmt: 0, sellAmt: trade.sellAmount })
  }
  
}


function convertToNumber(str: string){
  let negative = str.includes('(');
 // console.log(`str before: ${str}`)
  //let str2 = str.replace(/(\s*|\)|\(|\$|[A-Z]*)/g,'')
  // let str2 = str.replace(/(\)|\(|\$)/g,'')
  let str2 = str.replace(/(\"|\,|\$|\(|\)|[A-Z]*)/g,'')
//  console.log(`str after: ${str2} ${negative}`)
  return negative ?  Number(str2) * -1 : Number(str2)
}


export function loadDataFromGemini(): Trade[] {
  const exchangeName = "gemini";
  const defaultOrderType = "Exchange"
  let trades: Trade[] = []
  let syms: string[] = []
  let amts: number[] = []
  let tempStr1: string[] = [], tempStr2: string[] = []

  let fees: any, feeUsd: number; 
  let allPrices = loadMktData(["BTC", "USDT", "ETH"])
  
  let data = fs.readFileSync("data/Gemini_transaction_and_ACH_data.csv", 'utf-8')
  let values: string[], fee:number , price: number, myDate: number, isBuy: boolean, buyAmt: number, sellAmt: number;
  let feeSym;
  let type;
  let bnbBought = 0;
/*

Date,Time (UTC),Type,Symbol,Specification,Liquidity Indicator,Trading Fee Rate (bps),USD Amount USD,Fee (USD) USD,USD Balance USD,BTC Amount BTC,Fee (BTC) BTC,BTC Balance BTC,Trade ID,Order ID,Order Date,Order Time,Client Order ID,API Session,Tx Hash,Deposit Destination,Deposit Tx Output,Withdrawal Destination,Withdrawal Tx Output
2018-02-16,19:41:00.164,Credit,BTC,Deposit (BTC),,,,,$0.00 ,0.4995 BTC ,0.0 BTC ,0.4995 BTC ,,,,,,,8cafff8ad8e61090229a3e523e1151839f9e457f3f8dfb18d5b347f66d19dfef,19N6gHDo25NWMyD4Wzv4RoRPCQmLJEVct1,7,,
2018-02-19,14:10:10.846,Sell,BTCUSD,Limit,Taker,25.00 ,$766.12 ,($1.92),$764.20 ,(0.07 BTC),,0.4295 BTC ,3082207920,3082207918,2018-02-19,14:10:10.846,,,,,,,
2018-02-19,14:10:46.965,Debit,USD,Withdrawal (ACH Transfer),,,($500.00),$0.00 ,$264.20 ,,,0.4295 BTC ,,,,,,,,,,,
2018-02-20,00:12:52.859,Buy,BTCUSD,Limit MOC,Maker,25.00 ,($11.26),($0.03),$252.92 ,0.001 BTC ,,0.4305 BTC ,3085878902,3085878524,2018-02-20,00:12:51.631,,xdmUmEUM5dhMZS0OZV4a,,,,,
2018-02-20,22:56:58.885,Sell,BTCUSD,Limit MOC,Maker,25.00 ,$568.50 ,($1.42),$820.00 ,(0.05 BTC),,0.3805 BTC ,3094445652,3094445582,2018-02-20,22:56:58.679,,xdmUmEUM5dhMZS0OZV4a,,,,,
2018-02-20,22:59:22.455,Sell,BTCUSD,Limit MOC,Maker,25.00 ,$3.24 ,($0.01),$823.23 ,(0.00028331 BTC),,0.38021669 BTC ,3094476474,3094476448,2018-02-20,22:59:22.399,,xdmUmEUM5dhMZS0OZV4a,,,,,
2018-02-21,00:15:12.616,Buy,BTCUSD,Limit MOC,Maker,25.00 ,($545.97),($1.36),$275.90 ,0.05 BTC ,,0.43021669 BTC ,3095245015,3095244966,2018-02-21,00:15:12.416,,xdmUmEUM5dhMZS0OZV4a,,,,,
2018-02-21,00:51:14.608,Sell,BTCUSD,Limit MOC,Maker,25.00 ,$528.45 ,($1.32),$803.03 ,(0.047608 BTC),,0.38260869 BTC ,3095691478,3095690800,2018-02-21,00:51:11.729,,xdmUmEUM5dhMZS0OZV4a,,,,,
2018-02-21,14:11:15.148,Sell,BTCUSD,Limit MOC,Maker,25.00 ,$558.27 ,($1.40),"$1,359.90 ",(0.052321 BTC),,0.33028769 BTC ,3101864031,3101863250,2018-02-21,14:11:10.392,,xdmUmEUM5dhMZS0OZV4a
*/
// column descrpt
// 7 - usd amt
// 2 - symbol
// 10 -bitcoin amount
/*
Date	0
Time (UTC)	1
Type	2
Symbol	3
Specification	4
Liquidity Indicator	5
Trading Fee Rate (bps)	6
USD Amount USD	7
Fee (USD) USD	8
USD Balance USD	9
BTC Amount BTC	10
Fee (BTC) BTC	11
BTC Balance BTC	12
ETH Amount ETH	13
Fee (ETH) ETH	14
ETH Balance ETH	15
Trade ID	16
Order ID	17
Order Date	18
Order Time	19
Client Order ID	20
API Session	21
Tx Hash	22
Deposit Destination	23
Deposit Tx Output	24
Withdrawal Destination	25
Withdrawal Tx Output	26
*/
enum Gemini{
  Date,
Time,
Type,
Symbol,
Specification,
Liquidity,
Trading,
USDAmount,
FeeUSD,
USDBalance,
BTCAmount,
FeeBTC,
BTCBalance,
ETHAmount,
FeeETH,
ETHBalance,
TradeID,
OrderID,
OrderDate,
OrderTime,
ClientOrder,
APISession,
TxHash,
DepositDestination,
DepositTxOutput,
WithdrawalDestination,
WithdrawalTxOutput
};

let feeSum = 0;
let bnbFeeSum = 0;
let maxBnbFeeAmt = 0;
let dataLines: string[] = data.split(/\r?\n/);
let buySellsDebug: Map<string, BoughtSold> = new Map()

  dataLines.shift();
  dataLines.forEach((line: any) => {
  values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
  
  if(values.length<=4){
    return;
  }
 
  type = values[Gemini.Type].toLocaleLowerCase()
  if(type !== "buy" && type !== "sell"){
    return
  }
  let tradePairSym = values[Gemini.Symbol];
  if(tradePairSym.length !==6){
    throw(`unknown symbol ${tradePairSym}`)
  }


  myDate = new Date(`${values[Gemini.Date]} ${values[Gemini.Time]} GMT+0000`).getTime();
    
  isBuy = type==='buy';
  const btcAmt: number = convertToNumber(values[Gemini.BTCAmount]);
  const ethAmt: number = convertToNumber(values[Gemini.ETHAmount]);
  const usdAmt: number = convertToNumber(values[Gemini.USDAmount]);

  const btcFee: number = convertToNumber(values[Gemini.FeeBTC]);
  const ethFee: number = convertToNumber(values[Gemini.FeeETH]);
  const usdFee: number = convertToNumber(values[Gemini.FeeUSD]);

  //throw("zzzz")
  
  if(tradePairSym==="BTCUSD"){
    amts = isBuy ? [btcAmt + btcFee, Math.abs(usdAmt)] :
      [usdAmt + usdFee, Math.abs(btcAmt)]
    syms = isBuy ? ["BTC", "USD"]: ["USD", "BTC"]
  } else if(tradePairSym==="ETHUSD"){
    amts = isBuy ? [ethAmt + ethFee, Math.abs(usdAmt)] :
      [usdAmt + usdFee, Math.abs(ethAmt)]
      syms = isBuy ? ["ETH", "USD"]: ["USD", "ETH"]
  } else {
    throw(`shouldn't get here symbol: ${tradePairSym}`)
  }

          //fees = splitNumStr(values[6])
  fee = 0;// Number(fees[0]);
  //feeSym = fees[1];
  [buyAmt, sellAmt] = amts;
  console.log(`${syms}`)
  
    
  price = -99;

  trades.push(createTrade(isBuy, buyAmt, sellAmt, syms[0], syms[1],
          myDate, fee, price, defaultOrderType, exchangeName))
       //   console.log(`line: ${line}`)
 // console.log(`trade: ${JSON.stringify(trades.at(-1))}`)
 // throw("dkdkdk")

  debugSum(trades.at(-1)!, buySellsDebug);

    
      
    })

    console.log(`amt fees: ${feeSum}, bnb fee sum: ${bnbFeeSum}, ${maxBnbFeeAmt}, numlines: ${dataLines.length}`)
    console.log(`bnbBought: ${bnbBought}`)
    buySellsDebug.forEach((currency, value) => console.log(`debugSum: ${JSON.stringify(currency)}: ${JSON.stringify(value)}`))
   // console.log(`bnbSold: ${JSON.stringify(buySellsDebug)}`)
    //throw('exit here')
    console.log(`Num binance: ${trades.length}`)

    return trades;
  }
  

export function loadDataFromBinance(): Trade[] {
  const exchangeName = "binance";
  const defaultOrderType = "Exchange"
  let debugInfo: any  = {}
  let trades: Trade[] = []
  let syms: string[] = []
  let amts: number[] = []
  let tempStr1: string[] = [], tempStr2: string[] = []

  let fees: any, feeUsd: number; 
  let allPrices = loadMktData(["BNB", "BTC", "USDT", "ETH"])
  
  let data = fs.readFileSync("data/binance_cash_2018.csv", 'utf-8')
  let values: string[], fee:number , price: number, myDate: number, isBuy: boolean, buyAmt: number, sellAmt: number;
  let feeSym;
  let bnbBought = 0;
/*
2018-12-31 23:26:56,BTCUSDT,BUY,"3,699.6300000000",0.0349730000BTC,129.38715999USDT,0.0143630500BNB
2018-12-31 23:26:56,BTCUSDT,BUY,"3,699.6300000000",0.0349730000BTC,129.38715999USDT,0.0143630500BNB
2018-12-31 23:26:56,BTCUSDT,BUY,"3,699.6300000000",0.0300350000BTC,111.11838705USDT,0.0123327000BNB
2018-12-31 23:26:56,BTCUSDT,BUY,"3,699.6300000000",0.0000190000BTC,0.07029297USDT,0.0000091200BNB
2018-12-31 23:00:30,BTCUSDT,SELL,"3,685.2000000000",0.0113840000BTC,41.95231680USDT,0.0047062100BNB
2018-12-31 23:00:30,BTCUSDT,SELL,"3,685.2000000000",0.0750490000BTC,276.57057480USDT,0.0310256900BNB
2018-12-31 23:00:30,BTCUSDT,SELL,"3,685.2000000000",0.0135670000BTC,49.99710840USDT,0.0056086700BNB
2018-12-31 22:53:49,BTCUSDT,BUY,"3,681.2800000000",0.1000000000BTC,368.12800000USDT,0.0459108600BNB
2018-12-31 22:28:37,BTCUSDT,SELL,"3,670.3900000000",0.1000000000BTC,367.03900000USDT,0.0413324700BNB
*/
let feeSum = 0;
let bnbFeeSum = 0;
let maxBnbFeeAmt = 0;
let dataLines: string[] = data.split(/\r?\n/);
let buySellsDebug: Map<string, BoughtSold> = new Map()

  dataLines.shift();
  dataLines.forEach((line: any) => {
    values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
  
    if(values.length>4){
      myDate = new Date(values[0]).getTime();
      isBuy = values[2].toLocaleLowerCase()==="buy";
    //  console.log(`ttt: ${values}`)
      //if(values[1]==="BTCUSDT"){

      //  throw(`binance not BTCUSDT: ${values[1]}, ${values[1].slice(0, 3)}`)
      // }
      tempStr1 = splitNumStr(values[4])
      tempStr2 = splitNumStr(values[5])
      amts = [Number(tempStr1[0]), Number(tempStr2[0])]
      syms = [tempStr1[1], tempStr2[1]]
        
      fees = splitNumStr(values[6])
      fee = Number(fees[0]);
      feeSym = fees[1];
      [buyAmt, sellAmt] = isBuy ? amts : amts.reverse();
      syms = isBuy ? syms : syms.reverse();
      feeUsd = Number(fees)*getPrice(feeSym, myDate, allPrices, debugInfo);
      let prcSellCurr = sellAmt*getPrice(syms[1], myDate, allPrices, debugInfo)
      let feeSynPrice = getPrice(feeSym, myDate, allPrices, debugInfo);
      // sellAmt += feeUsd/prcSellCurr

      price = Number(values[3].replace(',', ''));

      trades.push(createTrade(isBuy, buyAmt, sellAmt, syms[0], syms[1],
          myDate, fee, price, defaultOrderType, exchangeName))

      debugSum(trades.at(-1)!, buySellsDebug);

      if(feeSym.length<2){
        throw(`fee in another amount: ${feeSym}`)

      }
      if(true /*feeSym==="BNB"*/){
        if(feeSym==="BNB"){
          bnbFeeSum += fee;
          maxBnbFeeAmt = Math.max(maxBnbFeeAmt, fee)
        }
        trades.push(createTrade(false, 0, fee, "USD", feeSym,
          myDate, 0, feeSynPrice, defaultOrderType, exchangeName))
          //console.log(`zzz ${JSON.stringify(trades.at(-1))}`)
          feeSum += Number(fees[0])*feeSynPrice;
      } else {
        throw(`fee in another amount: ${feeSym}`)
      }

      if(syms[0]==="BNB" && syms[1]==="USDT"){
       // console.log(line)
        //console.log(`zzz ${JSON.stringify(trades.at(-2))}`)
      }

      if(syms[0]==="BNB" && syms[1]==="USDT"){
       // console.log(`zzz ${JSON.stringify(trades.at(-1))}`)
      }
     // console.log(`${line} \n binance: ${JSON.stringify(trades.at(-1))}`)
      }
    })
    console.log(`amt fees: ${feeSum}, bnb fee sum: ${bnbFeeSum}, ${maxBnbFeeAmt}, numlines: ${dataLines.length}`)
    console.log(`bnbBought: ${bnbBought}`)
    buySellsDebug.forEach((currency, value) => console.log(`debugSum: ${JSON.stringify(currency)}: ${JSON.stringify(value)}`))
   // console.log(`bnbSold: ${JSON.stringify(buySellsDebug)}`)
    //throw('exit here')
    console.log(`Num binance: ${trades.length}`)

    return trades;
  }
  




export function loadFromBinanceCash(fileName: string): Trade[] {
  const exchangeName = "binance";
  const defaultOrderType = "Exchange"
  let trades: Trade[] = []
  let syms: string[] = []
  let data = fs.readFileSync(fileName, 'utf-8')
  let values: string[], fee:number , price: number, myDate: number, isBuy: boolean, buyAmt: number, sellAmt: number;
/*
portfolio,trade id,product,side,created at,size,size unit,price,fee,total,price/fee/total unit
default,598831,BCH-BTC,BUY,2018-11-11T15:40:26.086Z,0.01000000,BCH,0.08336,0,-0.0008336,BTC
default,599012,BCH-BTC,BUY,2018-11-11T16:01:27.875Z,0.01000000,BCH,0.0824,0,-0.000824,BTC
default,599017,BCH-BTC,BUY,2018-11-11T16:01:43.513Z,0.01000000,BCH,0.0824,0,-0.000824,BTC
default,599018,BCH-BTC,BUY,2018-11-11T16:01:56.315Z,0.01000000,BCH,0.08234,0,-0.0008234,BTC
default,599047,BCH-BTC,SELL,2018-11-11T16:05:05.819Z,0.01000000,BCH,0.0822,0,0.000822,BTC
default,599053,BCH-BTC,BUY,2018-11-11T16:06:30.717Z,0.01000000,BCH,0.08263,0,-0.0008263,BTC
default,599054,BCH-BTC,SELL,2018-11-11T16:09:52.960Z,0.01000000,BCH,0.08268,0,0.0008268,BTC
*/
  let dataLines: string[] = data.split(/\r?\n/);
  dataLines.shift();
  dataLines.forEach((line: any) => {
    values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    
    if(values.length>4){
      if(values[0]!=="default"){
        console.log(`default value: ${values[0]}`)
        throw("no default value")
      }
      myDate = new Date(values[4]).getTime()
      isBuy = values[3].toLocaleLowerCase()==="buy"
      buyAmt = isBuy ? Number(values[5]) : Number( values[9])
      sellAmt = isBuy ? Math.abs(Number(values[9])) : Number(values[5])
      syms = isBuy ? values[2].split("-") : values[2].split("-").reverse()
      fee = Math.abs(Number(values[8]));
      price = Number(values[7]);
      trades.push(createTrade(isBuy, buyAmt, sellAmt, syms[0], syms[1],
        myDate, fee, price, defaultOrderType, exchangeName))
    }
  })
  
  console.log(`Num binanceCash: ${trades.length}`)
  return trades;
}




export function loadFromBitstamp(): Trade[] {
  const exchangeName = "bitstamp";
  const defaultOrderType = "Exchange"
  let trades: Trade[] = []
  let syms: string[] = []
  let data = fs.readFileSync('data/BitstampTransactions.csv', 'utf-8')
  let values: string[], fee:number , price: number, myDate: number, isBuy: boolean, buyAmt: number, sellAmt: number;
/*
Type,Datetime,Account,Amount,Value,Rate,Fee,Sub Type
Market,"Sep. 30, 2016, 02:32 AM",Main Account,0.01579248 BTC,9.55 USD,605.00 USD,0.03000 USD,Sell
Market,"Sep. 30, 2016, 10:40 AM",Main Account,7.75 EUR,8.60 USD,1.10992 USD,0.02000 USD,Buy
Market,"Sep. 30, 2016, 10:43 AM",Main Account,0.75 EUR,0.83 USD,1.10992 USD,0.01000 USD,Buy
*/
enum Cols {
  Type,
  time,
  Account,
  Quant0,
  Quant1,
  Price,
  Fee,
  IsBuy
}

  let dataLines: string[] = data.split(/\r?\n/);
  dataLines.shift();
  dataLines.forEach((line: any, index: number) => {
    values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if(values.length>4){    
      myDate = Date.parse(`${values[Cols.time].replace('\"','')} GMT0000`)
      isBuy = values[Cols.IsBuy].toLocaleLowerCase()==="buy"
      let quants0 = values[Cols.Quant0].split(" ");
      let quants1 = values[Cols.Quant1].split(" ");
      let fees = values[Cols.Fee].split(" ");

      buyAmt = isBuy ? Number(quants0[0]): Number(quants1[0])
      sellAmt = isBuy ? Number(quants1[0]) : Number(quants0[0])
      syms = isBuy ? [quants0[1], quants1[1]] : [quants1[1], quants0[1]]
      fee = Number(fees[0])
      price = Number(values[Cols.Price].split(" ")[0])
      trades.push(createTrade(isBuy, buyAmt, sellAmt, syms[0], syms[1],
        myDate, fee, price, defaultOrderType, exchangeName))
      trades.push(createTrade(isBuy, 0, fee, "", fees[1],
          myDate, fee, price, "Other Fee", exchangeName))
    }
  })
  
  console.log(`Num ${exchangeName}: ${trades.length}`)
  return trades;
}

