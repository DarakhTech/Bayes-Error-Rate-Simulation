// script.js
const distributions = {
  continuous: ["Uniform", "Normal", "Gamma", "Exponential", "Pareto", "Beta"],
  discrete: ["Uniform", "Bernoulli", "Binomial", "Hypergeometric", "Geometric", "Negative Binomial", "Poisson"]
};

const parameterConfigs = {
  Uniform: ["a", "b"],
  Normal: ["mu", "sigma"],
  Gamma: ["alpha", "beta"],
  Exponential: ["lambda"],
  Pareto: ["xm", "alpha"],
  Beta: ["alpha", "beta"],
  Bernoulli: ["p"],
  Binomial: ["n", "p"],
  Hypergeometric: ["N", "K", "n"],
  Geometric: ["p"],
  "Negative Binomial": ["r", "p"],
  Poisson: ["lambda"]
};

const formulas = {
  Normal: "f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} \\exp\\left(-\\frac{1}{2} \\left(\\frac{x-\\mu}{\\sigma}\\right)^2\\right)",
  Exponential: "f(x) = \\lambda \\exp(-\\lambda x),\\quad x \\geq 0",
  Gamma: "f(x) = \\frac{\\beta^{\\alpha} x^{\\alpha-1} e^{-\\beta x}}{\\Gamma(\\alpha)}",
  Beta: "f(x) = \\frac{x^{\\alpha-1}(1-x)^{\\beta-1}}{B(\\alpha,\\beta)}",
  Uniform: "f(x) = \\frac{1}{b-a},\\quad a \\leq x \\leq b"
};

let pdfChart, cdfChart;

function updateDistributionList(index) {
  const type = document.getElementById(`type${index}`).value;
  const distDropdown = document.getElementById(`dist${index}`);
  distDropdown.innerHTML = "";
  distributions[type].forEach(dist => {
    const opt = document.createElement("option");
    opt.value = dist;
    opt.textContent = dist;
    distDropdown.appendChild(opt);
  });
  updateParameters(index);
}

function updateParameters(index) {
  const dist = document.getElementById(`dist${index}`).value;
  const paramDiv = document.getElementById(`params${index}`);
  paramDiv.innerHTML = "";
  const params = parameterConfigs[dist];
  params.forEach(param => {
    const label = document.createElement("label");
    label.textContent = `${param}:`;
    const slider = document.createElement("input");
    slider.type = "range";
    // Custom slider settings by parameter
    let min = 0.01, max = 20, step = 0.01, value = 1;
    if (["n", "N", "K", "r"].includes(param)) {
      min = 1; max = 100; step = 1; value = 10;
    }
    if (["a", "b", "xm", "mu", "alpha", "beta", "sigma", "lambda"].includes(param)) {
      min = 0.01; max = 20; step = 0.01; value = 1;
    }
    if (["p"].includes(param)) {
      min = 0.01; max = 1; step = 0.01; value = 0.5;
    }
    // For Beta, restrict alpha/beta to >0.1 for stability
    if ((dist === "Beta" || dist === "Gamma") && (param === "alpha" || param === "beta")) {
      min = 0.1; max = 10; step = 0.01; value = 2;
    }
    // For Uniform, allow a < b
    if (dist === "Uniform" && param === "a") {
      min = 0; max = 10; step = 1; value = 0;
    }
    if (dist === "Uniform" && param === "b") {
      min = 1; max = 20; step = 1; value = 10;
    }
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;
    slider.id = `param_${param}${index}`;
    const valueSpan = document.createElement("span");
    valueSpan.textContent = slider.value;
    slider.oninput = () => {
      valueSpan.textContent = slider.value;
      drawGraphs();
    };
    paramDiv.appendChild(label);
    paramDiv.appendChild(slider);
    paramDiv.appendChild(valueSpan);
    paramDiv.appendChild(document.createElement("br"));
  });

  const formulaDiv = document.getElementById(`formula${index}`);
  if (formulas[dist]) {
    formulaDiv.innerHTML = `<span class=\"math-formula\">$$${formulas[dist]}$$</span>`;
    if (window.MathJax && window.MathJax.typeset) {
      MathJax.typeset([formulaDiv]);
    }
  } else {
    formulaDiv.innerHTML = '';
  }
  drawGraphs();
}

