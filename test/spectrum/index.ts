import * as fs from 'fs'
import * as path from 'path'

export var spectrumBuffer = (textFile : string, outputFile : string) : {text : Buffer, json : string} => {
  const textFolder = path.join(__dirname, 'text')
  const jsonFolder = path.join(__dirname, 'json')

  let item = {
    text: fs.readFileSync(path.join(textFolder, textFile)),
    json: fs.readFileSync(path.join(jsonFolder, outputFile)).toString()
  }

  return item
}

export var spectrumFile = (textFile : string, outputFile : string) : {file : string, json : string} => {
  const textFolder = path.join(__dirname, 'text')
  const jsonFolder = path.join(__dirname, 'json')

  let item = {
    file: path.join(textFolder, textFile),
    json: fs.readFileSync(path.join(jsonFolder, outputFile)).toString()
  }

  return item
}