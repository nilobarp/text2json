'use strict'

var Parser = require('../dist/src/index.js').Parser
var spectrumBuffer = require('../dist/test/spectrum').spectrumBuffer

let opt = {hasHeader: true, quote: '"'}
let sub = new Parser(opt)
// let testItem = spectrumBuffer('comma_in_quotes.csv', 'comma_in_quotes.json')
let testItem = spectrumBuffer('mock_data_100000.txt', 'comma_in_quotes.json')

sub.csv2json(testItem.text, (err, actual) => {
  if (err) {
    console.log(err)
  } else {
    console.log(actual)
  }
})