// function erf(x) {
//   if (typeof x !== 'number' || isNaN(x)) {
//     return NaN;
//   }
//   const ERF_A = 0.147;
//   const sign = x >= 0 ? 1 : -1;
//   x = Math.abs(x);
//   const onePlusAxSqrd = 1 + ERF_A * x * x;
//   const fourOvrPiEtc = (4 / Math.PI) + ERF_A * x * x;
//   const ratio = fourOvrPiEtc / onePlusAxSqrd;
//   const expofun = Math.exp(-x * x * ratio);
//   const radical = Math.sqrt(1 - expofun);
//   return sign * radical;
// }

function erf(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function normalPDF(x, mu, sigma) {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
}

function normalCDF(x, mu, sigma) {
  return 0.5 * (1 + erf((x - mu) / (sigma * Math.sqrt(2))));
}

function bernoulliPMF(x, p) {
  return (x === 0) ? 1 - p : (x === 1) ? p : 0;
}
function bernoulliCDF(x, p) {
  if (x < 0) return 0;
  if (x < 1) return 1 - p;
  return 1;
}
function binomialPMF(x, n, p) {
  if (x < 0 || x > n) return 0;
  return combination(n, x) * Math.pow(p, x) * Math.pow(1 - p, n - x);
}
function binomialCDF(x, n, p) {
  let sum = 0;
  for (let k = 0; k <= x; k++) sum += binomialPMF(k, n, p);
  return sum;
}
function geometricPMF(x, p) {
  return (x < 1) ? 0 : Math.pow(1 - p, x - 1) * p;
}
function geometricCDF(x, p) {
  return (x < 1) ? 0 : 1 - Math.pow(1 - p, x);
}
function negBinomialPMF(x, r, p) {
  if (x < r) return 0;
  return combination(x - 1, r - 1) * Math.pow(p, r) * Math.pow(1 - p, x - r);
}
function negBinomialCDF(x, r, p) {
  let sum = 0;
  for (let k = r; k <= x; k++) sum += negBinomialPMF(k, r, p);
  return sum;
}
function poissonPMF(x, lambda) {
  return (x < 0) ? 0 : Math.pow(lambda, x) * Math.exp(-lambda) / factorial(x);
}
function poissonCDF(x, lambda) {
  let sum = 0;
  for (let k = 0; k <= x; k++) sum += poissonPMF(k, lambda);
  return sum;
}
function hypergeometricPMF(x, N, K, n) {
  if (x < 0 || x > K || x > n || n > N) return 0;
  return combination(K, x) * combination(N - K, n - x) / combination(N, n);
}
function hypergeometricCDF(x, N, K, n) {
  let sum = 0;
  for (let k = 0; k <= x; k++) sum += hypergeometricPMF(k, N, K, n);
  return sum;
}
function discreteUniformPMF(x, a, b) {
  if (x < a || x > b) return 0;
  return 1 / (b - a + 1);
}
function discreteUniformCDF(x, a, b) {
  if (x < a) return 0;
  if (x > b) return 1;
  return (Math.floor(x) - a + 1) / (b - a + 1);
}
function combination(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let res = 1;
  for (let i = 1; i <= k; i++) res *= (n - i + 1) / i;
  return res;
}

function drawGraphs() {
  // Get both distributions and their types
  const dist1 = document.getElementById("dist1").value;
  const dist2 = document.getElementById("dist2").value;
  const type1 = distributions.continuous.includes(dist1) ? "continuous" : "discrete";
  const type2 = distributions.continuous.includes(dist2) ? "continuous" : "discrete";
  const param1 = id => parseFloat(document.getElementById(`param_${id}1`)?.value || 1);
  const param2 = id => parseFloat(document.getElementById(`param_${id}2`)?.value || 1);

  // Error handling for invalid parameters
  let errorMsg = '';
  // Uniform: a < b
  if (dist1 === 'Uniform' && param1('a') >= param1('b')) errorMsg += 'Distribution 1: a must be less than b.\n';
  if (dist2 === 'Uniform' && param2('a') >= param2('b')) errorMsg += 'Distribution 2: a must be less than b.\n';
  // Sigma, lambda, xm, alpha, beta > 0
  if (dist1 === 'Normal' && param1('sigma') <= 0) errorMsg += 'Distribution 1: sigma must be > 0.\n';
  if (dist2 === 'Normal' && param2('sigma') <= 0) errorMsg += 'Distribution 2: sigma must be > 0.\n';
  if (dist1 === 'Exponential' && param1('lambda') <= 0) errorMsg += 'Distribution 1: lambda must be > 0.\n';
  if (dist2 === 'Exponential' && param2('lambda') <= 0) errorMsg += 'Distribution 2: lambda must be > 0.\n';
  if (dist1 === 'Pareto' && (param1('xm') <= 0 || param1('alpha') <= 0)) errorMsg += 'Distribution 1: xm and alpha must be > 0.\n';
  if (dist2 === 'Pareto' && (param2('xm') <= 0 || param2('alpha') <= 0)) errorMsg += 'Distribution 2: xm and alpha must be > 0.\n';
  if (dist1 === 'Gamma' && (param1('alpha') <= 0 || param1('beta') <= 0)) errorMsg += 'Distribution 1: alpha and beta must be > 0.\n';
  if (dist2 === 'Gamma' && (param2('alpha') <= 0 || param2('beta') <= 0)) errorMsg += 'Distribution 2: alpha and beta must be > 0.\n';
  if (dist1 === 'Beta' && (param1('alpha') <= 0 || param1('beta') <= 0)) errorMsg += 'Distribution 1: alpha and beta must be > 0.\n';
  if (dist2 === 'Beta' && (param2('alpha') <= 0 || param2('beta') <= 0)) errorMsg += 'Distribution 2: alpha and beta must be > 0.\n';
  // Discrete: n, N, K, r, etc. should be integer and > 0
  if (dist1 === 'Binomial' && param1('n') < 1) errorMsg += 'Distribution 1: n must be >= 1.\n';
  if (dist2 === 'Binomial' && param2('n') < 1) errorMsg += 'Distribution 2: n must be >= 1.\n';
  if (dist1 === 'Negative Binomial' && param1('r') < 1) errorMsg += 'Distribution 1: r must be >= 1.\n';
  if (dist2 === 'Negative Binomial' && param2('r') < 1) errorMsg += 'Distribution 2: r must be >= 1.\n';
  if (dist1 === 'Hypergeometric' && (param1('N') < 1 || param1('K') < 1 || param1('n') < 1)) errorMsg += 'Distribution 1: N, K, n must be >= 1.\n';
  if (dist2 === 'Hypergeometric' && (param2('N') < 1 || param2('K') < 1 || param2('n') < 1)) errorMsg += 'Distribution 2: N, K, n must be >= 1.\n';
  // Additional parameter validation
  // Probabilities (p) for Bernoulli, Binomial, Geometric, Negative Binomial: 0 < p <= 1
  function isProb(p) { return typeof p === 'number' && p > 0 && p <= 1; }
  // Poisson: lambda > 0
  if (dist1 === 'Poisson' && param1('lambda') <= 0) errorMsg += 'Distribution 1: lambda must be > 0.\n';
  if (dist2 === 'Poisson' && param2('lambda') <= 0) errorMsg += 'Distribution 2: lambda must be > 0.\n';
  // Bernoulli
  if (dist1 === 'Bernoulli' && !isProb(param1('p'))) errorMsg += 'Distribution 1: p must be in (0, 1].\n';
  if (dist2 === 'Bernoulli' && !isProb(param2('p'))) errorMsg += 'Distribution 2: p must be in (0, 1].\n';
  // Binomial
  if (dist1 === 'Binomial' && !isProb(param1('p'))) errorMsg += 'Distribution 1: p must be in (0, 1].\n';
  if (dist2 === 'Binomial' && !isProb(param2('p'))) errorMsg += 'Distribution 2: p must be in (0, 1].\n';
  // Geometric
  if (dist1 === 'Geometric' && !isProb(param1('p'))) errorMsg += 'Distribution 1: p must be in (0, 1].\n';
  if (dist2 === 'Geometric' && !isProb(param2('p'))) errorMsg += 'Distribution 2: p must be in (0, 1].\n';
  // Negative Binomial
  if (dist1 === 'Negative Binomial' && !isProb(param1('p'))) errorMsg += 'Distribution 1: p must be in (0, 1].\n';
  if (dist2 === 'Negative Binomial' && !isProb(param2('p'))) errorMsg += 'Distribution 2: p must be in (0, 1].\n';
  // Uniform (discrete): a < b
  if (dist1 === 'Uniform' && param1('a') >= param1('b')) errorMsg += 'Distribution 1: a must be less than b.\n';
  if (dist2 === 'Uniform' && param2('a') >= param2('b')) errorMsg += 'Distribution 2: a must be less than b.\n';
  // All parameter values must be numbers (not NaN)
  function checkNaN(dist, param, idx) {
    const params = parameterConfigs[dist];
    if (!params) return '';
    for (let i = 0; i < params.length; i++) {
      const v = param(params[i]);
      if (isNaN(v)) return `Distribution ${idx}: parameter ${params[i]} is not a number.\n`;
    }
    return '';
  }
  errorMsg += checkNaN(dist1, param1, 1);
  errorMsg += checkNaN(dist2, param2, 2);
  // Show error and skip plotting if any
  let errorDiv = document.getElementById('error-message');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.style.color = 'red';
    errorDiv.style.fontWeight = 'bold';
    errorDiv.style.margin = '10px 0';
    document.body.insertBefore(errorDiv, document.body.firstChild);
  }
  errorDiv.textContent = errorMsg;
  if (errorMsg) {
    if (pdfChart) pdfChart.destroy();
    if (cdfChart) cdfChart.destroy();
    return;
  }

  // Determine x range (union of both, dynamic for continuous)
  let x = [], x_cont = [], x_disc = [];
  let min = 0, max = 20, step = 0.1;
  // Find x ranges for each distribution
  function getXRange(dist, type, param) {
    let min = 0, max = 20;
    if (type === "discrete") {
      if (dist === "Bernoulli") { min = 0; max = 1; }
      if (dist === "Binomial") { min = 0; max = Math.max(1, Math.floor(param("n"))); }
      if (dist === "Geometric") { min = 1; max = 20; }
      if (dist === "Negative Binomial") {
        min = Math.max(1, Math.floor(param("r")));
        const r = Math.max(1, Math.floor(param("r")));
        const p = param("p");
        const mean = r / p;
        const stddev = Math.sqrt(r * (1 - p) / (p * p));
        max = Math.ceil(mean + 4 * stddev);
        if (!isFinite(max) || max < min) max = min + 20;
      }
      if (dist === "Poisson") {
        const lambda = param("lambda");
        min = 0;
        max = Math.ceil(lambda + 4 * Math.sqrt(lambda));
        if (!isFinite(max) || max < min) max = 20;
      }
      if (dist === "Hypergeometric") {
        const K = Math.floor(param("K")), n = Math.floor(param("n"));
        min = 0;
        max = Math.min(K, n);
      }
      if (dist === "Uniform") {
        const a = Math.floor(param("a")), b = Math.floor(param("b"));
        min = Math.min(a, b);
        max = Math.max(a, b);
      }
    } else {
      if (dist === "Normal") {
        const mu = param("mu"), sigma = param("sigma");
        min = mu - 4 * sigma;
        max = mu + 4 * sigma;
        min = Math.max(min, -100);
        max = Math.min(max, 100);
      } else if (dist === "Exponential") {
        min = 0;
        max = 8 / (param("lambda") || 1);
        max = Math.min(max, 100);
      } else if (dist === "Gamma") {
        min = 0;
        max = Math.max(8, param("alpha") * 4 / (param("beta") || 1));
        max = Math.min(max, 100);
      } else if (dist === "Beta") {
        min = 0; max = 1;
      } else if (dist === "Pareto") {
        min = param("xm");
        max = min + 8 * (param("xm") || 1);
        max = Math.min(max, 100);
      } else if (dist === "Uniform") {
        min = param("a");
        max = param("b");
        if (min > max) [min, max] = [max, min];
      }
    }
    return {min, max};
  }
  // Get x ranges for both
  const range1 = getXRange(dist1, type1, param1);
  const range2 = getXRange(dist2, type2, param2);
  min = Math.min(range1.min, range2.min);
  max = Math.max(range1.max, range2.max);
  // Clamp
  min = Math.max(min, -100);
  max = Math.min(max, 1000);
  // For mixed: always generate both integer and fine grid
  if (type1 === "continuous" || type2 === "continuous") {
    // Fine grid for continuous
    let fineStep = (dist1 === "Beta" || dist2 === "Beta") ? 0.01 : 0.1;
    for (let i = min; i <= max; i += fineStep) x_cont.push(Number(i.toFixed(5)));
  }
  if (type1 === "discrete" || type2 === "discrete") {
    for (let i = Math.ceil(min); i <= Math.floor(max); i++) x_disc.push(i);
  }
  // Union of all x values, sorted and unique
  x = Array.from(new Set([...x_cont, ...x_disc])).sort((a, b) => a - b);

  // Helper to get PDF/PMF and CDF for a given dist/param/x/type
  function getDistVals(dist, param, type, xvals) {
    let pdf = [], cdf = [];
    xvals.forEach(val => {
      let p = 0, c = 0;
      switch (dist) {
        case "Normal": {
          const mu = param("mu"), sigma = param("sigma");
          p = normalPDF(val, mu, sigma);
          c = normalCDF(val, mu, sigma);
          break;
        }
        case "Exponential": {
          const lambda = param("lambda");
          p = lambda * Math.exp(-lambda * val);
          c = 1 - Math.exp(-lambda * val);
          break;
        }
        case "Gamma": {
          const alpha = param("alpha"), beta = param("beta");
          p = Math.pow(beta, alpha) * Math.pow(val, alpha - 1) * Math.exp(-beta * val) / gamma(alpha);
          c = gammaCDF(val, alpha, beta);
          break;
        }
        case "Beta": {
          const a = param("alpha"), b = param("beta");
          if (val >= 0 && val <= 1) {
            p = Math.pow(val, a - 1) * Math.pow(1 - val, b - 1) / betaFunc(a, b);
            c = betaCDF(val, a, b);
          } else {
            p = c = 0;
          }
          break;
        }
        case "Uniform": {
          if (type === "continuous") {
            const a = param("a"), b = param("b");
            p = (val >= a && val <= b) ? 1 / (b - a) : 0;
            c = (val < a) ? 0 : (val > b) ? 1 : (val - a) / (b - a);
          } else {
            const a = Math.floor(param("a")), b = Math.floor(param("b"));
            p = discreteUniformPMF(val, a, b);
            c = discreteUniformCDF(val, a, b);
          }
          break;
        }
        case "Bernoulli": {
          const pval = param("p");
          p = bernoulliPMF(val, pval);
          c = bernoulliCDF(val, pval);
          break;
        }
        case "Binomial": {
          const n = Math.floor(param("n")), pval = param("p");
          p = binomialPMF(val, n, pval);
          c = binomialCDF(val, n, pval);
          break;
        }
        case "Geometric": {
          const pval = param("p");
          p = geometricPMF(val, pval);
          c = geometricCDF(val, pval);
          break;
        }
        case "Negative Binomial": {
          const r = Math.floor(param("r")), pval = param("p");
          p = negBinomialPMF(val, r, pval);
          c = negBinomialCDF(val, r, pval);
          break;
        }
        case "Poisson": {
          const lambda = param("lambda");
          p = poissonPMF(val, lambda);
          c = poissonCDF(val, lambda);
          break;
        }
        case "Hypergeometric": {
          const N = Math.floor(param("N")), K = Math.floor(param("K")), n = Math.floor(param("n"));
          p = hypergeometricPMF(val, N, K, n);
          c = hypergeometricCDF(val, N, K, n);
          break;
        }
        case "Pareto": {
          const xm = param("xm"), alpha = param("alpha");
          p = paretoPDF(val, xm, alpha);
          c = paretoCDF(val, xm, alpha);
          break;
        }
      }
      pdf.push(isNaN(p) ? 0 : p);
      cdf.push(isNaN(c) ? 0 : c);
    });
    return { pdf, cdf };
  }

  // Get values for both distributions at all x
  const vals1 = getDistVals(dist1, param1, type1, x);
  const vals2 = getDistVals(dist2, param2, type2, x);

  // Chart.js mixed type logic
  let pdfDatasets = [];
  if (type1 === "continuous" && type2 === "discrete") {
    pdfDatasets = [
      {
        type: 'line',
        label: dist1 + " PDF",
        data: vals1.pdf,
        borderWidth: 4,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.15)', // blue fill
        fill: 'origin', // area under curve
        pointRadius: 0,
        tension: 0.4, // smooth curve
        order: 1
      },
      {
        type: 'bar',
        label: dist2 + " PMF",
        data: vals2.pdf,
        borderWidth: 3,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderSkipped: false,
        borderRadius: 0,
        order: 2
      }
    ];
  } else if (type1 === "discrete" && type2 === "continuous") {
    pdfDatasets = [
      {
        type: 'bar',
        label: dist1 + " PMF",
        data: vals1.pdf,
        borderWidth: 3,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderSkipped: false,
        borderRadius: 0,
        order: 1
      },
      {
        type: 'line',
        label: dist2 + " PDF",
        data: vals2.pdf,
        borderWidth: 4,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.15)', // red fill
        fill: 'origin',
        pointRadius: 0,
        tension: 0.4,
        order: 2
      }
    ];
  } else if (type1 === "continuous" && type2 === "continuous") {
    pdfDatasets = [
      {
        type: 'line',
        label: dist1 + " PDF",
        data: vals1.pdf,
        borderWidth: 4,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.15)',
        fill: 'origin',
        pointRadius: 0,
        tension: 0.4,
        order: 1
      },
      {
        type: 'line',
        label: dist2 + " PDF",
        data: vals2.pdf,
        borderWidth: 4,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.15)',
        fill: 'origin',
        pointRadius: 0,
        tension: 0.4,
        order: 2
      }
    ];
  } else {
    // both discrete
    pdfDatasets = [
      {
        type: 'bar',
        label: dist1 + " PMF",
        data: vals1.pdf,
        borderWidth: 3,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderSkipped: false,
        borderRadius: 0,
        order: 1
      },
      {
        type: 'bar',
        label: dist2 + " PMF",
        data: vals2.pdf,
        borderWidth: 3,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderSkipped: false,
        borderRadius: 0,
        order: 2
      }
    ];
  }
  const pdfData = {
    labels: x,
    datasets: pdfDatasets
  };
  const pdfOptions = {
    responsive: true,
    plugins: { legend: { display: true } },
    animation: { duration: 1000, easing: 'easeOutQuart' },
    scales: {
      x: {
        ticks: {
          callback: function(value, index, values) {
            let label = this.getLabelForValue ? this.getLabelForValue(value) : value;
            let num = Number(label);
            return isNaN(num) ? label : num % 1 === 0 ? num : num.toFixed(2);
          }
        }
      }
    }
  };
  if (!pdfChart) {
    pdfChart = new Chart(pdfCanvas.getContext("2d"), {
      type: 'bar',
      data: pdfData,
      options: pdfOptions
    });
  } else {
    // Update labels in place
    pdfChart.data.labels.length = 0;
    pdfChart.data.labels.push(...x);
    // Update datasets in place
    pdfDatasets.forEach((newDs, i) => {
      if (pdfChart.data.datasets[i]) {
        Object.assign(pdfChart.data.datasets[i], newDs);
      } else {
        pdfChart.data.datasets.push({...newDs});
      }
    });
    pdfChart.data.datasets.length = pdfDatasets.length;
    pdfChart.update('active'); // Use 'active' mode for smooth transitions
  }

  // CDF Chart (always line, stepped for discrete)
  const cdfData = {
    labels: x,
    datasets: [
      {
        label: dist1 + " CDF",
        data: vals1.cdf,
        borderWidth: 3,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.15)',
        stepped: (type1 === "discrete"),
        fill: 'origin',
        pointRadius: 0,
        tension: (type1 === "continuous") ? 0.4 : 0
      },
      {
        label: dist2 + " CDF",
        data: vals2.cdf,
        borderWidth: 3,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.15)',
        stepped: (type2 === "discrete"),
        fill: 'origin',
        pointRadius: 0,
        tension: (type2 === "continuous") ? 0.4 : 0
      }
    ]
  };
  const cdfOptions = {
    responsive: true,
    plugins: { legend: { display: true } },
    animation: { duration: 1000, easing: 'easeOutQuart' },
    scales: {
      x: {
        ticks: {
          callback: function(value, index, values) {
            let label = this.getLabelForValue ? this.getLabelForValue(value) : value;
            let num = Number(label);
            return isNaN(num) ? label : num % 1 === 0 ? num : num.toFixed(2);
          }
        }
      }
    }
  };
  if (!cdfChart) {
    cdfChart = new Chart(cdfCanvas.getContext("2d"), {
      type: 'line',
      data: cdfData,
      options: cdfOptions
    });
  } else {
    // Update labels in place
    cdfChart.data.labels.length = 0;
    cdfChart.data.labels.push(...x);
    // Update datasets in place
    cdfData.datasets.forEach((newDs, i) => {
      if (cdfChart.data.datasets[i]) {
        Object.assign(cdfChart.data.datasets[i], newDs);
      } else {
        cdfChart.data.datasets.push({...newDs});
      }
    });
    cdfChart.data.datasets.length = cdfData.datasets.length;
    cdfChart.update('active'); // Use 'active' mode for smooth transitions
  }
}

