import * as debug from 'debug'
import * as fs from 'fs'
import * as es from 'event-stream'
import { createReadStream } from './streamify'

const d = debug('TP:')

export type ParserOptions = {
  hasHeader: boolean
  headers?: string[],
  newline?: string,
  separator?: string,
  quote?: string,
  escape?: string,
  encoding?: string
}

type ParsedValues = {
  parsed: boolean,
  values: any[],

}

export type doneparsing = { (err: Error, object: any): void }

export interface iDataParser {
  parserOptions: ParserOptions,
  csv2json(data: Buffer | string, cb: doneparsing): void
}

export class Parser implements iDataParser {
  parserOptions: ParserOptions
  quote : number
  escapedQuotes : RegExp

  constructor(options?: ParserOptions) {
    this.parserOptions = this.mergeOptions(options)
    this.quote = new Buffer(this.parserOptions.quote)[0]
    this.escapedQuotes = new RegExp(`${this.parserOptions.quote}${this.parserOptions.quote}`, 'g')
  }

  csv2json(data: Buffer | string, cb: doneparsing): void {
    let dataStream: fs.ReadStream
    if (data instanceof Buffer) {
      dataStream = createReadStream(data, {})
    } else if (fs.existsSync(data)) {
      dataStream = fs.createReadStream(data)
    } else if (typeof data === 'string' || data instanceof String) {
      dataStream = createReadStream(data, {})
    }

    let hashtable: {}[] = []
    let headers: string[] = []
    let elements : any[] = []

    let bufStart : number = 0
    let bufEnd : number = 0
    let colStart : number = 0
    let colEnd : number = 0
    let balancedQuotes : boolean = true
    let i : number = 0
    // let lineNum : number = 1

    let separator : number = new Buffer(this.parserOptions.separator)[0]
    let newline : number = new Buffer(this.parserOptions.newline)[0]
    let crlf : boolean = this.parserOptions.newline === '\n' ? false : true

    dataStream.on('data', (buf: Buffer) => {
      bufEnd = buf.length
      colStart = bufStart

      for (i = 0; i < bufEnd; i++) {
        if (buf[i] === separator || buf[i] === newline) {
          colEnd = i
          let _parsed = this._value(buf, colStart, colEnd, elements)
          elements = _parsed.values
          balancedQuotes = _parsed.parsed
          if(_parsed.parsed) {
            colStart = i + 1
          } 
        }
        if (balancedQuotes && buf[i] === newline) {
          if (crlf) {
            colStart = colStart + 1
          }
          if (headers.length === 0) {
            if (this.parserOptions.hasHeader) {
              headers = elements.slice(0)
            } else if (!this.isEmpty(this.parserOptions.headers)) {
              headers = this.parserOptions.headers
            }
            headers = this.fillHeaders(headers, elements.length)
            if (!this.parserOptions.hasHeader) {
              hashtable[hashtable.length] = this.createHash(headers, elements)
            }
          } else {
            if (elements.length)
              hashtable[hashtable.length] = this.createHash(headers, elements)
          }
          elements.length = 0
        }
      }

      if (!balancedQuotes && i === bufEnd && colStart < bufEnd) {
        let err = 'Unmatched quotes around ' + buf.toString('utf8', colStart, colStart + 20 > bufEnd ? bufEnd : colStart + 20)
        dataStream.emit('error', new Error(err))
      } else if (i === bufEnd && colStart < bufEnd) {
        elements = this._value(buf, colStart, bufEnd, elements).values
        hashtable[hashtable.length] = this.createHash(headers, elements)
        colStart = bufEnd
      }
    })
    dataStream.on('end', () => {
      cb(null, hashtable)
    })
    dataStream.on('error', (err) => {
      cb(err, hashtable)
    })
  }

  private _value(buf : Buffer, start : number, end : number, values : any[]) : ParsedValues {
    let balancedQuotes : boolean = true
    let hasQuote : boolean = false
    let parsedValue : string = ''

    if (start === end) {
      return {parsed: true, values: values}
    }

    for(let i = start; i < end; i++) {
      if (buf[i] === this.quote) {
        balancedQuotes = !balancedQuotes
        hasQuote = true
      }
    }
    if (balancedQuotes) {
      parsedValue = hasQuote
                      ? buf.toString('utf8', start + 1, end - 1).replace(this.escapedQuotes, this.parserOptions.quote)
                      : buf.toString('utf8', start, end)
      values[values.length] = parsedValue
    }
    return {parsed: balancedQuotes, values: values}
  }

  private createHash(headers: string[], line: string[]): {} {
    let _hash = {}
    for (var i = 0; i < line.length; i++) {
      _hash[headers[i]] = line[i]
    }

    return _hash;
  }

  private fillHeaders(headers: any[], numElements: number): any[] {
    headers = headers || []
    if (headers.length === numElements) {
      return headers
    } else if (headers.length === 0) {
      for (let i = 0; i < numElements; i++) {
        headers.push('_' + i)
      }
    } else if (headers.length < numElements) {
      for (let i = headers.length - 1; i < numElements; i++) {
        headers.push('_' + i)
      }
    }
    return headers
  }

  private defaultOptions(): ParserOptions {
    return {
      hasHeader: false,
      headers: [],
      newline: '\n',
      separator: ',',
      quote: '"',
      escape: '"',
      encoding: 'utf8'
    }
  }

  private mergeOptions(options: ParserOptions): ParserOptions {
    var defaultOpt = this.defaultOptions()
    var opt: ParserOptions = options || defaultOpt
    opt.hasHeader = options.hasHeader || defaultOpt.hasHeader
    opt.headers = options.headers || defaultOpt.headers
    opt.newline = options.newline || defaultOpt.newline
    opt.separator = options.separator || defaultOpt.separator
    opt.quote = options.quote || defaultOpt.quote
    opt.escape = options.escape || defaultOpt.escape
    opt.encoding = options.encoding || defaultOpt.encoding

    return opt
  }

  private isEmpty(obj): boolean {
    if (Array.isArray(obj)) {
      return obj.length > 0 ? false : true
    } else {
      return true
    }
  }
}