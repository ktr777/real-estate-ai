/**
 * 投資用不動産 収益計算ライブラリ
 */

/** IRR計算（ニュートン法） */
export function calcIRR(cashflows, guess = 0.1) {
  let rate = guess;
  for (let i = 0; i < 300; i++) {
    let npv = 0, dnpv = 0;
    cashflows.forEach((cf, t) => {
      const disc = Math.pow(1 + rate, t);
      npv += cf / disc;
      dnpv += (-t * cf) / (disc * (1 + rate));
    });
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-9) return newRate;
    rate = newRate;
  }
  return rate;
}

/** NPV計算 */
export function calcNPV(rate, cashflows) {
  return cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);
}

/** 月次返済額（元利均等） */
export function calcMonthlyPayment(principal, annualRate, years) {
  if (annualRate === 0) return principal / (years * 12);
  const r = annualRate / 12;
  const n = years * 12;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

/** 残債計算 */
export function calcRemainingLoan(principal, annualRate, totalYears, elapsedYears) {
  if (annualRate === 0) return principal * (1 - elapsedYears / totalYears);
  const r = annualRate / 12;
  const n = totalYears * 12;
  const m = elapsedYears * 12;
  return principal * (Math.pow(1 + r, n) - Math.pow(1 + r, m)) / (Math.pow(1 + r, n) - 1);
}

/**
 * メイン計算関数
 * @param {Object} p - パラメータ
 */
export function calculate(p) {
  // --- 収入計算 ---
  const grossRent = p.rentPerSqm * p.area * 12;
  const effectiveRent = grossRent * (1 - p.vacancyRate);

  // --- 運営費計算 ---
  const managementFee   = effectiveRent * 0.05;  // 管理費 5%
  const repairReserve   = p.price * 0.005;        // 修繕積立 0.5%/年
  const propertyTax     = p.price * 0.014 * 0.7;  // 固定資産税（路線価70%想定）
  const insurance       = p.price * 0.001;         // 損害保険
  const otherOpex       = effectiveRent * (p.opexRatio - 0.05); // その他
  const totalOpex       = managementFee + repairReserve + propertyTax + insurance + Math.max(0, otherOpex);
  const noi             = effectiveRent - totalOpex;
  const capRate         = noi / p.price;

  // --- 資金調達 ---
  const loanAmount   = p.price * p.ltv;
  const equity       = p.price * (1 - p.ltv);
  const acquisitionCost = p.price * 0.07; // 取得諸費用（仲介・登記・税等）
  const totalEquity  = equity + acquisitionCost;

  const monthlyPayment = calcMonthlyPayment(loanAmount, p.interestRate, p.loanYears);
  const annualDebt     = monthlyPayment * 12;
  const dscr           = noi / annualDebt;
  const fcf            = noi - annualDebt;

  // --- 出口 ---
  const exitPrice      = noi / p.exitCapRate;
  const remainingLoan  = calcRemainingLoan(loanAmount, p.interestRate, p.loanYears, p.holdYears);
  const transferTax    = Math.max(0, exitPrice - p.price) * 0.20; // 譲渡税（長期）
  const exitProceeds   = exitPrice - remainingLoan - transferTax;

  // --- IRR計算 ---
  const cashflows = [-totalEquity];
  for (let y = 1; y <= p.holdYears; y++) {
    cashflows.push(y < p.holdYears ? fcf : fcf + exitProceeds);
  }
  const irr = calcIRR(cashflows);
  const equityMultiple = (cashflows.slice(1).reduce((a, b) => a + b, 0) + totalEquity) / totalEquity;

  // --- 年次テーブル ---
  const yearlyData = [];
  let loanBal = loanAmount;
  let cumFCF   = -totalEquity;
  for (let y = 1; y <= p.holdYears; y++) {
    let interest = 0, principal = 0;
    for (let m = 0; m < 12; m++) {
      const r   = p.interestRate / 12;
      const int = loanBal * r;
      const pri = monthlyPayment - int;
      interest   += int;
      principal  += pri;
      loanBal    -= pri;
    }
    cumFCF += fcf;
    yearlyData.push({
      year: `${y}年目`,
      NOI: Math.round(noi),
      元利返済: Math.round(annualDebt),
      FCF: Math.round(fcf),
      利息: Math.round(interest),
      元本: Math.round(principal),
      残債: Math.round(loanBal),
      累積FCF: Math.round(cumFCF),
    });
  }

  // --- 感度分析 ---
  const sensitivityExitCap = [];
  for (let ec = 0.025; ec <= 0.10; ec += 0.005) {
    const ep = noi / ec;
    const rem = calcRemainingLoan(loanAmount, p.interestRate, p.loanYears, p.holdYears);
    const tax = Math.max(0, ep - p.price) * 0.20;
    const eProc = ep - rem - tax;
    const cfs = [-totalEquity];
    for (let y = 1; y <= p.holdYears; y++) cfs.push(y < p.holdYears ? fcf : fcf + eProc);
    sensitivityExitCap.push({
      exitCap: `${(ec * 100).toFixed(1)}%`,
      IRR: parseFloat((calcIRR(cfs) * 100).toFixed(2)),
    });
  }

  const sensitivityVacancy = [];
  for (let vac = 0; vac <= 0.35; vac += 0.025) {
    const er = grossRent * (1 - vac);
    const op = er * p.opexRatio + repairReserve + propertyTax + insurance;
    const n2 = er - op;
    const f  = n2 - annualDebt;
    const ep = n2 / p.exitCapRate;
    const rem = calcRemainingLoan(loanAmount, p.interestRate, p.loanYears, p.holdYears);
    const tax = Math.max(0, ep - p.price) * 0.20;
    const eProc = ep - rem - tax;
    const cfs = [-totalEquity];
    for (let y = 1; y <= p.holdYears; y++) cfs.push(y < p.holdYears ? f : f + eProc);
    sensitivityVacancy.push({
      空室率: `${(vac * 100).toFixed(0)}%`,
      IRR: parseFloat((calcIRR(cfs) * 100).toFixed(2)),
    });
  }

  const sensitivityRate = [];
  for (let rate = 0.005; rate <= 0.04; rate += 0.0025) {
    const mp  = calcMonthlyPayment(loanAmount, rate, p.loanYears);
    const ad  = mp * 12;
    const f   = noi - ad;
    const rem = calcRemainingLoan(loanAmount, rate, p.loanYears, p.holdYears);
    const ep  = noi / p.exitCapRate;
    const tax = Math.max(0, ep - p.price) * 0.20;
    const eProc = ep - rem - tax;
    const cfs = [-totalEquity];
    for (let y = 1; y <= p.holdYears; y++) cfs.push(y < p.holdYears ? f : f + eProc);
    sensitivityRate.push({
      金利: `${(rate * 100).toFixed(2)}%`,
      IRR: parseFloat((calcIRR(cfs) * 100).toFixed(2)),
    });
  }

  return {
    // 収益指標
    grossRent, effectiveRent, totalOpex, noi, capRate,
    // コスト内訳
    managementFee, repairReserve, propertyTax, insurance,
    // 資金
    loanAmount, equity, acquisitionCost, totalEquity,
    annualDebt, dscr, fcf,
    // 出口
    exitPrice, remainingLoan, transferTax, exitProceeds,
    // リターン
    irr, equityMultiple,
    // データ
    yearlyData, cashflows,
    sensitivityExitCap, sensitivityVacancy, sensitivityRate,
  };
}

/** 数値フォーマット */
export const fmt  = (n, d = 0) => new Intl.NumberFormat("ja-JP", { maximumFractionDigits: d }).format(n);
export const fmtM = (n) => `¥${fmt(Math.round(n / 10000))}万`;
export const fmtP = (n) => `${(n * 100).toFixed(2)}%`;
