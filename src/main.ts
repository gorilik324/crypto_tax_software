import fs from 'fs'
import { Trade, Sale, CoinWallet, Coin, UnmatchedSell, MarketPrice, AllMarketPrices, CostBasisCoinInfo } from './types'
import { writeSalesSummary, writeSales, Log, writeUnfoundCostBasis } from './logger'
import { getPrice, loadMktData, getCoinBaseProData, getHourlyCoinBaseBtc, getHourlyCoinBaseEth } from './mktDataInput'
import { loadDataPoloniex, loadDataFromCoinTracking, loadDataBinanceCoinTracking, 
  loadDataFromBitmex, loadCointrackingSales, loadAllBitfinexTrades,loadDataFromCoinbaseAll, 
  loadDataFromBinance, loadDataFromGemini, writeDataPoloniex, loadFromBitstamp} from './tradeInput'
import { compareByTime, compareByAmt } from './validation/compareTwo'
import { compareToFindMissing, compareTwo } from './compareFiles'
import { TaxCalculator } from './TaxCalculator'


 

function logOutput(sales: Sale[]) {
  writeSalesSummary(sales)
  writeSales(sales, 2017)
}
function main2() {
  //throw("enter main2")
  //loadDataFromGemini();
  //writeDataPoloniex()
  
 console.log(Date.parse("Sep. 30, 2016, 02:32 AM"))
 
  const loadFunctions = [loadFromBitstamp, loadDataFromGemini, loadDataFromBinance,loadDataFromBitmex, loadDataPoloniex, loadAllBitfinexTrades, loadDataFromCoinbaseAll]
  //const loadFunctions = [loadDataFromBitmex, loadDataPoloniex]
  //const loadFunctions = [loadDataFromCoinbaseAll]

  let allData: Trade[] = []
  let tempTrades;
  loadFunctions.forEach( func => {
    tempTrades =  func();
    tempTrades?.forEach( trade => allData.push(trade))
  })

  const coinbaseTrades = loadDataFromCoinbaseAll()// loadDataFromCoinTracking("Coinbase Pro")
  //throw(coinbaseTrades.length)
  coinbaseTrades.forEach( trade => allData.push(trade))
  console.log("done get all data from files")
  
 // const bitmexData = loadDataFromBitmex();
 const poloData = loadDataPoloniex();
 // const bitfinexData = loadAllBitfinexTrades();
 // const coinbaseData = loadDataFromCoinbaseAll();
  //const allData =  [...bitmexData, ...poloData, ...bitfinexData, ...coinbaseData ].sort((a,b) => a.time - b.time)

  //const allData = [...poloData]
  allData.sort((a, b)   => a.time - b.time)
 
  let mktPrcs: any = loadMktData(['BTC', 'ETH', 'USDT', 'LTC', 'ZEC', 'BNB', 'EUR', 'BCH', 'XRP', 'BSV']);
 // fs.writeFileSync('output/debug443.log', '')
  //console.log(getPrice('BTC', 1519067408000, mktPrcs, debugInfo));
 // console.log(JSON.stringify(debugInfo))
  //getPrice('BTC', 1519067408000, mktPrcs);
  //throw("early exit")
  //getInitialCostBasisOfBuyTrades(allData)
  const USD_FIFO = false;
  const taxCalculator = new TaxCalculator(USD_FIFO, mktPrcs);
  const sales = taxCalculator.performAnalysis(allData)

  logOutput(sales)
  console.log(`netUSDreceived: ${taxCalculator.netUSDreceived}`)
  console.log(`got polo data`)

  const unique = [...new Set(poloData.map((item: any) => item.buySymbol))];
  const unique2 = [...new Set(poloData.map((item: any) => item.type))];
  console.log(`unique: ${JSON.stringify(unique)}`)
  console.log(`unique: ${JSON.stringify(unique2)}`)
}

function runCompare() {
  const time_Jan_2018 = 1514764801000;
  const time_Jan_2019 = 1546300801000;
  const poloData = loadDataPoloniex();
  let last = 0;
  const cointrackingData = loadDataFromCoinTracking("Poloniex");
  cointrackingData.forEach(trade => trade.time += 1000*3600)

    let numfounds = 0;
    let coinTrackingSize = 0;
    let trade: Trade;

    for(let index  = 100000; index < 250000; ++index){
      trade = poloData[index];
      let isFound = false;
      let i = Math.max(last - 1000, 0);
      while(!isFound && i < cointrackingData.length && cointrackingData[i].time <= trade.time){
        if(cointrackingData[i].time===trade.time){
          isFound = true;
          numfounds++;
          console.log(JSON.stringify(trade))
          console.log(JSON.stringify(cointrackingData[i]))
        }
        i++;
      }
      if(!isFound){
        throw(`not found: ${index} ${JSON.stringify(trade)}`)
      }
      last = i;
          
      if(i%10000==0){
        console.log(`i: ${index} numfounds: ${numfounds/index} coinTrackingSize: ${coinTrackingSize}`)
      }   
    }
    
  console.log(`numfounds: ${numfounds/poloData.length}`)
  throw("done")

  const allData = [...poloData]
  allData.sort((a, b) => a.time - b.time)
  let mktPrcs = loadMktData(['BTC', 'ETH', 'USDT', 'LTC', 'ZEC']);
 // getInitialCostBasisOfBuyTrades(allData)
 // let mySales = performAnalysis(allData)
  //mySales = mySales.filter(sale => sale.time > time_Jan_2018 && sale.time < time_Jan_2019)

  const coinTrackingSales = loadCointrackingSales('data/cointracking_capital_gains_polo_only_2018.csv');
  //compareByAmt(coinTrackingSales, mySales)
}



function getCoinBaseData(){
 // getCoinBaseProData('BTC-USD')
//  console.log(`${JSON.stringify(getHourlyCoinBaseBtc())}`)
}
// getHourlyCoinBaseEth()
// getCoinBaseData()
//getHourlyCoinBaseEth()
console.log("before main2") 
main2();
//compareTwo()
//getCoinBaseData()
 console.log("done222")
// runCompare();
//loadDataFromCoinbaseAll()
//compareToFindMissing()