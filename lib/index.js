"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var debug = require("debug");
var fs = require("fs");
var stream = require("stream");
var streamify_1 = require("./streamify");
var d = debug('TP:');
var Parser = (function (_super) {
    __extends(Parser, _super);
    function Parser(options) {
        var _this = _super.call(this, { objectMode: true, highWaterMark: 16 }) || this;
        _this.parserOptions = _this.mergeOptions(options);
        _this.quote = new Buffer(_this.parserOptions.quote)[0];
        _this.escapedQuotes = new RegExp("" + _this.parserOptions.quote + _this.parserOptions.quote, 'g');
        return _this;
    }
    Parser.prototype.text2json = function (data, cb) {
        var _this = this;
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
                    if (crlf) {
                        colStart = colStart + 1;
                    }
                    if (headers.length === 0) {
                        if (_this.parserOptions.hasHeader) {
                            headers = elements.slice(0);
                        }
                        else if (!_this.isEmpty(_this.parserOptions.headers)) {
                            headers = _this.parserOptions.headers;
                        }
                        headers = _this.fillHeaders(headers, elements.length);
                        _this.emit('headers', headers);
                        if (!_this.parserOptions.hasHeader) {
                            hashtable[hashtable.length] = _this.createHash(headers, elements);
                        }
                    }
                    else {
                        if (!skipThisRow && elements.length) {
                            hashtable[hashtable.length] = _this.createHash(headers, elements);
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
                var err = 'Unmatched quotes around ' + buf.toString('utf8', colStart, colStart + 20 > bufEnd ? bufEnd : colStart + 20);
                dataStream.emit('error', new Error(err));
            }
            else if (!skipThisRow && i === bufEnd && colStart < bufEnd) {
                elements = _this._value(buf, colStart, bufEnd, elements).values;
                hashtable[hashtable.length] = _this.createHash(headers, elements);
                colStart = bufEnd;
            }
        });
        dataStream.on('end', function () {
            if (cb) {
                cb(null, hashtable);
            }
            else {
                _this.emit('end', null);
            }
        });
        dataStream.on('error', function (err) {
            if (cb) {
                cb(err, hashtable);
            }
            else {
                _this.emit('error', err);
            }
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
            parsedValue = hasQuote
                ? buf.toString('utf8', start + 1, end - 1).replace(this.escapedQuotes, this.parserOptions.quote)
                : buf.toString('utf8', start, end);
            values[values.length] = parsedValue;
        }
        return { parsed: balancedQuotes, values: values };
    };
    Parser.prototype.createHash = function (headers, line) {
        var _hash = {};
        for (var i = 0; i < line.length; i++) {
            _hash[headers[i]] = line[i];
        }
        this.emit('row', _hash);
        return _hash;
    };
    Parser.prototype.fillHeaders = function (headers, numElements) {
        headers = headers || [];
        if (headers.length === numElements) {
            return headers;
        }
        else if (headers.length === 0) {
            for (var i = 0; i < numElements; i++) {
                headers.push('_' + i);
            }
        }
        else if (headers.length < numElements) {
            for (var i = headers.length - 1; i < numElements; i++) {
                headers.push('_' + i);
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
            skipRows: 0
        };
    };
    Parser.prototype.mergeOptions = function (options) {
        var defaultOpt = this.defaultOptions();
        var opt = options || defaultOpt;
        opt.hasHeader = options.hasHeader || defaultOpt.hasHeader;
        opt.headers = options.headers || defaultOpt.headers;
        opt.newline = options.newline || defaultOpt.newline;
        opt.separator = options.separator || defaultOpt.separator;
        opt.quote = options.quote || defaultOpt.quote;
        opt.encoding = options.encoding || defaultOpt.encoding;
        opt.skipRows = options.skipRows || defaultOpt.skipRows;
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
