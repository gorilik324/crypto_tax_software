import { Trade, Sale, CoinWallet, Coin, UnmatchedSell, MarketPrice, AllMarketPrices, CostBasisCoinInfo, MarketPriceWithLoc } from './types'
import { getPrice } from './mktDataInput'
import { Log, writeUnfoundCostBasis } from './logger'
import fs from "fs"


export class TaxCalculator{
    isFifo: boolean;
    costBasisErrorCoins: Map<string, number>;
    debugInfo: any
    netUSDreceived: number;
    coinDebugInfo: CostBasisCoinInfo[];
    coinWallets: Map<string, Coin[]>;
    mktPrcs: AllMarketPrices;
    realizedPnl: number;
    totalUSDUnfoundCoin: number;
    debug1: number;
  
    constructor(useFifo: boolean, mktPrcs: AllMarketPrices){
      this.isFifo = useFifo;
      this.costBasisErrorCoins = new Map<string, number>();
      this.debugInfo = {time: 0};
      this.netUSDreceived = 0;
      this.coinDebugInfo = [{time: 0, exchange: "", coinLength: 0, lastSize: 0, cost: 0}]
      this.coinWallets = new Map<string, Coin[]>();
      this.mktPrcs = mktPrcs;
      this.realizedPnl = 0;
      this.totalUSDUnfoundCoin = 0;
      this.debug1 = 0;
    }
  
  removeAmtFromBack(amt: number, coins: Coin[]) {
      let loc = coins.length - 1;
      if (amt > coins[loc].amount) {
        Log('amt too large');
      }
      coins[loc].costBasis *= (1.0 - amt / coins[loc].amount);
      coins[loc].amount -= amt;
  }
  
  removeFromFront(amt: number, coins: Coin[]) {
    let loc = 0;
    if (amt > coins[loc].amount) {
      Log('amt too large');
    }
    coins[loc].costBasis *= (1.0 - amt / coins[loc].amount);
    coins[loc].amount -= amt;
  }
  
  
    getCostBasisWithRemove(amt: number, coins: Coin[], price: number, coinName: string = ""): number {
      if(!coins || coins.length==0){
        console.log(`no coins for ${coinName} ${amt} ${price}`)
        this.totalUSDUnfoundCoin += amt * price;
       // throw("zero coin")
        return 0;
      }
      
      if(this.isFifo){
        return this.getCostBasisWithRemoveFifo(amt, coins, price, coinName)
      } else {
        return this.getCostBasisWithRemoveLifo(amt, coins, price, coinName)
      }
  
    }
  
    getCostBasisWithRemoveLifo(amt: number, coins: Coin[], price: number, coinName: string = ""): number {
     
      let costBasis: number = 0;
      let loc = coins.length - 1;
      let ratio;
      let removeAmt: number = 0;
      let amtToRemove: number = 0;
      let initialAmount = amt;
      let waspopped = 0;
      this.coinDebugInfo = []
      let avgPrcBefore, amountBefore, costBefore ;
      while (amt > 1e-10 && loc >= 0) {
        let amtToRemove = Math.min(amt, coins[loc].amount);
        amt -= amtToRemove;
        avgPrcBefore = coins[loc].costBasis / coins[loc].amount;
        amountBefore = coins[loc].amount;
        costBefore = coins[loc].costBasis;
        costBasis += coins[loc].costBasis * amtToRemove / coins[loc].amount;
        this.coinDebugInfo.push({
          time: coins[loc].time,
          exchange: coins[loc].exchange,
          lastSize: coins[loc].amount,
          coinLength: loc,
          cost: coins[loc].costBasis/coins[loc].amount
        })
        
        this.removeAmtFromBack(amtToRemove, coins);
        if (coins[loc].amount < 1e-15) {
          coins.pop();
          --loc;
          waspopped = 1;
        } else {
          let newAvgCost = coins[loc].costBasis/coins[loc].amount
          if(Math.abs(newAvgCost/avgPrcBefore - 1)> .4){
            console.log(`avgPrcBefore; ${newAvgCost} ${avgPrcBefore} `)
            console.log(`costBefore; ${costBefore} ${amountBefore} `)
            console.log(`cost after; ${coins[loc].costBasis} ${coins[loc].amount}`)
            console.log(`initial amout: ${initialAmount}`)
            throw("zzzzz")
          }
        }
      }
  
      if (amt > 1e-10) {
        console.log(`didn't find cost basis for ${amt} coin: ${coinName}, price ${price}}`)
        this.totalUSDUnfoundCoin += amt * price;
       // throw("zzz")
        this.costBasisErrorCoins.set(coinName, this.costBasisErrorCoins.get(coinName) || 0 + amt)
      }
  
      return costBasis;
    }
  
