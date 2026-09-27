#!/usr/bin/env node

import parse from "csv-parse/lib/sync.js";
import stringify from "csv-stringify/lib/sync.js";
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert";

main();

function main() {
  if (process.argv.length !== 3) {
    console.log(`Usage: ${process.argv[1]} <input file>`);
    process.exit(1);
  }
  const inputPath = process.argv[2];

  const textIn = readFileSync(inputPath, "utf8");
  const rowsIn = parse(textIn, {
    columns: true,
    skip_empty_lines: true
  });

  handleTrades(rowsIn);
  handleTransfers(rowsIn);
}

function handleTrades(rowsIn) {
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

    // Figure out which row is which:
    const from = tradesIn[i].Quantity < 0 ? i : i + 1;
    const to = tradesIn[i].Quantity < 0 ? i + 1 : i;

    const fromCoin = tradesIn[from]["Source Currency"].toUpperCase();
    const toCoin = tradesIn[to]["Source Currency"].toUpperCase();

    if (toCoin === "USD") {
      const action = "SELL";
      const symbol = fromCoin;
      const volume = -tradesIn[from]["Quantity"];
      const currency = toCoin;
      const feeCurrency = "USD";

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
      const symbol = toCoin;
      const volume = tradesIn[to]["Quantity"];
      const currency = fromCoin;
      const feeCurrency = fromCoin;

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
  console.log("(saved to trades.csv)\n");
  writeFileSync("./trades.csv", outText, "utf8");
}

/**
 * Handles deposits & withdraws.
 */
function handleTransfers(rowsIn) {
  const rowsOut = [
    [
      "Date",
      "Action",
      "Memo",
      "Source",
      "Symbol",
      "Volume",
      "Total",
      "Currency"
    ]
  ];
  for (const row of rowsIn) {
    let action = row.Action;
    if (action == "Deposit") {
      action = "DEPOSIT";
    } else if (action === "Withdraw") {
      action = "WITHDRAWAL";
    } else {
      continue;
    }

    const symbol = row["Source Currency"].toUpperCase();
    if (symbol == "USD") continue;

    const date = row.Date.replace("T", " ").replace(".000Z", " Z");
    const memo = "SFox";
    const source = "SFOX";
    const volume = row.Quantity.replace(/^-/, "");

    // Output
    rowsOut.push([date, action, memo, source, symbol, volume, "", ""]);
  }

  const outText = stringify(rowsOut);
  console.log(outText);
  console.log(`(saved to transfers.csv)`);
  writeFileSync("./transfers.csv", outText, "utf8");
}
