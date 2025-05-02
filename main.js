const ctx = document.getElementById('bayesChart').getContext('2d');
let chart;

function normalPDF(x, mu, sigma) {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
}

function gammaPDF(x, alpha, beta) {
  if (x <= 0) return 0;
  return (Math.pow(beta, alpha) * Math.pow(x, alpha - 1) * Math.exp(-beta * x)) / math.gamma(alpha);
}

function betaPDF(x, alpha, beta) {
  if (x <= 0 || x >= 1) return 0;
  return (math.gamma(alpha + beta) / (math.gamma(alpha) * math.gamma(beta))) * Math.pow(x, alpha - 1) * Math.pow(1 - x, beta - 1);
}

function paretoPDF(x, alpha, xm) {
  if (x < xm) return 0;
  return (alpha * Math.pow(xm, alpha)) / Math.pow(x, alpha + 1);
}

function exponentialPDF(x, lambda) {
  if (x < 0) return 0;
  return lambda * Math.exp(-lambda * x);
}

function getPDF(distribution, x, param1, param2) {
  switch (distribution) {
    case 'normal':
      return normalPDF(x, param1, param2);
    case 'gamma':
      return gammaPDF(x, param1, param2);
    case 'beta':
      return betaPDF(x, param1, param2);
    case 'pareto':
      return paretoPDF(x, param1, param2);
    case 'exponential':
      return exponentialPDF(x, param1);
    default:
      return 0;
  }
}

function updateSelectedDistributionName(containerId, distribution) {
  const container = document.getElementById(containerId);
  const existingHeader = container.querySelector('h3');
  if (existingHeader) existingHeader.remove();
  const header = document.createElement('h3');
  header.textContent = `${distribution.charAt(0).toUpperCase() + distribution.slice(1)} Distribution`;
  container.prepend(header);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val.toFixed(2);
}

function updateChart() {
  const dist1 = document.getElementById('dist1')?.value;
  const dist2 = document.getElementById('dist2')?.value;

  const config1 = distributionConfigs[dist1];
  const config2 = distributionConfigs[dist2];

  const getParam = (containerId, paramId) => {
    const el = document.getElementById(`${containerId}_${paramId}`);
    return parseFloat(el?.value || 0);
  };

  const param1Dist1 = getParam('dist1-params', config1[0].id);
  const param2Dist1 = config1[1] ? getParam('dist1-params', config1[1].id) : null;
  const param1Dist2 = getParam('dist2-params', config2[0].id);
  const param2Dist2 = config2[1] ? getParam('dist2-params', config2[1].id) : null;

  setText(`dist1-params_${config1[0].id}_val`, param1Dist1);
  if (config1[1]) setText(`dist1-params_${config1[1].id}_val`, param2Dist1);
  setText(`dist2-params_${config2[0].id}_val`, param1Dist2);
  if (config2[1]) setText(`dist2-params_${config2[1].id}_val`, param2Dist2);


  let xStart = 0, xEnd = 10; // Defaults

  // Dynamic range depending on distribution
  const rangeByDist = {
    normal:  () => [param1Dist1 - 4 * param2Dist1, param1Dist1 + 4 * param2Dist1],
    gamma:   () => [0, Math.max(10, param1Dist1 / param2Dist1 * 5)],
    beta:    () => [0, 1],
    pareto:  () => [param2Dist1, param2Dist1 * 5],
    exponential: () => [0, 10 / param1Dist1]
  };

  try {
    const [start1, end1] = rangeByDist[dist1]();
    const [start2, end2] = rangeByDist[dist2]();
    xStart = Math.max(0, Math.min(start1, start2));
    xEnd = Math.max(end1, end2);
  } catch (e) {
    console.warn('Unable to auto-scale x-axis range:', e);
  }

  const step = (xEnd - xStart) / 200;
  const x = [], yDist1 = [], yDist2 = [], minY = [];
  let errorSum = 0;
  let maxPDF = 0;

  for (let i = 0; i <= 200; i++) {
    const xi = parseFloat((xStart + i * step).toFixed(3));
    const dist1Val = getPDF(dist1, xi, param1Dist1, param2Dist1);
    const dist2Val = getPDF(dist2, xi, param1Dist2, param2Dist2);
    const minVal = Math.min(dist1Val, dist2Val);
    x.push(xi);
    yDist1.push(dist1Val);
    yDist2.push(dist2Val);
    minY.push(minVal);
    errorSum += minVal * step;
    maxPDF = Math.max(maxPDF, dist1Val, dist2Val);
  }

  document.getElementById("errorRate").textContent = `Bayes Error Rate: ${errorSum.toFixed(4)}`;

  if (!chart) {
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: x,
        datasets: [
          { label: `${dist1.charAt(0).toUpperCase() + dist1.slice(1)} PDF`, data: yDist1, borderColor: 'blue', fill: false },
          { label: `${dist2.charAt(0).toUpperCase() + dist2.slice(1)} PDF`, data: yDist2, borderColor: 'green', fill: false },
          { label: 'Overlap (Error Region)', data: minY, backgroundColor: 'rgba(255,165,0,0.4)', borderWidth: 0, fill: 'origin', pointRadius: 0 }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: {
          x: { title: { display: true, text: 'x' } },
          y: { title: { display: true, text: 'Density' }, beginAtZero: true }
        },
        animation: { duration: 1000, easing: 'easeOutQuart' }
      }
    });
  } else {
    chart.data.labels = x;
    chart.data.datasets[0].label = `${dist1.charAt(0).toUpperCase() + dist1.slice(1)} PDF`;
    chart.data.datasets[0].data = yDist1;
    chart.data.datasets[1].label = `${dist2.charAt(0).toUpperCase() + dist2.slice(1)} PDF`;
    chart.data.datasets[1].data = yDist2;
    chart.data.datasets[2].data = minY;
    chart.update();
  }
}

