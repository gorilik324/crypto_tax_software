"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = exports.writeSalesSummary = exports.writeUnfoundCostBasis = exports.writeSales = void 0;
const fs_1 = __importDefault(require("fs"));
const mktDataInput_1 = require("./mktDataInput");
const unMatchedFilledFile = 'output/unmatchedFilledTxt.log';
const unMatchedFilledErrorFile = 'output/unmatchedFilledTxtError.log';
const gainLossOnSalesFile = 'output/gainLosses.log';
const gainLossOnSalesErrorsFile = 'output/gainLosses.log';
const gainLossOnSalesSummary = 'output/gainLossesSummary.log';
function writefilledUnmatchedSells(sells, trades) {
    var logger = fs_1.default.createWriteStream(unMatchedFilledFile, {
        flags: 'w'
    });
    var loggerErrors = fs_1.default.createWriteStream(unMatchedFilledErrorFile, {
        flags: 'w'
    });
    sells.forEach((sell) => {
        if (sell.locOnList < 0 || sell.locOnList > trades.length - 1) {
            loggerErrors.write(`${sell.amt},${sell.locOnList}, ${trades.length} \n`);
        }
        else {
            logger.write(`${JSON.stringify(sell)}, ${JSON.stringify(trades[sell.locOnList])} \n`);
        }
    });
    logger.end();
    loggerErrors.end();
}
function JsonToCsv(json) {
    if (!json || json.length === 0) {
        throw ("no data to write");
    }
    var fields = Object.keys(json[0]);
    var replacer = function (key, value) { return value === null ? '' : value; };
    var csv = json.map(function (row) {
        return fields.map(function (fieldName) {
            return JSON.stringify(row[fieldName], replacer);
        }).join(',');
    });
    csv.unshift(fields.join(','));
    return (csv.join('\r\n'));
}
function writeSales(sells, year = 0) {
    return __awaiter(this, void 0, void 0, function* () {
        sells.forEach(sell => {
            sell.date = `${sell.time.toLocaleString()}`;
        });
        if (year > 0) {
            const startTime = new Date(`${year}-01-01`).getTime();
            const endTime = new Date(`${year + 1}-01-01`).getTime();
            sells.filter(sell => startTime > sell.time && sell.time < endTime);
        }
        fs_1.default.writeFile(gainLossOnSalesFile, JsonToCsv(sells), function (err) {
            if (err) {
                console.log(`error with writeSales: ${err}`);
            }
            else {
                console.log('Sales successfully written to file');
            }
        });
        let totalPnl = 0;
        let costBasisError = 0;
        sells.forEach((sell) => {
            if (sell.costBasisUSD > 0 || sell.exchange === 'bitmex') {
                totalPnl += sell.price - sell.costBasisUSD;
            }
            else {
                // console.log(`no cost basis ${sell.price - sell.costBasisUSD}`);
                totalPnl += sell.price;
                costBasisError += sell.price;
            }
        });
        console.log(`cost basis error: ${costBasisError}`);
    });
}
exports.writeSales = writeSales;
function writeUnfoundCostBasis(unfounds, time, mktPrcs) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Unfound Cost Basis START\n");
        unfounds.forEach((value, key) => {
            const mktPrc = (0, mktDataInput_1.getPrice)(key, time, mktPrcs, { time: 0 });
            console.log(`${key} ${value} ${mktPrc * value}`);
        });
        console.log("Unfound Cost Basis END\n");
    });
}
exports.writeUnfoundCostBasis = writeUnfoundCostBasis;
function numberWithCommas(x) {
    const commaNumber = x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (x < 0) {
        return `\u001b[31m$ ${commaNumber}\u001b[0m`;
    }
    else if (x > 0) {
        return `\u001b[32m$ ${commaNumber}\u001b[0m`;
    }
}
function writeSalesSummary(sells) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (sells === undefined || sells.length === 0) {
                console.log("no sells");
                return 0;
            }
            const exchs = new Map();
            const currencies = new Map();
            const logger = fs_1.default.createWriteStream(gainLossOnSalesSummary, { flags: 'a' });
            const loggerError = fs_1.default.createWriteStream(gainLossOnSalesErrorsFile, { flags: 'a' });
            let pnl = 0;
            let maxpnl = 0;
            let maxCostBasis = 0;
            let maxPrice = 0;
            let maxQaunt = 0;
            let maxSale = {};
            let yearOffset = 0;
            let tempPnl;
            let pnls = Array(20).fill(0);
            const firstYear = new Date(sells[0].time).getFullYear();
            let amountUSDSold = 0;
            let maxAmountSold = 0;
            let tradeAtMaxAmtSold = {};
            sells.forEach((sell) => {
                if (sell.sym == "USD") {
                    return;
                }
                tempPnl = sell.price - sell.costBasisUSD;
                amountUSDSold += sell.price;
                pnl += tempPnl;
                if (tempPnl > maxpnl && sell.exchange !== "bitmex") {
                    maxpnl = tempPnl;
                    maxPrice = sell.price;
                    maxQaunt = sell.amount;
                    maxCostBasis = sell.costBasisUSD;
                    maxSale = sell;
                }
                if (maxAmountSold > sell.price) {
                    tradeAtMaxAmtSold = sell;
                    maxAmountSold = sell.price;
                }
                // maxpnl = Math.max(maxpnl, sell.price - sell.costBasisUSD);
                yearOffset = new Date(sell.time).getFullYear() - firstYear;
                pnls[yearOffset] += tempPnl;
                if (exchs.has(sell.exchange)) {
                    exchs.set(sell.exchange, exchs.get(sell.exchange) + tempPnl);
                }
                else {
                    exchs.set(sell.exchange, tempPnl);
                }
                if (currencies.has(sell.sym)) {
                    currencies.set(sell.sym, currencies.get(sell.sym) + tempPnl);
                }
                else {
                    currencies.set(sell.sym, tempPnl);
                }
            });
            console.log(`pnl: ${pnl}, maxPnl: ${maxpnl}, numSales: ${sells.length}, maxPrice: ${maxPrice}, maxCostBasis: ${maxCostBasis}, maxQaunt: ${maxQaunt} ${JSON.stringify(maxSale)} \n`);
            logger.write(`pnl: ${pnl}, maxPnl: ${maxpnl}, numSales: ${sells.length} \n`);
            pnls.forEach((pnl, index) => {
                if (pnl !== 0) {
                    console.log(`year: ${firstYear + index}, pnl: ${Math.floor(pnl)}`);
                }
            });
            exchs.forEach((value, key) => {
                console.log(`exchange: ${key}, pnl: ${numberWithCommas(Math.floor(value))}`);
            });
            console.log("PNL BY SYMBOL");
            currencies.forEach((value, key) => {
                console.log(`exchange: ${key}, pnl: ${numberWithCommas(Math.floor(value))}`);
            });
            console.log(`Amount USD sold: ${numberWithCommas(Math.floor(amountUSDSold))}`);
            console.log(`Max Amount USD sold: ${JSON.stringify(tradeAtMaxAmtSold)}, ${maxAmountSold}`);
        }
        catch (err) {
            console.log(`error with writeSalesSummary: ${err}`);
        }
    });
}
exports.writeSalesSummary = writeSalesSummary;
function Log(message) {
    return __awaiter(this, void 0, void 0, function* () {
        fs_1.default.appendFileSync("output/error.log", `${message} \n`);
    });
}
exports.Log = Log;
