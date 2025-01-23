const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");
const _ = require("lodash");

const old_payments = [];
const new_payments = [];

const parser = new XMLParser();

const oldIncasso = fs.readFileSync(
  path.join(__dirname, "oud.xml")
);
_.get(parser.parse(oldIncasso), ["Document", "CstmrDrctDbtInitn", "PmtInf"])
  .flatMap((t) => _.get(t, "DrctDbtTxInf"))
  .forEach((t) =>
    old_payments.push({ [t.DrctDbtTx.MndtRltdInf.MndtId]: t.InstdAmt })
  );

const newIncasso = fs.readFileSync(
  path.join(__dirname, "nieuw.xml")
);
_.get(parser.parse(newIncasso), ["Document", "CstmrDrctDbtInitn", "PmtInf"])
  .flatMap((t) => _.get(t, "DrctDbtTxInf"))
  .forEach((t) =>
    new_payments.push({ [t.DrctDbtTx.MndtRltdInf.MndtId]: t.InstdAmt })
  );

fs.writeFileSync(
  path.join(__dirname, "new_incasso.json"),
  JSON.stringify(new_payments)
);

fs.writeFileSync(
  path.join(__dirname, "old_incasso.json"),
  JSON.stringify(old_payments)
);
