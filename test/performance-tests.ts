import {ParserOptions, Parser} from '../src/index.js'
import { spectrumBuffer, spectrumFile } from './spectrum'
import 'mocha'
import * as fs from 'fs'
import * as path from 'path'

describe('parser performance', () => {
  let rows = [5000, 10000, 100000, 200000]
  // let rows = [100000]
  for (let i = 0; i < rows.length; i++) {
    it(`reads ${rows[i]} rows`, function (done) {
      this.timeout(0);
      let opt : ParserOptions = {
        hasHeader: true, 
        encoding: 'utf-8'
      }
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