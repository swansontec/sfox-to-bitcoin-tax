# sfox-to-bitcoin-tax

Converts an SFOX CSV export file to a bitcoin.tax CSV import file.

Steps:

1. Install this tool on your computer using `npm i -g git://github.com/swansontec/sfox-to-bitcoin-tax.git`
2. Download a CSV report from SFOX. You want "account activity" as the report type and be sure to check the "trades" box.
3. Run `sfox-to-bitcoin-tax <name-of-sfox-export>` to convert the file to the bitcoin.tax CSV input format.
4. Double-check the output! This software comes with no warranty. By using it, you agree to take full responsibility for your usage.