    getCostBasisWithRemoveFifo(amt: number, coins: Coin[], price: number, coinName: string = ""): number {
      if(!coins || coins.length==0){
        console.log(`didn't find cost basis for ${amt} coin: ${coinName}}`)
        this.costBasisErrorCoins.set(coinName, this.costBasisErrorCoins.get(coinName) || 0 + amt)
        return 0;
      }
      let costBasis: number = 0;
      let loc = 0;
      let removeAmt: number = 0;
      let amtToRemove: number = 0;
      let initialAmount = amt;
      let waspopped = 0;
      this.coinDebugInfo = []
      let avgPrcBefore, amountBefore, costBefore ;
      while (amt > 1e-10 && loc < coins.length) {
       // console.log(`amt: ${amt} coins[loc].amount: ${coins[loc].amount} loc: ${loc}, coins.length: ${coins.length}`)
        let amtToRemove = Math.min(amt, coins[loc].amount);
        amt -= amtToRemove;
        avgPrcBefore = coins[loc].costBasis / coins[loc].amount;
        amountBefore = coins[loc].amount;
        costBefore = coins[loc].costBasis;
        costBasis += coins[loc].costBasis * amtToRemove / coins[loc].amount;
        this.coinDebugInfo.push({
          time: coins[loc].time,
          exchange: coins[loc].exchange,
          lastSize: coins[loc].amount,
          coinLength: loc,
          cost: coins[loc].costBasis/coins[loc].amount
        })
        
        if(amtToRemove - coins[loc].amount > 1e-10){
          throw("tried to remove more than available fifo")
        }
        coins[loc].costBasis *= (1.0 - amtToRemove / coins[loc].amount);
        coins[loc].amount -= amtToRemove;
        ++loc;
      }
      
      while(coins.length > 0 && coins[0].amount < 1e-10){
        coins.shift();
      }
  
     // throw(`didn't find cost basis for ${amt} coin: ${coins.length}`)
  
      if (amt > 1e-10) {
        this.totalUSDUnfoundCoin += price * amt;
        console.log(`didn't find cost basis for ${amt} coin: ${coinName}, price : ${price}}`)
       // throw("zzz")
        this.costBasisErrorCoins.set(coinName, this.costBasisErrorCoins.get(coinName) || 0 + amt)
      }
  
      return costBasis;
    }
  
