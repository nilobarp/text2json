"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util = require("util");
var stream = require("stream");
/**
 * Wrap objects as a readable stream
 *
 * @param {Object} source Object to be converted
 * @param {Object} options Stream options
 * @returns {ReadStream} <tt>source</tt> wrapped as a readable stream
 */
exports.createReadStream = function (source, options) {
    return new MultiStream(source, options);
};
var MultiStream = function (object, options) {
    if (object instanceof Buffer || typeof object === 'string') {
        options = options || {};
        stream.Readable.call(this, {
            highWaterMark: options.highWaterMark,
            encoding: options.encoding
        });
    }
    else {
        stream.Readable.call(this, { objectMode: true });
    }
    this._object = object;
};
util.inherits(MultiStream, stream.Readable);
MultiStream.prototype._read = function () {
    this.push(this._object);
    this._object = null;
};
