import fs from 'fs'
import { Sale } from '../types'

function binarySearchIterative(a: number[], value: number) {
    var lo = 0, hi = a.length - 1, mid;
    while (lo <= hi) {
        mid = Math.floor((lo + hi) / 2);
        if (a[mid] > value)
            hi = mid - 1;
        else if (a[mid] < value)
            lo = mid + 1;
        else
            return mid;
    }
    return null;
}

function sales2Times(sales: Sale[]) {
    return sales.map(sale => sale.time);
}

export function compareByTime(sales1: Sale[], sales2: Sale[], outputFiles: string = "output/diffResults.txt"): void {
    sales1.sort((a: any, b: any) => a.time - b.time)
    sales2.sort((a: any, b: any) => a.time - b.time)
    const times1 = sales2Times(sales1);
    const times2 = sales2Times(sales2);
    const unfoundSales: Sale[] = [];
    times1.forEach((time, index) => {
        if (binarySearchIterative(times2, time) === null) {
            unfoundSales.push(sales2[index]);
        }
    })
    fs.writeFileSync('outputFiles/unfoundSales.txt', JSON.stringify(unfoundSales, null, 2), 'utf-8');
}

function advanceLoc(loc: number, time: number, times: number[]) {
    let offset = 3600 * 1000;
    while (loc < times.length && time - times[loc] > offset) {
        ++loc;
    }
    return loc;
}

export function compareByAmt(sales1: Sale[], sales2: Sale[], outputFiles: string = "output/diffResults.txt"): void {
    const ONE_DAY = 3600 * 24 * 1000;
    sales1.sort((a: any, b: any) => a.time - b.time)
    sales2.sort((a: any, b: any) => a.time - b.time)
    const times2 = sales2Times(sales2);
    const unfoundSales: Sale[] = [];
    let loc = 0;
    let loc2;
    let len = sales2.length;
    let outSales1: Sale[] = [], outSales2: Sale[] = [];
    let isFound = false;
    sales1.forEach((sale, index) => {
        if (sale.amount > .0001) {
            loc = advanceLoc(loc, sale.time, times2);
            loc2 = loc;
            isFound = false;
            while (!isFound && sales2[loc2].time - sale.time < ONE_DAY) {
                if (Math.abs((sale.amount - sales2[loc2].amount) / sale.amount) < .0001) {
                    outSales1.push(sale);
                    outSales2.push(sales2[loc2])
                    isFound = true;
                }
                ++loc2;
            }
        }
    })
    const logger = fs.createWriteStream('output/foundSales.txt', { flags: 'w' })
    outSales1.forEach((sale1, index) => {
        logger.write(`${JSON.stringify(sale1)}, ${JSON.stringify(outSales2[index])}\r\n`)
    })
    //  fs.writeFileSync('output/unfoundSales.txt', JSON.stringify(unfoundSales, null, 2), 'utf-8');
}







