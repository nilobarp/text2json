import * as fs from "fs";
import "mocha";
import * as path from "path";
import { IParserOptions, Parser } from "../src/index.js";
import { spectrumBuffer, spectrumFile } from "./spectrum";

describe("parser performance", () => {
  const rows = [5000, 10000, 100000, 200000];
  // let rows = [100000]
  for (const row of rows) {
    it(`reads ${row} rows`, function(done) {
      this.timeout(0);
      const opt: IParserOptions = {
        encoding: "utf-8",
        hasHeader: true,
      };
      const sub = new Parser(opt);

      const testItem = path.join(__dirname, "spectrum", "text", `mock_data_${row}.txt`);

      console.time(`Read ${row} rows`);
      sub.text2json(testItem)
        .on("end", () => {
          console.timeEnd(`Read ${row} rows`);
          logMemoryUsage();
          done();
        });
    });
  }
});

function logTestData(expected: any, actual: any): void {
  console.log("Expected:\n", expected);
  console.log("Actual:\n", actual);
}

function logMemoryUsage() {
  const memUsage = process.memoryUsage();
  console.log(`\n------------------------------------------\nHeap total: ` +
    `${Math.round(memUsage.heapTotal / 1048576)} MB\tHeap used: ${Math.round(memUsage.heapUsed / 1048576)} MB`);
}
