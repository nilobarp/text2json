import * as debug from 'debug'
import * as fs from 'fs'
import * as stream from 'stream'
import { createReadStream } from './streamify'

const d = debug('TP:')

export type Filters = {
  columns?: any[]
}

export type ParserOptions = {
  hasHeader?: boolean
  headers?: string[],
  newline?: string,
  separator?: string,
  quote?: string,
  encoding?: string,
  skipRows?: number,
  filters?: Filters,
  headersOnly?: boolean
}

type ParsedValues = {
  parsed: boolean,
  values: any[]
}

export type doneparsing = { (err: Error, object: any): void }

export interface iDataParser {
  parserOptions: ParserOptions,
  text2json(data: Buffer | string, cb?: doneparsing): void
}

export class Parser extends stream.Transform implements iDataParser {
  parserOptions: ParserOptions
  encoding : string
  quote : number
  escapedQuotes : RegExp
  hasFilters : boolean = false
  columnFilters : any[]
  headersParsed : boolean = false
  columnIndex : number = -1

  constructor(options?: ParserOptions) {
    super({objectMode: true, highWaterMark: 16})
    this.parserOptions = this.mergeOptions(options)
    this.encoding = this.parserOptions.encoding
    this.quote = new Buffer(this.parserOptions.quote)[0]
    this.escapedQuotes = new RegExp(`${this.parserOptions.quote}${this.parserOptions.quote}`, 'g')
    this.hasFilters = this.parserOptions.filters.columns.length > 0 ? true : false
    if (this.hasFilters) {
      this.columnFilters = this.parserOptions.filters.columns
    }
  }

