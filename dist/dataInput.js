"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadMktData = exports.getPrice = exports.getCoinPrice = exports.getZEC = exports.getCoinPriceForUSDT = exports.getCoinPriceForEth = void 0;
const fs_1 = __importDefault(require("fs"));
function getCoinPriceForEth() {
    let data = fs_1.default.readFileSync(`data/prices/ETH_day.csv`, 'utf-8');
    let dataLines = data.split(/\r?\n/);
    let marketPrices = [];
    let values;
    dataLines.shift();
    dataLines.forEach((line) => {
        values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (Number(values[5]) > 0) {
            marketPrices.push({
                timestamp: Date.parse(values[0]),
                price: Number(values[5])
            });
        }
    });
    marketPrices.reverse();
    return marketPrices;
}
exports.getCoinPriceForEth = getCoinPriceForEth;
function getCoinPriceForUSDT() {
    let data = fs_1.default.readFileSync(`data/prices/USDT-USD-all.csv`, 'utf-8');
    let dataLines = data.split(/\r?\n/);
    let marketPrices = [];
    let values;
    dataLines.shift();
    dataLines.forEach((line) => {
        values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (Number(values[4]) > 0) {
            marketPrices.push({
                timestamp: Date.parse(values[0]),
                price: Number(values[4])
            });
        }
    });
    marketPrices.reverse();
    return marketPrices;
}
exports.getCoinPriceForUSDT = getCoinPriceForUSDT;
function getZEC() {
    let data = fs_1.default.readFileSync(`data/prices/zcash.csv`, 'utf-8');
    let dataLines = data.split(/\r?\n/);
    let marketPrices = [];
    let values;
    dataLines.shift();
    dataLines.forEach((line) => {
        values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        if (Number(values[4]) > 0) {
            marketPrices.push({
                timestamp: Date.parse(values[0]),
                price: Number(values[5])
            });
        }
    });
    return marketPrices;
}
exports.getZEC = getZEC;
function getCoinPrice(coin) {
    if (coin === "ETH") {
        return getCoinPriceForEth();
    }
    else if (coin === "USDT") {
        return getCoinPriceForUSDT();
    }
    else if (coin === "ZEC") {
        return getZEC();
    }
    let data = fs_1.default.readFileSync(`data/prices/${coin}-USD.csv`, 'utf-8');
    let dataLines = data.split(/\r?\n/);
    let marketPrices = [];
    let values;
    dataLines.shift();
    dataLines.forEach((line) => {
        values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        marketPrices.push({
            timestamp: Date.parse(values[0]),
            price: Number(values[5])
        });
    });
    return marketPrices;
}
exports.getCoinPrice = getCoinPrice;
function getPrice(sym, timeStamp, allMarketPrices) {
    let data = allMarketPrices.get(sym);
    if (data === undefined) {
        console.log(`data is undefined for ${sym}`);
        return -99;
    }
    while (data.loc < data.marketPrcs.length && data.marketPrcs[data.loc].timestamp < timeStamp) {
        data.loc++;
    }
    if (data.loc >= data.marketPrcs.length) {
        data.loc--;
    }
    return data.marketPrcs[data.loc].price;
}
exports.getPrice = getPrice;
function loadMktData(syms) {
    const allMarketPrcs = new Map();
    syms.forEach((sym) => {
        allMarketPrcs.set(sym, {
            marketPrcs: getCoinPrice(sym), loc: 0
        });
    });
    return allMarketPrcs;
}
exports.loadMktData = loadMktData;
