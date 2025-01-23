const fs = require("fs");
const path = require("path");
const { XMLParser } = require("fast-xml-parser");
const _ = require("lodash");

const old_payments = [];
const new_payments = [];

const parser = new XMLParser();

fs.readdirSync(path.join(__dirname, "oud"))
  .filter((fileName) => fileName.endsWith(".xml"))
  .forEach((fileName) => {
    const oldIncasso = fs.readFileSync(path.join(__dirname, "oud", fileName));
    const paymentInfos = _.get(parser.parse(oldIncasso), [
      "Document",
      "CstmrDrctDbtInitn",
      "PmtInf",
    ]);
    if (_.isArray(paymentInfos)) {
      paymentInfos
        .flatMap((t) => _.get(t, "DrctDbtTxInf", []))
        .forEach((t) =>
          old_payments.push({ [t.DrctDbtTx.MndtRltdInf.MndtId]: t.InstdAmt })
        );
    } else {
      _.get(paymentInfos, "DrctDbtTxInf", []).forEach((t) =>
        old_payments.push({ [t.DrctDbtTx.MndtRltdInf.MndtId]: t.InstdAmt })
      );
    }
  });

fs.readdirSync(path.join(__dirname, "nieuw"))
  .filter((fileName) => fileName.endsWith(".xml"))
  .forEach((fileName) => {
    const newIncasso = fs.readFileSync(path.join(__dirname, "nieuw", fileName));
    const paymentInfos = _.get(parser.parse(newIncasso), [
      "Document",
      "CstmrDrctDbtInitn",
      "PmtInf",
    ]);
    if (_.isArray(paymentInfos)) {
      paymentInfos
        .flatMap((t) => _.get(t, "DrctDbtTxInf"))
        .forEach((t) =>
          new_payments.push({ [t.DrctDbtTx.MndtRltdInf.MndtId]: t.InstdAmt })
        );
    } else {
      _.get(paymentInfos, "DrctDbtTxInf", []).forEach((t) =>
        new_payments.push({ [t.DrctDbtTx.MndtRltdInf.MndtId]: t.InstdAmt })
      );
    }
  });

const newIncassoMap = {};
const oldIncassoMap = {};

const doubleNewTransactions = [];
const doubleOldTransactions = [];

for (const entry of new_payments) {
  const key = Object.keys(entry)[0];
  if (newIncassoMap[key]) {
    console.log("Er zijn meerdere nieuwe transacties met kenmerk", key);
    doubleNewTransactions.push(key);
  }
  newIncassoMap[key] = entry[key];
}

for (const entry of old_payments) {
  const key = Object.keys(entry)[0];
  if (oldIncassoMap[key]) {
    console.log("Er zijn meerdere oude transacties met kenmerk", key);
    doubleOldTransactions.push(key);
  }
  oldIncassoMap[key] = entry[key];
}

const overlap = Object.keys(newIncassoMap).filter(
  (key) => key in oldIncassoMap
);
const excessNew = Object.keys(newIncassoMap).filter(
  (key) => !overlap.includes(key)
);
const excessOld = Object.keys(oldIncassoMap).filter(
  (key) => !overlap.includes(key)
);

console.log("Aantal overlappende transacties:", overlap.length);
console.log("Aantal missende (oude) transacties:", excessOld.length);
console.log("Aantal extra (nieuwe) transacties:", excessNew.length);

const wrongAmount = [];

for (const x of overlap) {
  if (newIncassoMap[x] !== oldIncassoMap[x]) {
    console.log(
      `Het bedrag klopt niet voor machtigingskenmerk ${x} (is ${newIncassoMap[x]}, moet zijn ${oldIncassoMap[x]})`
    );
    wrongAmount.push(x);
  }
}

fs.writeFileSync(
  path.join(__dirname, "output", "dubbele_nieuwe_transacties.json"),
  JSON.stringify(doubleNewTransactions)
);
fs.writeFileSync(
  path.join(__dirname, "output", "dubbele_oude_transacties.json"),
  JSON.stringify(doubleOldTransactions)
);

fs.writeFileSync(
  path.join(__dirname, "output", "missende_transacties.json"),
  JSON.stringify(excessOld)
);
fs.writeFileSync(
  path.join(__dirname, "output", "extra_transacties.json"),
  JSON.stringify(excessNew)
);

fs.writeFileSync(
  path.join(__dirname, "output", "verkeerd_bedrag_transacties.json"),
  JSON.stringify(wrongAmount)
);
