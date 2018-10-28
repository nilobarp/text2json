import * as faker from "faker";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

if (process.argv.length < 2) {
  console.error("Missing arguments.\nUsage: genTestData.js <number of rows> ?<column separator>");
}

let numRows: any = process.argv[2];
const colSeparator = process.argv[3] || ",";
const fields = ["firstName", "lastName", "jobTitle", "title", "jobDescriptor", "jobType"];

try {
  numRows = parseInt(numRows, 10);
} catch (ex) {
  console.log("You must tell now many rows to generate.\nUsage: genTestData.js <number of rows> ?<column separator>");
}

const mockFile = path.join(__dirname, "spectrum", "text", `mock_data_${numRows}.txt`);

const headers = ["id"].concat(fields).join(colSeparator) + os.EOL;

fs.writeFile(mockFile, headers, { encoding: "utf-8" }, (err) => {
  if (err) {
    console.error(err);
  }
});

const writeStream = fs.createWriteStream(mockFile, { flags: "a" });
let rowCount = 0;
const rowMod = numRows / 10;

while (rowCount < numRows) {
  let row: string = (rowCount + 1) + colSeparator;
  for (const field of fields) {
    row += faker.fake(`{{name.${field}}}`) + colSeparator;
  }
  row = row.substr(0, row.length - 1) + os.EOL;
  writeStream.write(row, "utf-8");
  rowCount++;
  if (rowCount % rowMod === 0) {
    console.info("written: ", rowCount, "rows");
  }
}
