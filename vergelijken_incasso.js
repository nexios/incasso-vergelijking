const fs = require("fs");

const newIncasso = JSON.parse(fs.readFileSync("./new_incasso.json"));
const oldIncasso = JSON.parse(fs.readFileSync("./old_incasso.json"));

const newIncassoMap = {};
const oldIncassoMap = {};

for (const entry of newIncasso) {
  const key = Object.keys(entry)[0];
  newIncassoMap[key] = entry[key];
}

for (const entry of oldIncasso) {
  const key = Object.keys(entry)[0];
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

console.log("Aantal overlappende transacties", overlap.length);
console.log("Aantal missende (oude) transacties", excessOld.length);
console.log("Aantal extra (nieuwe) transacties", excessNew.length);

for (const x of overlap) {
  if (newIncassoMap[x] !== oldIncassoMap[x]) {
    console.log(
      `Het bedrag klopt niet voor machtigingskenmerk ${x} (is ${newIncassoMap[x]}, moet zijn ${oldIncassoMap[x]})`
    );
  }
}

console.log();
console.log("Machtigingskenmerken van missende transacties:");
console.log(JSON.stringify(excessOld));

console.log();
console.log("Machtigingskenmerken van extra transacties:");
console.log(JSON.stringify(excessNew));
