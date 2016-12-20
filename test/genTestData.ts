import * as faker from 'faker'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

if (process.argv.length < 2) {
  console.error('Missing arguments.\nUsage: genTestData.js <number of rows> ?<column separator>')
}

let numRows : any = process.argv[2]
let colSeparator = process.argv[3] || ',' 
let fields = ['firstName','lastName','jobTitle','title','jobDescriptor','jobType']

try {
  numRows = parseInt(numRows)
} catch (ex) {
  console.log('You must tell now many rows to generate.\nUsage: genTestData.js <number of rows> ?<column separator>')
}

let mockFile = path.join(__dirname, 'spectrum', 'text', `mock_data_${numRows}.txt`)

let headers = ['id'].concat(fields).join(colSeparator) + os.EOL

fs.writeFile(mockFile, headers, 'utf-8', (err) => {
  if (err)
    console.error(err)
})

let writeStream = fs.createWriteStream(mockFile, {flags : 'a'})
let rowCount = 0
let rowMod = numRows / 10

while (rowCount < numRows) {
  let row : string = (rowCount + 1) + colSeparator
  for (let field of fields) {
    row += faker.fake(`{{name.${field}}}`) + colSeparator
  }
  row = row.substr(0, row.length - 1) + os.EOL
  writeStream.write(row, 'utf-8')
  rowCount++
  if (rowCount % rowMod === 0)
    console.info('written: ', rowCount, 'rows')
}
