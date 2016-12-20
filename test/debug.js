'use strict'

var Parser = require('../dist/src/index.js').Parser
var spectrumBuffer = require('../dist/test/spectrum').spectrumBuffer

let opt = {hasHeader: true, quote: '"'}
let sub = new Parser(opt)
// let testItem = spectrumBuffer('comma_in_quotes.csv', 'comma_in_quotes.json')
let testItem = spectrumBuffer('mock_data_100000.txt', 'comma_in_quotes.json')

/* sub.text2json(testItem.text, (err, actual) => {
  if (err) {
    console.log(err)
  } else {
    console.log(actual)
  }
}) */
// let lines = 0
console.time('parse time')
sub.text2json(testItem.text)
  // .on('headers', (header) => {
    // console.log(header)
  // })
  // .on('row', (row) => {
    // console.log(row)
    // lines++
  // })
  .on('end', () => {
    // console.log(lines)
    console.timeEnd('parse time')
  })
