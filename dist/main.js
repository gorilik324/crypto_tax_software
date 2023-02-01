"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const dataInput_1 = require("./dataInput");
const fs_1 = __importDefault(require("fs"));
const filledUnmatchedSells = [];
let mktPrcs = new Map();
function loadDataPoloniex() {
    let trades = [];
    let stringLine = [];
    let isbuy = false;
    let sym1, sym2;
    let syms = [];
    let sellAmt = 0;
    let buyAmt = 0;
    let fee = 0;
    // Date,Market,Category,Type,Price,Amount,Total,Fee,Order Number,Base Total Less Fee,Quote Total Less Fee
    let data = fs_1.default.readFileSync('data/polo_trades.csv', 'utf-8');
    var errata = fs_1.default.createWriteStream('output/polo_input_errata.csv');
    // console.log("here")
    let dataLines = data.split(/\r?\n/);
    dataLines.shift();
    dataLines.forEach((line) => {
        stringLine = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (stringLine.length === 11) {
            // console.log(`xx: ${line}`)
            //- console.log(stringLine)
            //- console.log(stringLine.length)
            //- console.log(Date.parse(stringLine[0]))
            isbuy = stringLine[3].toLocaleLowerCase() === 'buy';
            syms = stringLine[1].split('/');
            if (syms.length === 2) {
                sym1 = isbuy ? syms[0] : syms[1];
                sym2 = isbuy ? syms[1] : syms[0];
            }
            else {
                //console.log('syms wrong');
            }
            sellAmt = Math.abs(parseFloat(stringLine[9].replace(/[,\"]/g, '')));
            buyAmt = parseFloat(stringLine[5].replace(/[,\"]/g, ''));
            fee = parseFloat(stringLine[7]) / 100;
            console.log(`fee: ${fee}, ${1 - fee} ${stringLine}`);
            if (buyAmt < 0 || sellAmt < 0) {
                console.log(`buyAmt: ${buyAmt}, sellAmt: ${sellAmt}`);
            }
            if (buyAmt < 1e-10 || sellAmt < 1e-10) {
                errata.write(`${line}\r\n`);
                console.log(`buyAmt too small in poloniex : ${stringLine}`);
                //throw('buyAmt too small in poloniex')
            }
            // console.log(`buyAmt: ${buyAmt}, sellAmt: ${sellAmt}`)
            // console.log(`fee: ${fee}, ${stringLine}`)
            trades.push({
                buyName: sym1,
                sellName: sym2,
                buySymbol: sym1,
                sellSymbol: sym2,
                buyAmount: isbuy ? (buyAmt - fee) : sellAmt,
                sellAmount: isbuy ? sellAmt : buyAmt,
                fee: fee,
                time: Date.parse(stringLine[0]),
                feeUsd: -99,
                isBuy: isbuy,
                type: stringLine[2],
                costBasisUSD: -99
            });
        }
    });
    //trades.push(trade)
    return trades.reverse();
}
function loadDataPoloniexFromCointracking() {
    let trades = [];
    let stringLine = [];
    let isbuy = false;
    let sym1, sym2;
    let syms = [];
    let sellAmt = 0;
    let buyAmt = 0;
    // Date,Market,Category,Type,Price,Amount,Total,Fee,Order Number,Base Total Less Fee,Quote Total Less Fee
    let data = fs_1.default.readFileSync('data/CoinTracking_Trade_Table.csv', 'utf-8');
    var errata = fs_1.default.createWriteStream('output/polo_input_errata.csv');
    console.log("here");
    let dataLines = data.split(/\r?\n/);
    dataLines.shift();
    dataLines.forEach((line) => {
        stringLine = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        //if (stringLine.length === 11) {
        // console.log(`xx: ${line}`)
        //- console.log(stringLine)
        //- console.log(stringLine.length)
        //- console.log(Date.parse(stringLine[0]))
        isbuy = stringLine[3].toLocaleLowerCase() === 'buy';
        // syms = stringLine[1].split('/')
        // if (syms.length === 2) {
        sym1 = stringLine[2].replace(/[,\"]/g, '');
        sym2 = stringLine[4].replace(/[,\"]/g, '');
        // } else {
        //console.log('syms wrong');
        // }
        // console.log("zzzzzz")
        sellAmt = Math.abs(parseFloat(stringLine[3].replace(/[,\"]/g, '')));
        buyAmt = parseFloat(stringLine[1].replace(/[,\"]/g, ''));
        if (buyAmt < 0 || sellAmt < 0) {
            console.log(`buyAmt: ${buyAmt}, sellAmt: ${sellAmt}`);
        }
        if (buyAmt < 1e-10 || sellAmt < 1e-10) {
            errata.write(`${line}\r\n`);
            console.log(`buyAmt too small in poloniex : ${stringLine}`);
            //throw('buyAmt too small in poloniex')
        }
        // console.log(`buyAmt: ${buyAmt}, sellAmt: ${sellAmt}`)
        trades.push({
            buyName: sym1,
            sellName: sym2,
            buySymbol: sym1,
            sellSymbol: sym2,
            buyAmount: buyAmt,
            sellAmount: sellAmt,
            fee: -99,
            time: Date.parse(stringLine[10].replace(/[,\"]/g, '')),
            feeUsd: -99,
            isBuy: isbuy,
            type: stringLine[0].replace(/[,\"]/g, '') === 'Trade' ? 'Exchange' : stringLine[0],
            costBasisUSD: -99
        });
        // console.log(`${JSON.stringify(trades[trades.length-1])}`)
        //}
    });
    //trades.push(trade)
    return trades.sort((a, b) => a.time - b.time);
}
function removeAmtFromBack(amt, coins) {
    let loc = coins.length - 1;
    if (amt > coins[loc].amount) {
        (0, logger_1.Log)('amt too large');
    }
    coins[loc].costBasis *= (1 - amt / coins[loc].amount);
    coins[loc].amount -= amt;
}
function getCostBasis(amt, coins) {
    let costBasis = 0;
    let loc = coins.length - 1;
    let ratio;
    let removeAmt = 0;
    let amtToRemove = 0;
    let initialAmount = amt;
    //console.log(`amt: ${amt}`)
    //for(let i = 0; i < coins.length; i++) {
    //  console.log(`coin:  ${coins[i].costBasis/coins[i].amount}`)
    //}
    let waspopped = 0;
    while (amt > 1e-10 && loc >= 0) {
        let amtToRemove = Math.min(amt, coins[loc].amount);
        amt -= amtToRemove;
        costBasis += coins[loc].costBasis * amtToRemove / coins[loc].amount;
        removeAmtFromBack(amtToRemove, coins);
        if (coins[loc].amount < 1e-10) {
            coins.pop();
            --loc;
            waspopped = 1;
        }
    }
    if (amt > 1e-10) {
        console.log(`didn't find cost basis for ${amt}`);
    }
    return costBasis;
}
function checkForUnmatchedSells(trade, unMatchedSells, sales) {
    if (!unMatchedSells || unMatchedSells.length == 0) {
        return { tradeAmt: trade.buyAmount, costBasisAmt: trade.costBasisUSD };
    }
    let loc = unMatchedSells.length - 1;
    let buyQuantLeft = trade.buyAmount;
    let tradeCostBasis = trade.costBasisUSD;
    while (buyQuantLeft > 1e-10 && loc >= 0) {
        if (unMatchedSells[loc].amt - buyQuantLeft > -1e-10) {
            sales[unMatchedSells[loc].locOnList].costBasisUSD += tradeCostBasis;
            unMatchedSells[loc].amt -= buyQuantLeft;
            if (unMatchedSells[loc].amt < 1e-10) {
                unMatchedSells.pop();
            }
            buyQuantLeft = 0;
        }
        else {
            let costBasisUsed = tradeCostBasis * unMatchedSells[loc].amt / buyQuantLeft;
            sales[unMatchedSells[loc].locOnList].costBasisUSD += costBasisUsed;
            unMatchedSells[loc].amt -= buyQuantLeft;
            tradeCostBasis -= costBasisUsed;
            buyQuantLeft -= unMatchedSells[loc].amt;
            unMatchedSells.pop();
            --loc;
        }
    }
    return { tradeAmt: buyQuantLeft, costBasisAmt: tradeCostBasis };
}
// Calcuate the cost basis of the buy trades on data
// and store it in the trade object
// Buying a coin with another coin, is the (amount of other coin) * (times USD value of coin)
// Buying a coin with USD, the const basis = (amount of USD spent)
// No cost basis for selling a coin for USD
function getInitialCostBasisOfBuyTrades(trades) {
    trades.forEach(trade => {
        if (trade.buySymbol === 'BTC' && trade.sellSymbol === 'USDT') {
            if (!trade.sellAmount) {
                console.log(`trade: ${JSON.stringify(trade)}`);
            }
            trade.costBasisUSD = trade.sellAmount;
        }
    });
}
function addSale(sym, time, amount, costBasisUSD, price, sales) {
    const costBasisUnfound = false;
    sales.push({ sym, time, amount, costBasisUSD, costBasisUnfound, price });
}
function addCoinToWallet(amount, costBasis, symbol, time, coinWallets) {
    if (!coinWallets.has(symbol)) {
        coinWallets.set(symbol, []);
        throw ('symbol not found');
    }
    if (amount < 1e-10) {
        console.log(`symbol: ${symbol} ${costBasis}`);
        (0, logger_1.Log)(`amount to small: ${amount}, ${costBasis}, ${symbol}, ${time}`);
        return;
    }
    coinWallets.get(symbol).push({ amount, costBasis, time: time });
}
function doTrades(trades, coinWallets, sales, unMatchedCoins) {
    var _a;
    trades.forEach(trade => {
        if (trade.sellSymbol === 'USD') {
            addCoinToWallet(trade.buyAmount, trade.sellAmount, trade.buySymbol, trade.time, coinWallets);
            let zz = coinWallets.get(trade.buySymbol);
            if (zz) {
                for (let i = 0; i < zz.length; ++i) {
                    console.log(`${trade.buySymbol} zz: ${JSON.stringify(zz[i])}`);
                }
            }
        }
        /*
        else if (trade.buySymbol === 'USDT' && (trade.sellSymbol === 'BTC' || trade.sellSymbol === 'ETH')) {
          addSale(trade.sellSymbol, trade.time, trade.sellAmount,
            getCostBasis(trade.sellAmount, coinWallets.get(trade.sellSymbol)!), trade.buyAmount, sales);
        
        }
        */
        const useList = ['BTC', 'ETH', 'USDT', 'LTC', 'ZEC'];
        if (useList.includes(trade.buySymbol) && useList.includes(trade.sellSymbol)) {
            let buyPriceUsd = (0, dataInput_1.getPrice)(trade.buySymbol, trade.time, mktPrcs);
            //console.log(`buyPriceUsd: ${buyPriceUsd} sellPriceUsd: ${sellPriceUsd}`)
            addCoinToWallet(trade.buyAmount, trade.buyAmount * buyPriceUsd, trade.buySymbol, trade.time, coinWallets);
            addSale(trade.sellSymbol, trade.time, trade.sellAmount, getCostBasis(trade.sellAmount, coinWallets.get(trade.sellSymbol)), trade.buyAmount * buyPriceUsd, sales);
        }
    });
    let sumcoin = 0;
    (_a = coinWallets.get('BTC')) === null || _a === void 0 ? void 0 : _a.forEach(coin => {
        sumcoin += coin.amount;
    });
    console.log(`sum balance: ${sumcoin}`);
}
function getCoinWallets(syms) {
    const coinWallets = new Map();
    syms.forEach(sym => {
        coinWallets.set(sym, []);
    });
    return coinWallets;
}
function setupUnmatchedCoins(syms) {
    const unMatchedCoins = new Map();
    syms.forEach(sym => {
        unMatchedCoins.set(sym, []);
    });
    return unMatchedCoins;
}
function logOutput(sales) {
    (0, logger_1.writeSalesSummary)(sales);
    // writeSales(sales)
}
function performAnalysis(data) {
    const filterSym = ["BTC", "USDT", "ETH", "USD", "LTC", "ZEC"];
    const saleRecords = [];
    const coinWallets = getCoinWallets(filterSym);
    const unMatchedCoins = setupUnmatchedCoins(filterSym);
    const reducedData = data.filter((item) => filterSym.includes(item.buySymbol) && filterSym.includes(item.sellSymbol)
        && item.time < 1514764861000 && item.time > 1483228816000 && item.type === 'Exchange');
    console.log(`reduced data length: ${reducedData.length}`);
    doTrades(reducedData, coinWallets, saleRecords, unMatchedCoins);
    console.log(`num sales: ${saleRecords.length}`);
    logOutput(saleRecords);
}
function getTestData() {
    const data = [];
    data.push({
        buySymbol: 'USDT', sellSymbol: 'USD', buyAmount: 6000, sellAmount: 6000, time: 151476486000, type: 'Exchange',
        buyName: 'USDT', sellName: 'USD', fee: .0025, feeUsd: .0025, isBuy: true, costBasisUSD: 6000
    });
    data.push({
        buySymbol: 'BTC', sellSymbol: 'USDT', buyAmount: 1, sellAmount: 6000, time: 151476486000, type: 'Exchange',
        buyName: 'BTC', sellName: 'USDT', fee: .0025, feeUsd: .0025, isBuy: true, costBasisUSD: 6000
    });
    data.push({
        buySymbol: 'USDT', sellSymbol: 'BTC', buyAmount: 6000, sellAmount: 1, time: 151476486000, type: 'Exchange',
        buyName: 'BTC', sellName: 'USDT', fee: .0025, feeUsd: .0025, isBuy: true, costBasisUSD: 6000
    });
    data.push({
        buySymbol: 'USDT', sellSymbol: 'BTC', buyAmount: 2000, sellAmount: 1, time: 151476486000, type: 'Exchange',
        buyName: 'BTC', sellName: 'USDT', fee: .0025, feeUsd: .0025, isBuy: true, costBasisUSD: 6000
    });
    return data;
}
function main() {
    mktPrcs = (0, dataInput_1.loadMktData)(['BTC', 'ETH', 'USDT', 'LTC', 'ZEC']);
    const poloData = loadDataPoloniexFromCointracking();
    getInitialCostBasisOfBuyTrades(poloData);
    performAnalysis(poloData);
    console.log(`got polo data`);
    const unique = [...new Set(poloData.map((item) => item.buySymbol))];
    const unique2 = [...new Set(poloData.map((item) => item.type))];
    console.log(`unique: ${JSON.stringify(unique)}`);
    console.log(`unique: ${JSON.stringify(unique2)}`);
}
main();