function gamma(z) {
  let g = 7, C = [0.99999999999980993,676.5203681218851,-1259.1392167224028,
    771.32342877765313,-176.61502916214059,12.507343278686905,
    -0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  if(z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  z -= 1; let x = C[0];
  for (let i = 1; i < g + 2; i++) x += C[i] / (z + i);
  let t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

function betaFunc(a, b) {
  return gamma(a) * gamma(b) / gamma(a + b);
}

function betaCDF(x, a, b) {
  // Approximate CDF using cumulative trapezoid
  const dx = 0.01;
  let sum = 0;
  for (let i = 0; i <= x; i += dx) {
    sum += Math.pow(i, a - 1) * Math.pow(1 - i, b - 1);
  }
  return sum * dx / betaFunc(a, b);
}

function gammaCDF(x, alpha, beta) {
  let sum = 0, k = 0, term;
  do {
    term = Math.pow(beta * x, k) * Math.exp(-beta * x) / factorial(k);
    sum += term;
    k++;
  } while (term > 1e-8);
  return 1 - sum;
}

function paretoPDF(x, xm, alpha) {
  if (x < xm) return 0;
  return (alpha * Math.pow(xm, alpha)) / Math.pow(x, alpha + 1);
}

function paretoCDF(x, xm, alpha) {
  if (x < xm) return 0;
  return 1 - Math.pow(xm / x, alpha);
}

function factorial(n) {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

document.addEventListener("DOMContentLoaded", () => {
  updateDistributionList(1);
  updateDistributionList(2);
});