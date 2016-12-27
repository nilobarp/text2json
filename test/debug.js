'use strict'

/**
 * This file is used as a launch program for debugging.
 * For tests, check spectrum-tests.ts
 */

let Parser = require('../dist/src/index.js').Parser
let path = require('path')

let opt = {
  hasHeader: true,
  // headers: ['#', 'fname', 'lname', 'job'],
  // skipRows: 99999,
  // filters: {columns: [1, 2]},
  headersOnly: true
}
let sub = new Parser(opt)
let testData = `id,firstName,lastName,jobTitle
1,Jed,Hoppe,Customer Markets Supervisor
2,Cristian,Miller,Principal Division Specialist
3,Kenyatta,Schimmel,Product Implementation Executive`

// let testData = path.join(__dirname, '../dist/test/spectrum/text/mock_data_100000.txt')

console.time('1')

/* sub.text2json(testData, (err, data) => {
  if (err) console.log(err)
  else
    console.log(data)
}) */
let rows = 0
sub.text2json(testData)
    .on('headers', (h) => {
      console.log(h)
    })
    .on('row', (row) => {
      // console.log(row)
      // rows++
    })
    .on('end', () => {
      logMemoryUsage()
      // console.log(rows)
      console.timeEnd('1')
    })
    .on('error', (err) => {
      console.log(err)
    })

function logMemoryUsage () {
  let memUsage = process.memoryUsage()
  console.log(`\n------------------------------------------\nHeap total: ${Math.round(memUsage.heapTotal / 1048576)} MB\tHeap used: ${Math.round(memUsage.heapUsed / 1048576)} MB`)
}
