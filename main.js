import parse from "csv-parse/lib/sync";
import stringify from "csv-stringify/lib/sync";
import { readFileSync, writeFileSync } from "fs";
import assert from "assert";

if (process.argv.length !== 3) {
  console.log(`Usage: ${process.argv[1]} <input file>`)
  process.exit(1)
}
const inputPath = process.argv[2]

const textIn = readFileSync(inputPath, "utf8");
const rowsIn = parse(textIn, {
  columns: true,
  skip_empty_lines: true
});
const tradesIn = rowsIn.filter(
  row => row.Action === "Buy" || row.Action === "Sell"
);

// Length should be even:
assert((tradesIn.length & 1) === 0);

// Translate the trades into the new format:
const rowsOut = [
  [
    "Date",
    "Source",
    "Action",
    "Symbol",
    "Volume",
    "Currency",
    "Price",
    "Fee",
    "FeeCurrency"
  ]
];
for (let i = 0; i < tradesIn.length; i += 2) {
  assert(tradesIn[i].Date === tradesIn[i + 1].Date);
  assert(tradesIn[i].Price === tradesIn[i + 1].Price);
  assert(tradesIn[i].Fees === tradesIn[i + 1].Fees);

  const date = tradesIn[i].Date.replace("T", " ").replace(".000Z", " Z");
  const source = "SFOX";
  const fee = tradesIn[i].Fees;
  const price = tradesIn[i].Price;
  const feeCurrency = "USD";

  // Figure out which row is which:
  const from = tradesIn[i].Quantity < 0 ? i : i + 1;
  const to = tradesIn[i].Quantity < 0 ? i + 1 : i;

  const fromCoin = tradesIn[from]["Source Currency"].toUpperCase();
  const toCoin = tradesIn[to]["Source Currency"].toUpperCase();

  if (toCoin === "USD") {
    const action = "SELL";
    const symbol = fromCoin
    const volume = -tradesIn[from]["Quantity"];
    const currency = toCoin

    rowsOut.push([
      date,
      source,
      action,
      symbol,
      volume,
      currency,
      price,
      fee,
      feeCurrency
    ]);
  } else {
    const action = "BUY";
    const symbol = toCoin
    const volume = tradesIn[to]["Quantity"];
    const currency = fromCoin
  
    rowsOut.push([
      date,
      source,
      action,
      symbol,
      volume,
      currency,
      price,
      fee,
      feeCurrency
    ]);
  }

}

const outText = stringify(rowsOut);
console.log(outText);
console.log(`(saved to output.csv)`);
writeFileSync("./output.csv", outText, "utf8");
