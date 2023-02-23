import { loadDataFromCoinTracking, loadDataPoloniex, loadDataFromCoinbaseAll } from './tradeInput'
import { Trade } from './types'
import alasql from 'alasql';

import fs from 'fs'
export type Compare = {
  time: number;
  trade: string;
}

export function loadDataPoloniexCompare(): Compare[] {
  let trades: Compare[] = []
  // Date,Market,Category,Type,Price,Amount,Total,Fee,Order Number,Base Total Less Fee,Quote Total Less Fee
  let data = fs.readFileSync('data/polo_trades.csv', 'utf-8')
  // console.log("here")
  let dataLines: string[] = data.split(/\r?\n/);
  dataLines.shift();
  let values: string[] = []

  dataLines.forEach((line) => {
    values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    trades.push({
      'time': Date.parse(values[0] + ' GMT+0000'),
      'trade': line
    })
    //console.log(trades.at(-1))
    //console.log(line)
  })
  return trades.sort((a, b) => a.time - b.time);
}


export function loadDataPoloniexFromCointrackingCompare(): Compare[] {
  let trades: Compare[] = []
  let stringLine: string[] = []
  let isbuy: boolean = false;
  let sym1: string, sym2: string;
  let syms: string[] = []
  let sellAmt: number = 0;
  let buyAmt: number = 0;
  // Date,Market,Category,Type,Price,Amount,Total,Fee,Order Number,Base Total Less Fee,Quote Total Less Fee
  let data = fs.readFileSync('data/CoinTracking_Trade_Table.csv', 'utf-8')
  var errata = fs.createWriteStream('output/polo_input_errata.csv');
  let adjTime;
  let dataLines: string[] = data.split(/\r?\n/);
  dataLines.shift();
  dataLines.forEach((line) => {
    stringLine = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 
    isbuy = stringLine[3].toLocaleLowerCase() === 'buy'
    sym1 = stringLine[2].replace(/[,\"]/g, '')
    sym2 = stringLine[4].replace(/[,\"]/g, '')
  
    sellAmt = Math.abs(parseFloat(stringLine[3].replace(/[,\"]/g, '')));
    buyAmt = parseFloat(stringLine[1].replace(/[,\"]/g, ''));
    if (buyAmt < 0 || sellAmt < 0) {
      console.log(`buyAmt 0 buyAmt: ${buyAmt}, sellAmt: ${sellAmt}`)
    }

    if (buyAmt < 1e-10 || sellAmt < 1e-10) {
      errata.write(`${line}\r\n`);
      console.log(`buyAmt too small in poloniex : ${stringLine}`)
    }
    let values2 = stringLine[11].replace(/[,\"]/g, '').split(/(?<!E)-/g);
    //console.log(`${values2}`)
    //console.log(line)
    //throw("slslsl")
    let adjTime = Number(values2[0]) * 1000;
    trades.push({
      time: adjTime,
      trade: line
    });
  })
  return trades.sort((a, b) => a.time - b.time);
}


function findMissing (data0: Compare[], data1: Compare[], doStop: boolean): number[]{
  let numfounds = 0;
  let coinTrackingSize = 0;
  let trade: Compare;
  let last = 0;
  let missing: number[] = [];
  for(let index  = 0; index < data0.length; ++index){
    trade = data0[index];
    let isFound = false;
    let i = Math.max(last - 5000, 0);
    while(!isFound && i < data1.length && data1[i].time < trade.time){
      i++;
    }
    if(i< data1.length && data1[i].time===trade.time){
      isFound = true;
      numfounds++;
     // console.log(JSON.stringify(trade))
     // console.log(JSON.stringify(data1[i]))
    }
    if(!isFound){
      missing.push(index);
      if(doStop){
        throw(`not found: ${index} ${JSON.stringify(trade)}`)
      }
    }
    last = i;
        
  //  if(i%10000==0){
  //    console.log(`i: ${index} numfounds: ${numfounds/index} coinTrackingSize: ${coinTrackingSize}`)
  //  }   
  }
  return missing;
}

function adjustByHours(data0: Compare[], data1: Compare[], hrsAdj: number[]){
  let missing = [...Array(data0.length).keys()]
  let data0Remaining = data0;

  for(let i = 0;i < hrsAdj.length; ++i){
    data0Remaining = missing.map(index => data0Remaining[index] ).sort((a, b) => a.time - b.time)
    let data1Adj = data1.map((trade) => { let trade2 = ( JSON.parse(JSON.stringify(trade)));
    trade2.time + 1000 * 60 * 60 * hrsAdj[i]; return trade2} )
    missing = findMissing(data0Remaining, data1Adj, false)
    console.log(`missing ratio: ${missing.length/data0.length} after hrsAdj: ${data0.length}`)    
  }
}

function getUniqueValues(arr: number[]): number[] {
  const counts: any = {}
    for (const num of arr) {
      counts[num] = counts[num] ? counts[num] + 1 : 1;
    }
    const counts2 = []
    for( const num of arr) {
      if(counts[num] === 1){
        counts2.push(num)
      }
    }
  return counts2;
}


function binarySearch<Type>(arr: Type[], el: Type, compare_fn: ((a: Type, b: Type) => number) ) {
  let m = 0;
  let n = arr.length - 1;
  while (m <= n) {
      let k = (n + m) >> 1;
      let cmp = compare_fn(el, arr[k]);
      if (cmp > 0) {
          m = k + 1;
      } else if(cmp < 0) {
          n = k - 1;
      } else {
          return k;
      }
  }
  return ~m;
}

function getMatchingTrades(data0: Trade[], data1: Trade[], hrsAdj: number[]){
  let times = data0.map((trade) => trade.time ).sort((a, b) => a - b)
  const uniqueTime = getUniqueValues(times).sort((a, b) => a - b)
  console.log(binarySearch(uniqueTime, 1, (a, b) => a-b))
  let data0unique = data0.filter(trade => binarySearch(uniqueTime, trade.time, (a, b) => a-b)>=0)
  console.log(`${JSON.stringify(data0unique[100000])}`)

  console.log(`unique times length: ${data0unique.length}, data0 length: ${times.length}, uniqueTime: ${uniqueTime.length}`)
  for(let i = 0;i < hrsAdj.length; ++i){

    data1.forEach( trade => {
      if(trade.time ===1483731456000){
        //console.log(`${trade.time}`)
        //throw('dkdkdkdkd')
      }
    })
    let data1Adj = data1.map((trade) => { let trade2 = ( JSON.parse(JSON.stringify(trade)));
      trade2.time += 1000 * 60 * 60 * hrsAdj[i]; return trade2} )     
      
      //data1Adj.filter(trade => uniqueTime.includes(trade.time))
      let table1 = data0unique.sort( (a: Trade,b: Trade) => a.time - b.time);
      let table2 = data1Adj.sort( (a: Trade,b: Trade) => a.time - b.time);
      var sql = alasql('select table1.* from ? as table1  inner join ? as table2 on table1.time = table2.time', [table1, table2]);
      var sql2 = alasql('select table2.* from ? as table1  inner join ? as table2 on table1.time = table2.time', [table1, table2]);
      
      console.log(`sql.length: ${sql.length}`)
      console.log(`sql: ${JSON.stringify(sql[0])}, ${JSON.stringify(sql2[1])}`)
      console.log(`percent found ${sql.length/data0unique.length}`)
      let cols = ['buyName', 'sellName', 'buyAmount', 'sellAmount']
      //sql[0].buyAmount = 0.22794562;
      for(let i = 0;i< sql.length;++i){
        for(let j = 0; j< cols.length; ++j){
          if(sql[i][cols[j]] !== sql2[i][cols[j]]){
            console.log(JSON.stringify(sql[i]))
            console.log(JSON.stringify(sql2[i]))
            throw(`diff in ${cols[j]} ${sql[i][cols[j]]} ${sql2[i][cols[j]]}`);    
          }
        }
      }
      /*
      sql.forEach(((row: any[],) => {
        //console.log(JSON.stringify(row))
      
        
        if(row[1]!== row[5] || row[2]!== row[6] || Math.abs(row[3] - row[8]) > 1e-12  || Math.abs(row[4] - row[9])> 1e-12){
          if(row[3]!== row[7] || row[4]!== row[8]){
            console.log(`${row[3] - row[7] < 1e-10  }, ${row[4]!== row[8]}`)
          }
          console.log(`row: ${JSON.stringify(row)}`)
          throw("not equal")
        }
        
      })
      */
      console.log("done getMatchingTrades")
  }

}

export function compareTwo(){
  let lowerTime = new Date('2017-01-01').getTime();
  let upperTime = new Date('2018-01-01').getTime(); 
  let data0 = loadDataFromCoinbaseAll()
  let data1 = loadDataFromCoinTracking("Coinbase Pro")

  let data0Reduced = data0.filter( (trade: Trade) => trade.time > lowerTime && trade.time < upperTime)
  let data1Reduced = data1.filter( (trade: Trade) => trade.time > lowerTime && trade.time < upperTime)
  
  console.log(`data0 length: ${data0Reduced.length}, data1 length: ${data1Reduced.length}`)
}


export function compareToFindMissing(){
  const DATE_FILTER = new Date('2017-01-02').getTime()
  const data0 = loadDataPoloniex().filter(trade => trade.time > DATE_FILTER).sort((a, b) => a.time - b.time);
  const data1 = loadDataFromCoinTracking("Poloniex").sort((a: any, b: any) => a.time - b.time);
  console.log(`${data0.length} ${data1.length}`)

  getMatchingTrades(data0, data1, [1])
  return;
  
  /*
  const data0 = loadDataPoloniex().filter(trade => trade.time > DATE_FILTER).sort((a, b) => a.time - b.time);
  const data1 = loadDataPoloniexFromCointracking().sort((a, b) => a.time - b.time);
  adjustByHours(data1, data0, [0, -1, -2])
  return;
  const data1Adj: Compare[] = data1.map((trade) => ({'time': trade.time + 1000 * 60 * 60 * 1, 'trade': trade.trade} ))
  const data2Adj: Compare[] = data1.map((trade) => ({'time': trade.time + 1000 * 60 * 60 * 2, 'trade': trade.trade} ))
  // data1Adj.forEach(trade => {if (trade.time === 1483317454000) throw('found it sss')})
  //data1Adj.forEach(trade => {if (trade.time === 1483313854000) throw('found it')})
  
  let missing = findMissing(data0, data1, false)
  console.log(`missing first round: ${missing.length/data0.length}`)
  let data0Remaining = missing.map(index => data0[index] ).sort((a, b) => a.time - b.time);
  console.log(`${data0Remaining.length/data0.length}`)
  let missing2 = findMissing(data0Remaining, data1Adj, false)
  console.log(`missing second round: ${missing2.length/data0.length}`)
  let data1Remaining = missing2.map(index => data0Remaining[index] ).sort((a, b) => a.time - b.time);
  let missing3 = findMissing(data1Remaining, data2Adj, false)
  console.log(`missing third round: ${missing3.length/data0.length}`)
  return;
  let numfounds = 0;
  let coinTrackingSize = 0;
  let trade: Compare;
  let last = 0;
  
  for(let index  = 100000; index < Math.min(250000, data0.length); ++index){
    trade = data0[index];
    let isFound = false;
    let i = Math.max(last - 1000, 0);
    while(!isFound && i < data1.length && data1[i].time <= trade.time){
      if(data1[i].time===trade.time){
        isFound = true;
        numfounds++;
        console.log(JSON.stringify(trade))
        console.log(JSON.stringify(data1[i]))
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
  */
}
  