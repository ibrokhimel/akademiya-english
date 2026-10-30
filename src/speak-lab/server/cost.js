// The month's spending, as an estimate: one line per talk in logs/ledger.json, summed for the current month.
import fs from 'node:fs';
import path from 'node:path';
import { estimateCost } from '../rules.js';
import { CFG } from '../config.js';

export function ledger(dir) {
  const file = path.join(dir, 'ledger.json');
  const read = () => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return { talks: [] }; } };
  const month = () => new Date().toISOString().slice(0, 7);
  return {
    // add({ id, secIn, secOut }) -> { cost, monthTotal }
    add({ id, secIn = 0, secOut = 0 }) {
      const cost = estimateCost(secIn, secOut, CFG.PRICE), data = read();
      data.talks.push({ id, at: new Date().toISOString(), secIn, secOut, cost });
      fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(file, JSON.stringify(data, null, 1));
      return { cost, monthTotal: this.monthTotal() };
    },
    monthTotal() { const m = month(); return Math.round(read().talks.filter((t) => t.at.startsWith(m)).reduce((s, t) => s + (t.cost || 0), 0) * 1e6) / 1e6; },
  };
}