const distributionConfigs = {
  normal: [
    { id: 'mu', label: 'μ (Normal Mean):', min: -3, max: 8, step: 0.1, value: 2 },         // Mean shift
    { id: 'sigma', label: 'σ (Normal Std Dev):', min: 0.2, max: 4, step: 0.1, value: 1 }   // Wider range of spread
  ],
  gamma: [
    { id: 'alpha', label: 'α (Gamma Shape):', min: 0.5, max: 10, step: 0.1, value: 2 },     // Shapes vary skew
    { id: 'beta', label: 'β (Gamma Rate):', min: 0.1, max: 5, step: 0.1, value: 1 }         // Rate affects tail decay
  ],
  beta: [
    { id: 'alpha', label: 'α (Beta Shape 1):', min: 0.1, max: 8, step: 0.1, value: 2 },     // To model uniform to peaked
    { id: 'beta', label: 'β (Beta Shape 2):', min: 0.1, max: 8, step: 0.1, value: 2 }
  ],
  pareto: [
    { id: 'alpha', label: 'α (Pareto Shape):', min: 1.01, max: 5, step: 0.1, value: 2 },    // <2: infinite variance
    { id: 'xm', label: 'xm (Pareto Scale):', min: 0.5, max: 4, step: 0.1, value: 1 }        // xm shifts start
  ],
  exponential: [
    { id: 'lambda', label: 'λ (Exponential Rate):', min: 0.1, max: 3, step: 0.1, value: 1 } // Higher λ = faster decay
  ]
};

function updateParameterSliders(distribution, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const config = distributionConfigs[distribution];
  config.forEach(param => {
    const fullId = `${containerId}_${param.id}`;

    const sliderGroup = document.createElement('div');
    sliderGroup.className = 'slider-group';

    const label = document.createElement('label');
    label.textContent = param.label;

    const input = document.createElement('input');
    input.type = 'range';
    input.id = fullId;
    input.min = param.min;
    input.max = param.max;
    input.step = param.step;
    input.value = param.value;
    input.addEventListener('input', updateChart);

    const valueSpan = document.createElement('span');
    valueSpan.className = 'value';
    valueSpan.id = `${fullId}_val`;
    valueSpan.textContent = param.value;

    sliderGroup.appendChild(label);
    sliderGroup.appendChild(input);
    sliderGroup.appendChild(valueSpan);
    container.appendChild(sliderGroup);
  });
}

function initializeDynamicSliders() {
  const dist1Select = document.getElementById('dist1');
  const dist2Select = document.getElementById('dist2');

  dist1Select.addEventListener('change', () => {
    updateParameterSliders(dist1Select.value, 'dist1-params');
    updateSelectedDistributionName('dist1-params', dist1Select.value);
    updateChart();
  });

  dist2Select.addEventListener('change', () => {
    updateParameterSliders(dist2Select.value, 'dist2-params');
    updateSelectedDistributionName('dist2-params', dist2Select.value);
    updateChart();
  });

  updateParameterSliders(dist1Select.value, 'dist1-params');
  updateSelectedDistributionName('dist1-params', dist1Select.value);
  updateParameterSliders(dist2Select.value, 'dist2-params');
  updateSelectedDistributionName('dist2-params', dist2Select.value);
}

document.addEventListener('DOMContentLoaded', () => {
  ['dist1', 'dist2'].forEach(id => {
    const element = document.getElementById(id);
    if (element) element.addEventListener('input', updateChart);
  });

  updateChart();
  initializeDynamicSliders();
});