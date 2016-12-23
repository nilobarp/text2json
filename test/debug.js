'use strict'

/**
 * This file is used as a launch program for debugging.
 * For tests, check spectrum-tests.ts
 */

let Parser = require('../dist/src/index.js').Parser
let path = require('path')

let opt = {
  hasHeader: false,
  headers: ['#', 'fname', 'lname', 'job']
}
let sub = new Parser(opt)
// let testData = `id,firstName,lastName,jobTitle
// 1,Jed,Hoppe,Customer Markets Supervisor
// 2,Cristian,Miller,Principal Division Specialist
// 3,Kenyatta,Schimmel,Product Implementation Executive`

let testData = path.join(__dirname, '../dist/test/spectrum/text/mock_data_1000000.txt')

/*sub.text2json(testData, (err, data) => {
  if (err) console.log(err)
  else
    console.log(data)
})*/
let rows = 0
sub.text2json(testData)
    .on('row', (row) => {
      rows++
    })
    .on('end', () => {
      logMemoryUsage()
      console.log(rows)
    })

function logMemoryUsage () {
  let memUsage = process.memoryUsage()
  console.log(`\n------------------------------------------\nHeap total: ${Math.round(memUsage.heapTotal/1048576)} MB\tHeap used: ${Math.round(memUsage.heapUsed/1048576)} MB`)
}
