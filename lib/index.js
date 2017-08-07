"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var debug = require("debug");
var fs = require("fs");
var stream = require("stream");
var streamify_1 = require("./streamify");
var d = debug('TP:');
var Parser = (function (_super) {
    __extends(Parser, _super);
    function Parser(options) {
        var _this = _super.call(this, { objectMode: true, highWaterMark: 16 }) || this;
        _this.hasFilters = false;
        _this.headersParsed = false;
        _this.columnIndex = -1;
        _this.parserOptions = _this.mergeOptions(options);
        _this.encoding = _this.parserOptions.encoding;
        _this.quote = new Buffer(_this.parserOptions.quote)[0];
        _this.escapedQuotes = new RegExp("" + _this.parserOptions.quote + _this.parserOptions.quote, 'g');
        _this.hasFilters = _this.parserOptions.filters.columns.length > 0 ? true : false;
        if (_this.hasFilters) {
            _this.columnFilters = _this.parserOptions.filters.columns;
        }
        return _this;
    }
    Parser.prototype.text2json = function (data, cb) {
        var _this = this;
        var streaming = typeof cb === 'function' ? false : true;
        var dataStream;
        if (data instanceof Buffer) {
            dataStream = streamify_1.createReadStream(data, {});
        }
        else if (fs.existsSync(data)) {
            dataStream = fs.createReadStream(data);
        }
        else if (typeof data === 'string' || data instanceof String) {
            dataStream = streamify_1.createReadStream(data, {});
        }
        var hashtable = [];
        var headers = [];
        var elements = [];
        var _hash;
        var rowsSkipped = 0;
        var skipThisRow = this.parserOptions.skipRows > 0;
        var bufEnd = 0;
        var colStart = 0;
        var balancedQuotes = true;
        var i = 0;
        var separator = new Buffer(this.parserOptions.separator)[0];
        var newline = new Buffer(this.parserOptions.newline)[0];
        var crlf = this.parserOptions.newline === '\n' ? false : true;
        dataStream.on('data', function (buf) {
            bufEnd = buf.length;
            for (i = 0; i < bufEnd; i++) {
                if (buf[i] === separator || buf[i] === newline) {
                    var _parsed = _this._value(buf, colStart, i, elements);
                    elements = _parsed.values;
                    balancedQuotes = _parsed.parsed;
                    if (balancedQuotes) {
                        colStart = i + 1;
                    }
                }
                if (balancedQuotes && buf[i] === newline) {
                    _this.columnIndex = -1;
                    if (crlf) {
                        colStart = colStart + 1;
                    }
                    if (!_this.headersParsed) {
                        if (_this.parserOptions.hasHeader) {
                            headers = elements.slice(0);
                        }
                        if (!_this.isEmpty(_this.parserOptions.headers)) {
                            headers = _this.parserOptions.headers;
                        }
                        headers = _this.fillHeaders(headers, elements.length);
                        _this.emit('headers', headers);
                        _this.headersParsed = true;
                        if (_this.parserOptions.headersOnly) {
                            //close the stream
                            dataStream.push(null);
                        }
                        try {
                            _this.columnFilters = _this.normalizeColumnFilters(_this.columnFilters, headers);
                        }
                        catch (ex) {
                            dataStream.emit('error', ex.toString());
                            //close the stream
                            dataStream.push(null);
                        }
                        if (!_this.parserOptions.hasHeader) {
                            _hash = _this.createHash(headers, elements, streaming);
                            if (_hash) {
                                hashtable[hashtable.length] = _hash;
                            }
                        }
                    }
                    else {
                        if (!skipThisRow && elements.length) {
                            _hash = _this.createHash(headers, elements, streaming);
                            if (_hash) {
                                hashtable[hashtable.length] = _hash;
                            }
                        }
                        else {
                            rowsSkipped++;
                        }
                        skipThisRow = !(rowsSkipped >= _this.parserOptions.skipRows);
                    }
                    elements.length = 0;
                }
            }
            if (!balancedQuotes && i === bufEnd && colStart < bufEnd) {
                var err = 'Unmatched quotes around ' + buf.toString(_this.encoding, colStart, colStart + 20 > bufEnd ? bufEnd : colStart + 20);
                dataStream.emit('error', new Error(err));
            }
            else if (!skipThisRow && i === bufEnd && colStart < bufEnd) {
                elements = _this._value(buf, colStart, bufEnd, elements).values;
                _hash = _this.createHash(headers, elements, streaming);
                if (_hash) {
                    hashtable[hashtable.length] = _hash;
                }
                colStart = bufEnd;
            }
        });
        dataStream.on('end', function () {
            if (!streaming) {
                if (_this.parserOptions.headersOnly) {
                    cb(null, headers);
                }
                else {
                    cb(null, hashtable);
                }
            }
            else {
                _this.emit('end', null);
            }
            hashtable = null;
        });
        dataStream.on('error', function (err) {
            if (!streaming) {
                cb(err, hashtable);
            }
            else {
                _this.emit('error', err);
            }
            hashtable = null;
        });
        return this;
    };
    Parser.prototype._value = function (buf, start, end, values) {
        var balancedQuotes = true;
        var hasQuote = false;
        var parsedValue = '';
        if (start === end) {
            return { parsed: true, values: values };
        }
        for (var i = start; i < end; i++) {
            if (buf[i] === this.quote) {
                balancedQuotes = !balancedQuotes;
                hasQuote = true;
            }
        }
        if (balancedQuotes) {
            this.columnIndex++;
            if (this.headersParsed && this.hasFilters) {
                if (this.columnFilters.indexOf(this.columnIndex) === -1) {
                    values[values.length] = undefined;
                    return { parsed: true, values: values };
                }
            }
            parsedValue = hasQuote
                ? buf.toString(this.encoding, start + 1, end - 1).replace(this.escapedQuotes, this.parserOptions.quote)
                : buf.toString(this.encoding, start, end);
            values[values.length] = parsedValue;
        }
        return { parsed: balancedQuotes, values: values };
    };
    Parser.prototype.normalizeColumnFilters = function (colFilters, headers) {
        colFilters = colFilters || headers;
        colFilters = colFilters.map(function (c) {
            if (typeof c === 'number' && c <= headers.length) {
                return c - 1;
            }
            else if (typeof c === 'string' && headers.indexOf(c) > -1) {
                return headers.indexOf(c);
            }
            else {
                throw new Error('Invalid column name or index [' + c + '] in filters');
            }
        });
        return colFilters;
    };
    Parser.prototype.createHash = function (headers, line, streaming) {
        if (streaming === void 0) { streaming = false; }
        var _hash = {};
        if (!this.columnFilters) {
            return _hash;
        }
        for (var i = 0; i < this.columnFilters.length; i++) {
            _hash[headers[this.columnFilters[i]]] = line[this.columnFilters[i]];
        }
        if (streaming) {
            this.emit('row', _hash);
            _hash = null;
        }
        return _hash;
    };
    Parser.prototype.fillHeaders = function (headers, numElements) {
        headers = headers || [];
        if (headers.length === numElements) {
            return headers;
        }
        else if (headers.length === 0) {
            for (var i = 0; i < numElements; i++) {
                headers.push('_' + (i + 1));
            }
        }
        else if (headers.length < numElements - 1) {
            for (var i = headers.length; i < numElements; i++) {
                headers.push('_' + (i + 1));
            }
        }
        return headers;
    };
    Parser.prototype.defaultOptions = function () {
        return {
            hasHeader: false,
            headers: [],
            newline: '\n',
            separator: ',',
            quote: '"',
            encoding: 'utf8',
            skipRows: 0,
            filters: { columns: [] },
            headersOnly: false
        };
    };
    Parser.prototype.mergeOptions = function (options) {
        var defaultOpt = this.defaultOptions();
        var opt = options || defaultOpt;
        options = options || {};
        opt.hasHeader = options.hasHeader || defaultOpt.hasHeader;
        opt.headers = options.headers || defaultOpt.headers;
        opt.newline = options.newline || defaultOpt.newline;
        opt.separator = options.separator || defaultOpt.separator;
        opt.quote = options.quote || defaultOpt.quote;
        opt.encoding = options.encoding || defaultOpt.encoding;
        opt.skipRows = options.skipRows || defaultOpt.skipRows;
        opt.filters = options.filters || defaultOpt.filters;
        opt.headersOnly = options.headersOnly || defaultOpt.headersOnly;
        return opt;
    };
    Parser.prototype.isEmpty = function (obj) {
        if (Array.isArray(obj)) {
            return obj.length > 0 ? false : true;
        }
        else {
            return true;
        }
    };
    return Parser;
}(stream.Transform));
exports.Parser = Parser;
