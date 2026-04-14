let chart;

function simular() {
    const boton = document.querySelector("button");

    const I0 = parseFloat(document.getElementById("I0").value);
    const beta = parseFloat(document.getElementById("beta").value);
    const t_max = parseFloat(document.getElementById("t_max").value);

    if (I0 <= 0 || t_max <= 0) {
        alert("Ingrese valores válidos");
        return;
    }

    // 🔥 AQUÍ VA (cuando inicia la simulación)
    boton.classList.add("loading");
    boton.innerText = " Simulando...";

    fetch('/simular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ I0, beta, t_max })
    })
    .then(res => res.json())
    .then(data => {
        graficar(data.t, data.analitica, data.numerica);
    })
    .finally(() => {
        // 🔙 AQUÍ SE QUITA cuando termina
        boton.classList.remove("loading");
        boton.innerText = "Simular";
    });
}

function graficar(t, analitica, numerica) {
    const ctx = document.getElementById('grafica').getContext('2d');

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: t,
            datasets: [
                {
                    label: 'Solución Analítica',
                    data: analitica,
                    borderWidth: 2
                },
                {
                    label: 'Solución Numérica (Euler)',
                    data: numerica,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Tiempo' } },
                y: { title: { display: true, text: 'Infectados' } }
            }
        }
    });
}