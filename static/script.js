let chart;
let datosGlobales = null;
let escenariosFijados = []; // Capas de comparación (Punto 1)

// --- FUNCIÓN DE SIMULACIÓN ---
async function simular() {
    const botton = document.querySelector("#simularBtn");
    const textButton = botton ? botton.querySelector(".button__text") : null;

    const I0 = parseFloat(document.getElementById("I0").value) || 1;
    const beta = parseFloat(document.getElementById("beta").value) || 0.2;
    const t_max = parseFloat(document.getElementById("t_max").value) || 10;
    const factor = document.getElementById('quarantineLevel').value;
    const ciudad = document.getElementById('cityName').innerText;

    if (botton) botton.classList.add("loading");
    if (textButton) textButton.innerText = "Simulando...";

    try {
        const response = await fetch('/simular', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ i0: I0, beta: beta, tiempo: t_max, factor_cuarentena: factor, ciudad: ciudad })
        });

        datosGlobales = await response.json();
        graficar();
        
        const final = datosGlobales.analitica.slice(-1)[0];
        procesarAlertas(final);

    } catch (err) {
        console.error("Error en simulación:", err);
    } finally {
        if (botton) botton.classList.remove("loading");
        if (textButton) textButton.innerText = "SIMULAR";
    }
}

// --- FUNCIONALIDAD: FIJAR ESCENARIO (GHOST CURVES) ---
function guardarEscenario() {
    if (!datosGlobales) return alert("Primero realiza una simulación.");
    
    const beta = document.getElementById('beta').value;
    const factorTxt = document.getElementById('quarantineLevel').options[document.getElementById('quarantineLevel').selectedIndex].text;

    escenariosFijados.push({
        label: `Ref (β:${beta} - ${factorTxt})`,
        data: [...datosGlobales.analitica],
        borderColor: 'rgba(0, 0, 0, 0.2)',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false
    });
    
    graficar();
}

// --- FUNCIONALIDAD: EXPORTAR CSV ---
function descargarCSV() {
    if (!datosGlobales) return alert("No hay datos para exportar.");

    let csvContent = "data:text/csv;charset=utf-8,Dia,Analitica,Numerica_Euler\n";
    datosGlobales.t.forEach((val, i) => {
        csvContent += `${Math.round(val)},${datosGlobales.analitica[i]},${datosGlobales.numerica[i]}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sisei_reporte.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- RENDERIZADO DE GRÁFICA ---
function graficar() {
    const ctx = document.getElementById('grafica').getContext('2d');
    if (chart) chart.destroy();

    const datasets = [
        ...escenariosFijados,
        {
            label: 'Simulación Actual',
            data: datosGlobales.analitica,
            borderColor: '#1E3A5F',
            backgroundColor: 'rgba(30, 58, 95, 0.1)',
            borderWidth: 4,
            tension: 0.4,
            pointRadius: 0,
            fill: true
        }
    ];

    chart = new Chart(ctx, {
        type: 'line',
        data: { labels: datosGlobales.t.map(v => Math.round(v)), datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            // Solo actualizamos el panel lateral para la curva "Actual"
                            if (context.datasetIndex === datasets.length - 1) {
                                document.getElementById('tiempo').innerText = context.label + " días";
                                document.getElementById('val_analitica').innerText = Math.round(datosGlobales.analitica[context.dataIndex]).toLocaleString();
                                document.getElementById('val_numerica').innerText = Math.round(datosGlobales.numerica[context.dataIndex]).toLocaleString();
                            }
                            return `${context.dataset.label}: ${Math.round(context.parsed.y).toLocaleString()}`;
                        }
                    }
                }
            }
        }
    });
}

// --- BÚSQUEDA Y MODALES ---
const buscarCiudad = async () => {
    const nombre = document.getElementById('cityInput').value;
    if (!nombre) return;
    try {
        const res = await fetch(`/api/buscar_ciudad?nombre=${encodeURIComponent(nombre)}`);
        const data = await res.json();
        if (data.nombre) {
            document.getElementById('cityName').innerText = data.nombre;
            document.getElementById('cityPop').innerText = data.poblacion.toLocaleString();
            simular();
        } else { alert("Ciudad no encontrada."); }
    } catch (e) { console.error(e); }
};

function procesarAlertas(final) {
    if (final > 10000) mostrarModal("🚨 NIVEL CRÍTICO", "Riesgo de exterminio poblacional.", "modal-rojo");
    else if (final > 1000) mostrarModal("⚠️ Riesgo Elevado", "Expansión acelerada detectada.", "modal-amarillo");
    else mostrarModal("🟢 Bajo Control", "Crecimiento dentro de márgenes.", "modal-verde");
}

function mostrarModal(titulo, mensaje, claseColor = "") {
    const modal = document.getElementById("modal");
    document.getElementById("modalTitle").innerText = titulo;
    document.getElementById("modalText").innerText = mensaje;
    modal.querySelector(".modal-content").className = "modal-content " + claseColor;
    modal.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("closeModal").onclick = () => { document.getElementById("modal").style.display = "none"; };
    document.getElementById('searchBtn').onclick = buscarCiudad;
    document.getElementById('quarantineLevel').onchange = simular;
});