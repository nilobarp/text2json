import {ParserOptions, Parser} from '../src/index.js'
import { spectrumBuffer, spectrumFile } from './spectrum'
import 'mocha'
import * as fs from 'fs'
import * as path from 'path'
import * as assert from 'assert'
import * as _ from 'underscore'

describe('CSV spectrum tests', () => {

  describe('passes', ()=> {
    it('comma_in_quotes', (done) => {
      let opt : ParserOptions = {hasHeader: true, quote: '"'}
      let sub = new Parser(opt)
      let testItem = spectrumBuffer('comma_in_quotes.csv', 'comma_in_quotes.json')
      let expected = JSON.parse(testItem.json)
      sub.text2json(testItem.text, (err, actual)=>{
        if(!_.isEqual(expected, actual)) {
          logTestData(expected, actual)
          done (`Failed test for comma_in_quotes`)
        } else {
          done()
        }
      })
    })

    it('comma_in_quotes_streaming', (done) => {
      let opt : ParserOptions = {hasHeader: true, quote: '"'}
      let sub = new Parser(opt)
      let testItem = spectrumBuffer('comma_in_quotes.csv', 'comma_in_quotes.json')
      let expected = JSON.parse(testItem.json)
      let actual = []
      sub.text2json(testItem.text)
        .on('row', (row) => {
          actual[actual.length] = row
        })
        .on('end', () => {
          if(!_.isEqual(expected, actual)) {
            logTestData(expected, actual)
            done (`Failed test for comma_in_quotes_streaming`)
          } else {
            done()
          }
        })
    })

    it('empty', (done) => {
      let opt : ParserOptions = {hasHeader: true}
      let sub = new Parser(opt)
      let testItem = spectrumBuffer('empty.csv', 'empty.json')
      let expected = JSON.parse(testItem.json)
      sub.text2json(testItem.text, (err, actual)=>{
        if(!_.isEqual(expected, actual)) {
          logTestData(expected, actual)
          done (`Failed test for empty`)
        } else {
          done()
        }
      })
    })

    it('empty_crlf', (done) => {
      let opt : ParserOptions = {hasHeader: true, newline: '\r\n'}
      let sub = new Parser(opt)
      let testItem = spectrumBuffer('empty_crlf.csv', 'empty_crlf.json')
      let expected = JSON.parse(testItem.json)
      sub.text2json(testItem.text, (err, actual)=>{
        if(!_.isEqual(expected, actual)) {
          logTestData(expected, actual)
          done (`Failed test for empty_crlf`)
        } else {
          done()
        }
      })
    })

    it('escaped_quotes', (done) => {
      let opt : ParserOptions = {hasHeader: true}
      let sub = new Parser(opt)
      let testItem = spectrumBuffer('escaped_quotes.csv', 'escaped_quotes.json')
      let expected = JSON.parse(testItem.json)
      sub.text2json(testItem.text, (err, actual)=>{
        if(!_.isEqual(expected, actual)) {
          logTestData(expected, actual)
          done (`Failed test for escaped_quotes`)
        } else {
          done()
        }
      })
    })
    
    it('json_csv', (done) => {
      let opt : ParserOptions = {hasHeader: true}
      let sub = new Parser(opt)
      let testItem = spectrumBuffer('json.csv', 'json.json')
      let expected = JSON.parse(testItem.json)
      sub.text2json(testItem.text, (err, actual)=>{
        if(!_.isEqual(expected, actual)) {
          logTestData(expected, actual)
          done (`Failed test for json_csv`)
        } else {
          done()
        }
      })
    })

    it('newlines', (done) => {
      let opt : ParserOptions = {hasHeader: true}
      let sub = new Parser(opt)
      let testItem = spectrumBuffer('newlines.csv', 'newlines.json')
      let expected = JSON.parse(testItem.json)
      sub.text2json(testItem.text, (err, actual)=>{
        if(!_.isEqual(expected, actual)) {
          logTestData(expected, actual)
          done (`Failed test for newlines`)
        } else {
          done()
        }
      })
    })

    it('newlines_crlf', (done) => {
      let opt : ParserOptions = {hasHeader: true, newline: '\r\n'}
      let sub = new Parser(opt)
      let testItem = spectrumBuffer('newlines_crlf.csv', 'newlines_crlf.json')
      let expected = JSON.parse(testItem.json)
      sub.text2json(testItem.text, (err, actual)=>{
        if(!_.isEqual(expected, actual)) {
          logTestData(expected, actual)
          done (`Failed test for newlines_crlf`)
        } else {
          done()
        }
      })
    })

    it('quotes_and_newlines', (done) => {
      let opt : ParserOptions = {hasHeader: true}
      let sub = new Parser(opt)
      let testItem = spectrumBuffer('quotes_and_newlines.csv', 'quotes_and_newlines.json')
      let expected = JSON.parse(testItem.json)
      sub.text2json(testItem.text, (err, actual)=>{
        if(!_.isEqual(expected, actual)) {
          logTestData(expected, actual)
          done (`Failed test for quotes_and_newlines`)
        } else {
          done()
        }
      })
    })

    it('simple', (done) => {
      let opt : ParserOptions = {hasHeader: true}
      let sub = new Parser(opt)
      let testItem = spectrumBuffer('simple.csv', 'simple.json')
      let expected = JSON.parse(testItem.json)
      sub.text2json(testItem.text, (err, actual)=>{
        if(!_.isEqual(expected, actual)) {
          logTestData(expected, actual)
          done (`Failed test for simple`)
        } else {
          done()
        }
      })
    })

    it('simple_crlf', (done) => {
      let opt : ParserOptions = {hasHeader: true, newline: '\r\n'}
      let sub = new Parser(opt)
      let testItem = spectrumBuffer('simple_crlf.csv', 'simple_crlf.json')
      let expected = JSON.parse(testItem.json)
      sub.text2json(testItem.text, (err, actual)=>{
        if(!_.isEqual(expected, actual)) {
          logTestData(expected, actual)
          done (`Failed test for simple_crlf`)
        } else {
          done()
        }
      })
    })

    it('utf8', (done) => {
      let opt : ParserOptions = {hasHeader: true, encoding: 'utf-8'}
      let sub = new Parser(opt)
      let testItem = spectrumBuffer('utf8.csv', 'utf8.json')
      let expected = JSON.parse(testItem.json)
      sub.text2json(testItem.text, (err, actual)=>{
        if(!_.isEqual(expected, actual)) {
          logTestData(expected, actual)
          done (`Failed test for utf8`)
        } else {
          done()
        }
      })

        
    })

    it('data_from_file', (done) => {
      let opt : ParserOptions = {hasHeader: true, encoding: 'utf-8'}
      let sub = new Parser(opt)
      let testItem = spectrumFile('utf8.csv', 'utf8.json')
      let expected = JSON.parse(testItem.json)
      sub.text2json(testItem.file, (err, actual)=>{
        if(!_.isEqual(expected, actual)) {
          logTestData(expected, actual)
          done (`Failed test for data_from_file`)
        } else {
          done()
        }
      })

        
    })

    it('data_from_string', (done) => {
      let opt : ParserOptions = {hasHeader: true, encoding: 'utf-8'}
      let sub = new Parser(opt)
      let data = `a,b,c\n1,2,3`
      let json = `[{"a": "1","b": "2","c": "3"}]`
      let expected = JSON.parse(json)
      sub.text2json(data, (err, actual)=>{
        if(!_.isEqual(expected, actual)) {
          logTestData(expected, actual)
          done (`Failed test for data_from_string`)
        } else {
          done()
        }
      })
    })

    it('tab_separated', (done) => {
      let opt : ParserOptions = {hasHeader: true, encoding: 'utf-8', separator: '\t'}
      let sub = new Parser(opt)
      let testItem = spectrumFile('tab_separated.csv', 'simple.json')
      let expected = JSON.parse(testItem.json)
      sub.text2json(testItem.file, (err, actual)=>{
        if(!_.isEqual(expected, actual)) {
          logTestData(expected, actual)
          done (`Failed test for tab_separated`)
        } else {
          done()
        }
      })
    })

    it('no_header_in_data', (done) => {
      let opt : ParserOptions = {hasHeader: false, encoding: 'utf-8'}
      let sub = new Parser(opt)
      let data = `1,2,3\n4,5,6`
      let json = `[{"_0": "1","_1": "2","_2": "3"},{"_0": "4","_1": "5","_2": "6"}]`
      let expected = JSON.parse(json)
      sub.text2json(data, (err, actual)=>{
        if(!_.isEqual(expected, actual)) {
          logTestData(expected, actual)
          done (`Failed test for no_header_in_data`)
        } else {
          done()
        }
      })
    })

    it('custom_separator', (done) => {
      let opt : ParserOptions = {hasHeader: true, encoding: 'utf-8', separator: '|'}
      let sub = new Parser(opt)
      let data = `a|b|c\n1|2|3`
      let json = `[{"a": "1","b": "2","c": "3"}]`
      let expected = JSON.parse(json)
      sub.text2json(data, (err, actual)=>{
        if(!_.isEqual(expected, actual)) {
          logTestData(expected, actual)
          done (`Failed test for custom_separator`)
        } else {
          done()
        }
      })
    })

    it('unmatched_quotes', (done) => {
      let opt : ParserOptions = {hasHeader: true, encoding: 'utf-8'}
      let sub = new Parser(opt)
      let data = `a,b,c\n1,"2,3`
      sub.text2json(data, (err, actual)=>{
        if (err.toString().indexOf('Unmatched quotes') > -1) {
          done()
        } else {
          done('should raise error')
        }
      })
    })

    it('skip_rows', (done) => {
      let opt : ParserOptions = {hasHeader: true, skipRows: 2}
      let sub = new Parser(opt)
      let data = `id,firstName,lastName,jobTitle
1,Jed,Hoppe,Customer Markets Supervisor
2,Cristian,Miller,Principal Division Specialist
3,Kenyatta,Schimmel,Product Implementation Executive`

      sub.text2json(data, (err, actual)=>{
        if (actual.length === 1) {
          done()
        } else {
          done(`expected length 1 got ${actual.length}`)
        }
      })
    })

    it('skip_rows_without_header', (done) => {
      let opt : ParserOptions = {hasHeader: false, skipRows: 2}
      let sub = new Parser(opt)
      let data = `1,Jed,Hoppe,Customer Markets Supervisor
2,Cristian,Miller,Principal Division Specialist
3,Kenyatta,Schimmel,Product Implementation Executive`

      sub.text2json(data, (err, actual)=>{
        if (actual.length === 1) {
          done()
        } else {
          done(`expected length 1 got ${actual.length}`)
        }
      })
    })
  })

  describe('parser performance', () => {
    let rows = [5000, 10000, 100000, 200000]
    for (let i = 0; i < rows.length; i++) {
      it(`reads ${rows[i]} rows`, function (done) {
        this.timeout(0);
        let opt : ParserOptions = {hasHeader: true, encoding: 'utf-8'}
        let sub = new Parser(opt)

        let testItem = path.join(__dirname, 'spectrum', 'text', `mock_data_${rows[i]}.txt`)
        
        console.time(`Read ${rows[i]} rows`)
        sub.text2json(testItem)
              .on('end', () => {
                console.timeEnd(`Read ${rows[i]} rows`)
                logMemoryUsage()
                done()
              })
      })
    }
  })

  function logTestData (expected : any, actual : any) : void {
    console.log('Expected:\n', expected)
    console.log('Actual:\n', actual)
  }

  function logMemoryUsage() {
    let memUsage = process.memoryUsage()
    console.log(`\n------------------------------------------\nHeap total: ${Math.round(memUsage.heapTotal/1048576)} MB\tHeap used: ${Math.round(memUsage.heapUsed/1048576)} MB`)
  }
})
