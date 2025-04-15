// A4-Bayes-Simulation/main.js
    const ctx = document.getElementById('bayesChart').getContext('2d');
    let chart;

    function normalPDF(x, mu, sigma) {
      return (1 / (sigma * Math.sqrt(2 * Math.PI))) *
             Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
    }

    function gammaPDF(x, alpha, beta) {
      if (x <= 0) return 0;
      return (Math.pow(beta, alpha) * Math.pow(x, alpha - 1) * Math.exp(-beta * x)) /
             math.gamma(alpha);
    }

    function updateChart() {
      const mu = parseFloat(document.getElementById('mu').value);
      const sigma = parseFloat(document.getElementById('sigma').value);
      const alpha = parseFloat(document.getElementById('alpha').value);
      const beta = parseFloat(document.getElementById('beta').value);

      document.getElementById('mu_val').textContent = mu.toFixed(1);
      document.getElementById('sigma_val').textContent = sigma.toFixed(1);
      document.getElementById('alpha_val').textContent = alpha.toFixed(1);
      document.getElementById('beta_val').textContent = beta.toFixed(1);

      const x = [];
      const yNorm = [];
      const yGamma = [];
      const minY = [];
      const step = 0.05;
      let errorSum = 0;

      for (let i = 0; i <= 200; i++) {
        const xi = parseFloat((i * step).toFixed(2)); // Round to nearest 2nd decimal
        const normVal = normalPDF(xi, mu, sigma);
        const gammaVal = gammaPDF(xi, alpha, beta);
        const minVal = Math.min(normVal, gammaVal);

        x.push(xi);
        yNorm.push(normVal);
        yGamma.push(gammaVal);
        minY.push(minVal);
        errorSum += minVal * step;
      }

      document.getElementById("errorRate").textContent =
        `Bayes Error Rate: ${errorSum.toFixed(4)}`;

      if (!chart) {
        chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: x,
            datasets: [
              {
                label: 'Normal PDF',
                data: yNorm,
                borderColor: 'blue',
                fill: false
              },
              {
                label: 'Gamma PDF',
                data: yGamma,
                borderColor: 'green',
                fill: false
              },
              {
                label: 'Overlap (Error Region)',
                data: minY,
                backgroundColor: 'rgba(255,165,0,0.4)',
                borderWidth: 0,
                fill: 'origin',
                pointRadius: 0
              }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: true
              }
            },
            scales: {
              x: {
                title: { display: true, text: 'x' }
              },
              y: {
                title: { display: true, text: 'Density' },
                beginAtZero: true
              }
            },
            animation: {
              duration: 1000, // 1 second animation duration
              easing: 'easeOutQuart' // Smooth easing for the animation
            }
          }
        });
      } else {
        chart.data.labels = x;
        chart.data.datasets[0].data = yNorm;
        chart.data.datasets[1].data = yGamma;
        chart.data.datasets[2].data = minY;
        chart.update();
      }
    }

    // Set up event listeners
    ['mu', 'sigma', 'alpha', 'beta'].forEach(id => {
      document.getElementById(id).addEventListener('input', updateChart);
    });

    // Initial draw
    updateChart();