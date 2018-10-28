import * as fs from "fs";
import * as path from "path";

export let spectrumBuffer = (textFile: string, outputFile: string): { text: Buffer, json: string } => {
  const textFolder = path.join(__dirname, "text");
  const jsonFolder = path.join(__dirname, "json");

  const item = {
    json: fs.readFileSync(path.join(jsonFolder, outputFile)).toString(),
    text: fs.readFileSync(path.join(textFolder, textFile)),
  };

  return item;
};

export let spectrumFile = (textFile: string, outputFile: string): { file: string, json: string } => {
  const textFolder = path.join(__dirname, "text");
  const jsonFolder = path.join(__dirname, "json");

  const item = {
    file: path.join(textFolder, textFile),
    json: fs.readFileSync(path.join(jsonFolder, outputFile)).toString(),
  };

  return item;
};
