'use strict'

var Parser = require('../dist/src/index.js').Parser

let opt = {hasHeader: false, headers: ['#', 'fname', 'lname', 'job']}
let sub = new Parser(opt)
let testData = `id,firstName,lastName,jobTitle
1,Jed,Hoppe,Customer Markets Supervisor
2,Cristian,Miller,Principal Division Specialist
3,Kenyatta,Schimmel,Product Implementation Executive`

sub.text2json(testData, (err, data) => {
  if (err) console.log(err)
  else
    console.log(data)
})