  text2json(data: any, cb?: doneparsing): any {
    let streaming : boolean = typeof cb === 'function' ? false : true
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
    let _hash : {}
    let rowsSkipped : number = 0
    let skipThisRow : boolean = this.parserOptions.skipRows > 0
    let bufEnd : number = 0
    let colStart : number = 0
    let balancedQuotes : boolean = true
    let i : number = 0

    let separator : number = new Buffer(this.parserOptions.separator)[0]
    let newline : number = new Buffer(this.parserOptions.newline)[0]
    let crlf : boolean = this.parserOptions.newline === '\n' ? false : true

    dataStream.on('data', (buf: Buffer) => {
      bufEnd = buf.length

      for (i = 0; i < bufEnd; i++) {
        if (buf[i] === separator || buf[i] === newline) {
          let _parsed = this._value(buf, colStart, i, elements)
          elements = _parsed.values
          balancedQuotes = _parsed.parsed
          if(balancedQuotes) {
            colStart = i + 1
          }
        }
        if (balancedQuotes && buf[i] === newline) {
          this.columnIndex = -1
          if (crlf) {
            colStart = colStart + 1
          }
          if (!this.headersParsed) {
            if (this.parserOptions.hasHeader) {
              headers = elements.slice(0)
            }
            if (!this.isEmpty(this.parserOptions.headers)) {
              headers = this.parserOptions.headers
            }
            headers = this.fillHeaders(headers, elements.length)
            this.emit('headers', headers)
            this.headersParsed = true
            if (this.parserOptions.headersOnly) {
              //close the stream
              dataStream.push(null)
            }
            try {
              this.columnFilters = this.normalizeColumnFilters(this.columnFilters, headers)
            } catch (ex) {
              dataStream.emit('error', ex.toString())
              //close the stream
              dataStream.push(null)
            }
            
            if (!this.parserOptions.hasHeader) {
              _hash = this.createHash(headers, elements, streaming)
              if (_hash) {
                hashtable[hashtable.length] = _hash
              }
            }
          } else {
            if (!skipThisRow && elements.length) {
              _hash = this.createHash(headers, elements, streaming)
              if (_hash) {
                hashtable[hashtable.length] = _hash
              }
            } else {
              rowsSkipped++
            }
            skipThisRow = !(rowsSkipped >= this.parserOptions.skipRows)
          }
          elements.length = 0
        }
      }

      if (!balancedQuotes && i === bufEnd && colStart < bufEnd) {
        let err = 'Unmatched quotes around ' + buf.toString(this.encoding, colStart, colStart + 20 > bufEnd ? bufEnd : colStart + 20)
        dataStream.emit('error', new Error(err))
      } else if (!skipThisRow && i === bufEnd && colStart < bufEnd) {
        elements = this._value(buf, colStart, bufEnd, elements).values
        _hash = this.createHash(headers, elements, streaming)
        if (_hash) {
          hashtable[hashtable.length] = _hash
        }
        colStart = bufEnd
      }
    })
    dataStream.on('end', () => {
      if (!streaming) {
        if (this.parserOptions.headersOnly) {
          cb(null, headers)
        } else {
          cb(null, hashtable)
        }
      } else {
        this.emit('end', null)
      }
      hashtable = null
    })
    dataStream.on('error', (err) => {
      if(!streaming) {
        cb(err, hashtable)
      } else {
        this.emit('error', err)
      }
      hashtable = null
    })
    return this
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
      this.columnIndex++
      if (this.headersParsed && this.hasFilters) {
        if (this.columnFilters.indexOf(this.columnIndex) === -1) {
          values[values.length] = undefined
          return {parsed: true, values: values}
        }
      }

      parsedValue = hasQuote
                      ? buf.toString(this.encoding, start + 1, end - 1).replace(this.escapedQuotes, this.parserOptions.quote)
                      : buf.toString(this.encoding, start, end)
      values[values.length] = parsedValue
    }
    return {parsed: balancedQuotes, values: values}
  }

  private normalizeColumnFilters (colFilters : any[], headers : string[]) : number[] {
    colFilters = colFilters || headers
    colFilters = colFilters.map((c) => {
      if (typeof c === 'number' && c <= headers.length) {
        return c - 1
      } else if (typeof c === 'string' && headers.indexOf(c) > -1) {
        return headers.indexOf(c)
      } else {
        throw new Error('Invalid column name or index ['+ c +'] in filters')
      }
    })
    return colFilters
  }

  private createHash(headers: string[], line: string[], streaming : boolean = false): {} {
    let _hash = {}
    if (!this.columnFilters) {
      return _hash
    }
    for (var i = 0; i < this.columnFilters.length; i++) {
      _hash[headers[this.columnFilters[i]]] = line[this.columnFilters[i]]
    }
    if (streaming) {
      this.emit('row', _hash)
      _hash = null
    }
    return _hash
  }

  private fillHeaders(headers: any[], numElements: number): any[] {
    headers = headers || []
    if (headers.length === numElements) {
      return headers
    } else if (headers.length === 0) {
      for (let i = 0; i < numElements; i++) {
        headers.push('_' + (i + 1))
      }
    } else if (headers.length < numElements - 1) {
      for (let i = headers.length; i < numElements; i++) {
        headers.push('_' + (i + 1))
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
      encoding: 'utf8',
      skipRows: 0,
      filters: {columns: []},
      headersOnly: false
    }
  }

  private mergeOptions(options: ParserOptions): ParserOptions {
    var defaultOpt = this.defaultOptions()
    var opt: ParserOptions = options || defaultOpt
    options = options || {}
    opt.hasHeader = options.hasHeader || defaultOpt.hasHeader
    opt.headers = options.headers || defaultOpt.headers
    opt.newline = options.newline || defaultOpt.newline
    opt.separator = options.separator || defaultOpt.separator
    opt.quote = options.quote || defaultOpt.quote
    opt.encoding = options.encoding || defaultOpt.encoding
    opt.skipRows = options.skipRows || defaultOpt.skipRows
    opt.filters = options.filters || defaultOpt.filters
    opt.headersOnly = options.headersOnly || defaultOpt.headersOnly

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