    checkForUnmatchedSells(trade: Trade, unMatchedSells: UnmatchedSell[] | undefined, sales: Sale[]): { tradeAmt: number, costBasisAmt: number } {
    if (!unMatchedSells || unMatchedSells.length == 0) {
      return { tradeAmt: trade.buyAmount, costBasisAmt: trade.costBasisUSD };
    }
  
    let loc = unMatchedSells.length - 1;
    let buyQuantLeft = trade.buyAmount
    let tradeCostBasis = trade.costBasisUSD;
    while (buyQuantLeft > 1e-10 && loc >= 0) {
      if (unMatchedSells[loc].amt - buyQuantLeft > -1e-10) {
        sales[unMatchedSells[loc].locOnList].costBasisUSD += tradeCostBasis;
        unMatchedSells[loc].amt -= buyQuantLeft;
        if (unMatchedSells[loc].amt < 1e-10) {
          unMatchedSells.pop();
        }
        buyQuantLeft = 0;
      } else {
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
  
  getInitialCostBasisOfBuyTrades(trades: Trade[]): void {
    trades.forEach(trade => {
      if (trade.buySymbol === 'BTC' && trade.sellSymbol === 'USDT') {
        if (!trade.sellAmount) {
          console.log(`trade: ${JSON.stringify(trade)}`)
        }
        trade.costBasisUSD = trade.sellAmount;
      }
    })
  }
  
    addSale(sym: string, time: number, amount: number, costBasisUSD: number, price: number,
      exchange: string, buyMktPrc: number, buyAmt: number, lineNum: number | undefined, fileName: string | undefined, sales: Sale[]) {
      const costBasisUnfound = false;
      this.realizedPnl += price - costBasisUSD;
      sales.push({ sym, time, amount, costBasisUSD, costBasisUnfound, price, buyMktPrc, buyAmt, lineNum: lineNum || -99, fileName: fileName || "", exchange })
    }

    calculatePortfolioCostBasis(){
      let portfolioCostBasis = 0;
      this.coinWallets.forEach((coins, coinName) => {
        coins.forEach(coin => {
          portfolioCostBasis += coin.costBasis;
        })
      })
      return portfolioCostBasis;
    }
  
  
    addCoinToWallet(amount: number, costBasis: number, symbol: string, time: number, exchange: string, coinWallets: Map<string, Coin[]>) {
      if (!coinWallets.has(symbol)) {
        coinWallets.set(symbol, []);
        throw (`symbol not found: ${symbol}`)
      }
  
      if (amount < 1e-10) {
        // console.log(`symbol: ${symbol} ${costBasis}`)
        Log(`amount to small: ${amount}, ${costBasis}, ${symbol}, ${time}`)
        return
      }
  
      coinWallets.get(symbol)!.push({ amount, costBasis, time, exchange });
    }
  
    doBitmexTrade(trade: Trade, sales: Sale[]) {
      let btcPrice: number = getPrice(trade.buySymbol, trade.time, this.mktPrcs, this.debugInfo);
  
      if (trade.isBuy) {
        const COST_BASIS = 0;  
        this.addCoinToWallet(trade.buyAmount, btcPrice * trade.buyAmount, 'BTC', trade.time, trade.exchange, this.coinWallets)
        this.addSale("BTC", trade.time, trade.buyAmount, COST_BASIS,
        btcPrice * trade.buyAmount, trade.exchange, btcPrice, -99,  -99,  "unknown", sales);
        /*
        this.addSale("BTC", trade.time, trade.buyAmount, COST_BASIS,
          trade.buyAmount * btcPrice, trade.exchange, btcPrice, -99, -99, "unknown" , sales);
        */
      } else {
        const PRICE = 0;
        let usdCostBasis = this.getCostBasisWithRemove(trade.sellAmount, this.coinWallets.get("BTC")!, btcPrice, "BTC bitmex");
        this.addSale("BTC", trade.time, trade.sellAmount, usdCostBasis,
          PRICE, trade.exchange, btcPrice, -99,  -99,  "unknown", sales);
      }
  
  }
  
    doTrades(trade: Trade, sales: Sale[]) {
      
      if (trade.sellSymbol === 'USD') {
        //this.netUSDreceived -= trade.sellAmount;
        const USD_PRICE = 1;
        this.getCostBasisWithRemove(trade.sellAmount, this.coinWallets.get(trade.sellSymbol)!, USD_PRICE, trade.sellSymbol);
        this.addCoinToWallet(trade.buyAmount, trade.sellAmount, trade.buySymbol, trade.time, trade.exchange, this.coinWallets)
      } else if(trade.buySymbol ==='USD'){
       // this.netUSDreceived += trade.buyAmount;
       if(trade.exchange==="coinbase" && trade.sellSymbol==="BTC"){
        this.debug1 += trade.sellAmount;
       }
       this.addCoinToWallet(trade.buyAmount, trade.buyAmount, trade.buySymbol, trade.time, trade.exchange, this.coinWallets)
         
        const sellPrc = getPrice(trade.sellSymbol, trade.time, this.mktPrcs, this.debugInfo);
        const costBasis = this.getCostBasisWithRemove(trade.sellAmount, this.coinWallets.get(trade.sellSymbol)!, sellPrc, trade.sellSymbol);
        this.addSale(trade.sellSymbol, trade.time, trade.sellAmount,
          costBasis, trade.buyAmount, 
          trade.exchange, 1, trade.buyAmount, trade.lineNum,  trade.fileName, sales);
          if(trade.exchange==="gemini"){
            console.log(JSON.stringify(trade))
  
            fs.appendFileSync("output/gemini.txt", `${JSON.stringify(trade)}\r\n ${JSON.stringify(sales.at(-1))} \r\n, costbasis: ${costBasis}`)
            fs.appendFileSync("output/gemini3.txt", `price: ${JSON.stringify(sales.at(-1)?.price)}  costbasis: ${costBasis}\r\n`)
            fs.appendFileSync("output/gemini5.txt", `time: ${trade.time} ${trade.buyAmount} sellAmt: ${trade.sellAmount} \ 
            costbasis: ${costBasis} costBasisDebug: ${JSON.stringify(this.coinDebugInfo)} \r\n `)
          }
      } else {
         
        const useList = ['BTC', 'ETH', 'USDT', 'LTC', 'ZEC', 'BNB', 'EUR', 'BSV', 'USD'];
        if (useList.includes(trade.buySymbol) && useList.includes(trade.sellSymbol)) {
          let buyPriceUsd: number = getPrice(trade.buySymbol, trade.time, this.mktPrcs, this.debugInfo);
          //console.log(`buyPriceUsd: ${buyPriceUsd} sellPriceUsd: ${sellPriceUsd}`)
          /*
          if(trade.sellAmount ===2.29714281){
            console.log(JSON.stringify(trade))
            fs.appendFileSync('output/debug22.txt', `www: ${JSON.stringify(trade.buyAmount)} ${buyPriceUsd}, ${trade.time} ${trade.buySymbol}\r\n`)
            fs.appendFileSync('output/debug22.txt', `www: ${JSON.stringify(this.debugInfo)}, ${JSON.stringify(trade)}\r\n`)
            throw('found tradeaaaa');
          }
          */
          const sellPrc = getPrice(trade.sellSymbol, trade.time, this.mktPrcs, this.debugInfo);
    
          this.addCoinToWallet(trade.buyAmount, trade.buyAmount * buyPriceUsd, trade.buySymbol, trade.time, trade.exchange, this.coinWallets)
          this.addSale(trade.sellSymbol, trade.time, trade.sellAmount, this.getCostBasisWithRemove(trade.sellAmount, this.coinWallets.get(trade.sellSymbol)!, sellPrc, trade.sellSymbol),
            trade.buyAmount * buyPriceUsd, trade.exchange, buyPriceUsd, trade.buyAmount, trade.lineNum, trade.fileName, sales);
        
        }
      }
  
    }
  
    useFee(trade: Trade, sales: Sale[]){
      const PRICE = 0;
      if(trade.sellSymbol==="USD"){
        this.netUSDreceived -= trade.sellAmount;
      }
      if(trade.exchange=="bitstamp"){
        const price: number = getPrice(trade.sellSymbol, trade.time, this.mktPrcs, this.debugInfo);
        const costBasisUSD = this.getCostBasisWithRemove(trade.sellAmount, this.coinWallets.get(trade.sellSymbol)!, price, "Fee");
       
        this.addSale(trade.sellSymbol, trade.time, trade.sellAmount, costBasisUSD,
          PRICE, trade.exchange, 1, -99,  -99,  "unknown", sales);
      } else {
      const price: number = getPrice(trade.sellSymbol, trade.time, this.mktPrcs, this.debugInfo);
      const costBasisUSD = this.getCostBasisWithRemove(trade.sellAmount, this.coinWallets.get(trade.sellSymbol)!, price, "Fee");
       
     // if(trade.sellSymbol!=="USD"){
     //   this.getCostBasisWithRemove(trade.sellAmount, this.coinWallets.get(trade.sellSymbol)!, "Fee");
     // }
      this.addSale(trade.sellSymbol, trade.time, trade.sellAmount, costBasisUSD,
        PRICE, trade.exchange, price, -99,  -99,  "unknown", sales);
      }
    }
  
  
    doAllTrades(
      trades: Trade[], 
      sales: Sale[]
      ) {
      let prevReaizedPnl = 0;
      let prevMktValue = 0;
      
      fs.writeFileSync("output/debugIndex.log", '');
      for(let i=0; i<trades.length; i++){
        if(i > 0 && trades[i-1].time > trades[i].time){
          console.log(`${JSON.stringify(trades[i])} ${JSON.stringify(trades[i-1])} ${i}`)
          throw("disordered trade")
        }
        fs.appendFileSync("output/debugIndex.log", `${i}, ${trades[i].time}\r\n`);
        if (trades[i].exchange === 'bitmex') {
          this.doBitmexTrade(trades[i], sales);
        } else if (trades[i].type==='Other Fee'){
          this.useFee(trades[i], sales); 
        } else {
          if (trades[i].type === 'Exchange')
            this.doTrades(trades[i], sales);
        }
        /*
        if(Math.abs(this.calculatePortfolioCostBasis() - this.realizedPnl) > 10){
          
          console.log(`${getPrice("BTC", trades[i].time, this.mktPrcs, this.debugInfo)}, ${prevReaizedPnl}, ${prevMktValue}`);
          console.log(`${JSON.stringify(sales.at(-1))}`);
          throw(`cost basis error: ${this.calculatePortfolioCostBasis()} ${this.realizedPnl} ${JSON.stringify(trades[i])}`)
         
        }
        */
        prevReaizedPnl = this.realizedPnl;
        prevMktValue = this.calculatePortfolioCostBasis();

      }
      
    }
  
    getCoinWallets(syms: string[]): Map<string, Coin[]> {
      const coinWallets: Map<string, Coin[]> = new Map<string, Coin[]>();
      syms.forEach(sym => {
        coinWallets.set(sym, [])
      })
      return coinWallets;
    }
  
    setupUnmatchedCoins(syms: string[]): Map<string, UnmatchedSell[]> {
      const unMatchedCoins: Map<string, UnmatchedSell[]> = new Map<string, UnmatchedSell[]>();
      syms.forEach(sym => {
        unMatchedCoins.set(sym, [])
      })
      return unMatchedCoins;
    }

    performAnalysis(data: Trade[]): Sale[] {
      
      const uppDateFilter = new Date('2019-01-01T00:00:01Z').getTime()
      const lowerDateFilter = new Date('2017-01-01 00:00:01Z').getTime()
      const filterSym = ["BTC", "USDT", "ETH", "USD", "LTC", "ZEC", "BNB", "EUR", "BCH", "XRP", "BSV"]
      const saleRecords: Sale[] = []
      
      this.coinWallets = this.getCoinWallets(filterSym)
      //console.log(`getPrice: ${ getPrice('BTC', 1518475244000, mktPrcs, debugInfo)}`)
      //throw(`getPrice: ${ getPrice('ETH', 1518475244000, mktPrcs, debugInfo)}`)
      data.forEach((trade, index) =>{if(index>0 && data[index].time < data[index-1].time) throw("disorderbefore preformAnalsysis")});
      
      const reducedData = data.filter((item: Trade) => {
        return ((filterSym.includes(item.buySymbol) && filterSym.includes(item.sellSymbol) || item.type=="Other Fee")
        && item.time < uppDateFilter && item.time > lowerDateFilter)})
  
      reducedData.sort( (a:Trade , b: Trade) => a.time - b.time)
      
      reducedData.forEach((trade, index) =>{
          if(index>0 && reducedData[index].time < reducedData[index-1].time) { 
            let message = `disorder preformAnalsysis: ${index}`
            console.log(`message: ${message}`)
            throw(message)
          }
      })
              
      console.log(`reduced data length: ${reducedData.length}`)
        
      this.doAllTrades(reducedData,saleRecords);
      let balance = 0, totalUSDBalance = 0 , realizedUSD: number, price, totalRealizedUSD = 0;
      const syms =  ['BNB', 'BTC', 'USDT', 'ETH', 'BSV', 'BCH', 'USD', 'LTC', 'ZEC', 'XRP', 'EUR']
      
      if(saleRecords && saleRecords.length){
        syms.forEach(sym => {
          balance = 0;
          realizedUSD = 0;
          price = getPrice(sym, saleRecords.at(-1)!.time , this.mktPrcs, this.debugInfo);
          this.coinWallets.get(sym)?.forEach(coin => {
            balance += coin.amount;
            realizedUSD += coin.costBasis;
          });
          console.log(`balance of ${sym}: ${balance}, price: ${price} USD value: ${price*balance} CostBasis: ${realizedUSD}`)
          totalUSDBalance += price*balance;
          totalRealizedUSD += realizedUSD;
          writeUnfoundCostBasis(this.costBasisErrorCoins, saleRecords.at(-1)!.time, this.mktPrcs);
        }) 
      }

      let sumBtcCoinbase = 0;
      saleRecords.forEach(sale => sumBtcCoinbase += sale.sym ==="BTC" && sale.exchange==="coinbase"? sale.amount: 0);
      console.log(`sumBtcCoinbase: ${sumBtcCoinbase}`)
      console.log(`total portfolio balance :${totalUSDBalance} total realized USD: ${totalRealizedUSD}`)
      console.log(` cost basis not found for  $ ${this.totalUSDUnfoundCoin}`)
      console.log(` debug1: ${this.debug1}`)
      
      return saleRecords;
    }
  
  }//