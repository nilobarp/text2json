"use strict";
var debug = require("debug");
var fs = require("fs");
var streamify_1 = require("./streamify");
var d = debug('TP:');
var Parser = (function () {
    function Parser(options) {
        this.parserOptions = this.mergeOptions(options);
        this.quote = new Buffer(this.parserOptions.quote)[0];
        this.escapedQuotes = new RegExp("" + this.parserOptions.quote + this.parserOptions.quote, 'g');
    }
    Parser.prototype.csv2json = function (data, cb) {
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
        var bufStart = 0;
        var bufEnd = 0;
        var colStart = 0;
        var colEnd = 0;
        var balancedQuotes = true;
        var i = 0;
        // let lineNum : number = 1
        var separator = new Buffer(this.parserOptions.separator)[0];
        var newline = new Buffer(this.parserOptions.newline)[0];
        var crlf = this.parserOptions.newline === '\n' ? false : true;
        dataStream.on('data', function (buf) {
            bufEnd = buf.length;
            colStart = bufStart;
            for (i = 0; i < bufEnd; i++) {
                if (buf[i] === separator || buf[i] === newline) {
                    colEnd = i;
                    var _parsed = _this._value(buf, colStart, colEnd, elements);
                    elements = _parsed.values;
                    balancedQuotes = _parsed.parsed;
                    if (_parsed.parsed) {
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
                        if (!_this.parserOptions.hasHeader) {
                            hashtable[hashtable.length] = _this.createHash(headers, elements);
                        }
                    }
                    else {
                        if (elements.length)
                            hashtable[hashtable.length] = _this.createHash(headers, elements);
                    }
                    elements.length = 0;
                }
            }
            if (!balancedQuotes && i === bufEnd && colStart < bufEnd) {
                var err = 'Unmatched quotes around ' + buf.toString('utf8', colStart, colStart + 20 > bufEnd ? bufEnd : colStart + 20);
                dataStream.emit('error', new Error(err));
            }
            else if (i === bufEnd && colStart < bufEnd) {
                elements = _this._value(buf, colStart, bufEnd, elements).values;
                hashtable[hashtable.length] = _this.createHash(headers, elements);
                colStart = bufEnd;
            }
        });
        dataStream.on('end', function () {
            cb(null, hashtable);
        });
        dataStream.on('error', function (err) {
            cb(err, hashtable);
        });
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
            escape: '"',
            encoding: 'utf8'
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
        opt.escape = options.escape || defaultOpt.escape;
        opt.encoding = options.encoding || defaultOpt.encoding;
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
}());
exports.Parser = Parser;
