"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const mktDataInput_1 = require("./mktDataInput");
const tradeInput_1 = require("./tradeInput");
const compareFiles_1 = require("./compareFiles");
const TaxCalculator_1 = require("./TaxCalculator");
function logOutput(sales) {
    (0, logger_1.writeSalesSummary)(sales);
    (0, logger_1.writeSales)(sales, 2017);
}
function main2() {
    //throw("enter main2")
    //loadDataFromGemini();
    //writeDataPoloniex()
    const loadFunctions = [tradeInput_1.loadFromBitstamp, tradeInput_1.loadDataFromGemini, tradeInput_1.loadDataFromBinance, tradeInput_1.loadDataFromBitmex, tradeInput_1.loadDataPoloniex, tradeInput_1.loadAllBitfinexTrades, tradeInput_1.loadDataFromCoinbaseAll];
    //const loadFunctions = [loadDataFromBitmex, loadDataPoloniex]
    //const loadFunctions = [loadDataFromCoinbaseAll]
    let allData = [];
    let tempTrades;
    loadFunctions.forEach(func => {
        tempTrades = func();
        tempTrades === null || tempTrades === void 0 ? void 0 : tempTrades.forEach(trade => allData.push(trade));
    });
    //const coinbaseTrades =  loadDataFromCoinbaseAll()//;;loadDataFromCoinTracking("Coinbase Pro")
    //throw(coinbaseTrades.length)
    //coinbaseTrades.forEach( trade => {allData.push(trade)})
    console.log("done get all data from files");
    // const bitmexData = loadDataFromBitmex();
    const poloData = (0, tradeInput_1.loadDataPoloniex)();
    // const bitfinexData = loadAllBitfinexTrades();
    // const coinbaseData = loadDataFromCoinbaseAll();
    //const allData =  [...bitmexData, ...poloData, ...bitfinexData, ...coinbaseData ].sort((a,b) => a.time - b.time)
    //const allData = [...poloData]
    allData.sort((a, b) => a.time - b.time);
    let mktPrcs = (0, mktDataInput_1.loadMktData)(['BTC', 'ETH', 'USDT', 'LTC', 'ZEC', 'BNB', 'EUR', 'BCH', 'XRP', 'BSV']);
    // fs.writeFileSync('output/debug443.log', '')
    //console.log(getPrice('BTC', 1519067408000, mktPrcs, debugInfo));
    // console.log(JSON.stringify(debugInfo))
    //getPrice('BTC', 1519067408000, mktPrcs);
    //throw("early exit")
    //getInitialCostBasisOfBuyTrades(allData)
    const USD_FIFO = true;
    const taxCalculator = new TaxCalculator_1.TaxCalculator(USD_FIFO, mktPrcs);
    const sales = taxCalculator.performAnalysis(allData);
    logOutput(sales);
    console.log(`netUSDreceived: ${taxCalculator.netUSDreceived}`);
    console.log(`got polo data`);
    const unique = [...new Set(poloData.map((item) => item.buySymbol))];
    const unique2 = [...new Set(poloData.map((item) => item.type))];
    console.log(`unique: ${JSON.stringify(unique)}`);
    console.log(`unique: ${JSON.stringify(unique2)}`);
}
function runCompare() {
    const time_Jan_2018 = 1514764801000;
    const time_Jan_2019 = 1546300801000;
    const poloData = (0, tradeInput_1.loadDataPoloniex)();
    let last = 0;
    const cointrackingData = (0, tradeInput_1.loadDataFromCoinTracking)("Poloniex");
    cointrackingData.forEach(trade => trade.time += 1000 * 3600);
    let numfounds = 0;
    let coinTrackingSize = 0;
    let trade;
    for (let index = 100000; index < 250000; ++index) {
        trade = poloData[index];
        let isFound = false;
        let i = Math.max(last - 1000, 0);
        while (!isFound && i < cointrackingData.length && cointrackingData[i].time <= trade.time) {
            if (cointrackingData[i].time === trade.time) {
                isFound = true;
                numfounds++;
                console.log(JSON.stringify(trade));
                console.log(JSON.stringify(cointrackingData[i]));
            }
            i++;
        }
        if (!isFound) {
            throw (`not found: ${index} ${JSON.stringify(trade)}`);
        }
        last = i;
        if (i % 10000 == 0) {
            console.log(`i: ${index} numfounds: ${numfounds / index} coinTrackingSize: ${coinTrackingSize}`);
        }
    }
    console.log(`numfounds: ${numfounds / poloData.length}`);
    throw ("done");
    const allData = [...poloData];
    allData.sort((a, b) => a.time - b.time);
    let mktPrcs = (0, mktDataInput_1.loadMktData)(['BTC', 'ETH', 'USDT', 'LTC', 'ZEC']);
    // getInitialCostBasisOfBuyTrades(allData)
    // let mySales = performAnalysis(allData)
    //mySales = mySales.filter(sale => sale.time > time_Jan_2018 && sale.time < time_Jan_2019)
    const coinTrackingSales = (0, tradeInput_1.loadCointrackingSales)('data/cointracking_capital_gains_polo_only_2018.csv');
    //compareByAmt(coinTrackingSales, mySales)
}
function getCoinBaseData() {
    // getCoinBaseProData('BTC-USD')
    //  console.log(`${JSON.stringify(getHourlyCoinBaseBtc())}`)
}
// getHourlyCoinBaseEth()
// getCoinBaseData()
//getHourlyCoinBaseEth()
console.log("before main2");
//main2();
(0, compareFiles_1.compareTwo)();
//getCoinBaseData()
// console.log("done222")
// runCompare();
//loadDataFromCoinbaseAll()
//compareToFindMissing()
