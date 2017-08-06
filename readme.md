text2json
=========
[![Build Status](https://travis-ci.org/nilobarp/text2json.svg?branch=master)](https://travis-ci.org/nilobarp/text2json)
[![npm](http://img.shields.io/npm/v/text2json.svg)](https://www.npmjs.com/package/text2json)
[![Coverage Status](https://coveralls.io/repos/github/nilobarp/text2json/badge.svg?branch=master)](https://coveralls.io/github/nilobarp/text2json?branch=master)
[![Downloads](https://img.shields.io/npm/dt/text2json.svg)](https://img.shields.io/npm/dt/text2json.svg)

Performant parser for textual data
* Parse 100K rows in ~550 ms (may vary with data)
* Very low memory footprint (~10 MB)
* Supports parsing from file, string or buffers
* Supports streaming output
* Passes CSV Acid Test suite [csv-spectrum](https://github.com/maxogden/csv-spectrum)

Parsing the following bit of data

```
id,firstName,lastName,jobTitle
1,Jed,Hoppe,Customer Markets Supervisor
2,Cristian,Miller,Principal Division Specialist
3,Kenyatta,Schimmel,Product Implementation Executive
```
will produce
```
[ { id: '1',
    firstName: 'Jed',
    lastName: 'Hoppe',
    jobTitle: 'Customer Markets Supervisor' },
  { id: '2',
    firstName: 'Cristian',
    lastName: 'Miller',
    jobTitle: 'Principal Division Specialist' },
  { id: '3',
    firstName: 'Kenyatta',
    lastName: 'Schimmel',
    jobTitle: 'Product Implementation Executive' } ]
```

Usage
======

Installation
------------
`npm install text2json --save`

Quick start
------------

* Parse the entire file into JSON
```js
'use strict'

let Parser = require('text2json').Parser
let rawdata = './data/file_100.txt'

let parse = new Parser({hasHeader : true})

parse.text2json (rawdata, (err, data) => {
  if (err) {
    console.error (err)
  } else {
    console.log(data)
  }
})
```
* If parsing a large file, stream the output
```js
'use strict'

let Parser = require('text2json').Parser
let rawdata = './data/file_500000.txt'

let parse = new Parser({hasHeader : true})

parse.text2json (rawdata)
   .on('error', (err) => {
     console.error (err)
   })
   .on('headers', (headers) => {
     console.log(headers)
   })
   .on('row', (row) => {
     console.log(row)
   })
   .on('end', () => {
     console.log('Done')
   })
```

Options
---------
The parser accepts following options through its constructor (all are optional)

```
{
  hasHeader?: boolean,
  headers?: string[],
  newline?: string,
  separator?: string,
  quote?: string,
  encoding?: string,
  skipRows?: number,
  filters?: Filters,
  headersOnly?: boolean
}
```

* `hasHeader` 
  * If true, first line is treated as header row.
  * Defaults to `false`.
* `headers` 
  * An array of strings to be used as headers.
  * If specified, overrides header row in data.
  * Defaults is an empty array
* `newline` 
  * Choose between Unix and Windows line endings (`\n` or `\r\n`)
  * Defaults to `\n`
* `separator` 
  * Specify column separator
  * Defaults is `,` (comma)
* `quote` 
  * Specify quote character
  * Default is `"` (double quotes)
* `encoding` (see https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings)
  * Use a different encoding while parsing
  * Defaults to `utf-8`
* `skipRows` 
  * Number of rows to skip from top (excluding header)
  * Default is zero rows
* `filters` 
  * Filter columns based on index or header name
* `headersOnly` 
  * Parse only header row

Header fill
------------
If `hasHeader` is false and custom headers are not specified, parser will generate headers using a zero based index of the columns. i.e. when data has 5 columns, generated headers will be `['_1', '_2', '_3', '_4', '_5']`

Header fill will also occur when number of headers given in custom headers array is less than the actual numbers of columns in the data.

Events
------
  * `headers` - emitted after parsing the header row or once header fill has completed. The payload contains an array of header names.
  * `row` - emitted once for every row parsed. Payload is an object with properties corresponding to the header row.
  * `error` - emitted once for the first error encountered. Payload is an Error object with an indicative description of the problem.
  * `end` - emitted once, when the parser is done parsing. No payload is provided with this event.

Roadmap
---------
  - [x] Return columns selectively (either by column index or header name)
  - [x] Ignore header row in data and use custom header names provided in options
  - [x] Skip rows (start parsing from a given row number)
