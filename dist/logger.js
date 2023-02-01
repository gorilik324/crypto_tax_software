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
exports.Log = exports.writeSalesSummary = exports.writeSales = void 0;
const fs_1 = __importDefault(require("fs"));
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
    var fields = Object.keys(json[0]);
    var replacer = function (key, value) { return value === null ? '' : value; };
    var csv = json.map(function (row) {
        return fields.map(function (fieldName) {
            return JSON.stringify(row[fieldName], replacer);
        }).join(',');
    });
    return (csv.join('\r\n'));
}
function writeSales(sells) {
    return __awaiter(this, void 0, void 0, function* () {
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
            if (sell.costBasisUSD > 0) {
                totalPnl += sell.price - sell.costBasisUSD;
            }
            else {
                console.log(`no cost basis ${sell.price - sell.costBasisUSD}`);
                totalPnl += sell.price;
                costBasisError += sell.price;
            }
        });
        console.log(`cont basis error: ${costBasisError}`);
    });
}
exports.writeSales = writeSales;
function writeSalesSummary(sells) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (sells === undefined || sells.length === 0) {
                console.log("no sells");
                return 0;
            }
            const logger = fs_1.default.createWriteStream(gainLossOnSalesSummary, { flags: 'a' });
            const loggerError = fs_1.default.createWriteStream(gainLossOnSalesErrorsFile, { flags: 'a' });
            let pnl = 0;
            let maxpnl = 0;
            let yearOffset = 0;
            let tempPnl;
            let pnls = Array(20).fill(0);
            const firstYear = new Date(sells[0].time).getFullYear();
            sells.forEach((sell) => {
                tempPnl = sell.price - sell.costBasisUSD;
                pnl += tempPnl;
                maxpnl = Math.max(maxpnl, sell.price - sell.costBasisUSD);
                yearOffset = new Date(sell.time).getFullYear() - firstYear;
                pnls[yearOffset] += tempPnl;
                if (sell.costBasisUSD > 0) {
                }
                else {
                    //loggerError.write(`${sells} \n`)
                }
            });
            console.log(`pnl: ${pnl}, maxPnl: ${maxpnl}, numSales: ${sells.length} \n`);
            logger.write(`pnl: ${pnl}, maxPnl: ${maxpnl}, numSales: ${sells.length} \n`);
            pnls.forEach((pnl, index) => {
                if (pnl > 0) {
                    console.log(`year: ${firstYear + index}, pnl: ${pnl}`);
                }
            });
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
