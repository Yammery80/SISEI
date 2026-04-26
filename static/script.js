let chart;

function simular() {
    const botton = document.querySelector("#simularBtn");
    const textButton = botton.querySelector(".button__text");

    const I0 = parseFloat(document.getElementById("I0").value);
    const beta = parseFloat(document.getElementById("beta").value);
    const t_max = parseFloat(document.getElementById("t_max").value);

    if (I0 <= 0 || t_max <= 0) {
        alert("Ingrese valores válidos");
        return;
    }

    // AQUÍ VA (cuando inicia la simulación)
    botton.classList.add("loading");
    if (textButton) {
        textButton.innerText = "Simulando...";
    }

    fetch('/simular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ I0, beta, t_max })
    })
    .then(res => res.json())
    .then(data => {
        graficar(data.t, data.analitica, data.numerica);
        const final = data.analitica[data.analitica.length - 1];

        if (final > 10000) {
            mostrarModal(
            "🚨 Nivel Crítico de Propagación🚨",
            "El modelo indica un crecimiento exponencial fuera de control.\n\n" +
            " La tasa de contagio ha superado los niveles seguros.\n" +
            " El sistema sanitario podría colapsar en poco tiempo.\n\n" +
            "Se recomienda activar protocolos de contención inmediata y medidas de emergencia."
            );
        } 
        else if (final > 1000) {
            mostrarModal(
            "⚠️ Riesgo Elevado de Expansión",
            "La propagación del virus muestra una tendencia acelerada.\n\n" +
            " El brote aún puede ser contenido, pero el margen de acción es limitado.\n\n" +
            "Se recomienda intensificar medidas preventivas y monitoreo continuo."
            );
        } 
        else {
            mostrarModal(
            "🟢 Propagación Bajo Control",
            "El crecimiento del virus se mantiene dentro de parámetros manejables.\n\n" +
            " Existe una ventana de oportunidad para desarrollar soluciones.\n\n" +
            "Sin embargo, se recomienda vigilancia constante para evitar cambios inesperados."
            );
        }
    })
    .finally(() => {
        //  AQUÍ SE QUITA cuando termina
        botton.classList.remove("loading");
        if (textButton) {
            textButton.innerText = "SIMULAR";
        }
    });
}

function graficar(t, analitica, numerica) {
    const ctx = document.getElementById('grafica').getContext('2d');

    if (chart) chart.destroy();

    // Gradiente azul elegante
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(42, 127, 186, 0.4)");
    gradient.addColorStop(1, "rgba(42, 127, 186, 0)");

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: t,
            datasets: [
                {
                    label: 'Modelo Analítico',
                    data: analitica,
                    borderColor: "#2A7FBA",
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4, // curva suave
                    pointRadius: 0,
                    borderWidth: 3
                },
                {
                    label: 'Modelo Numérico',
                    data: numerica,
                    borderColor: "#1E3A5F",
                    borderDash: [6, 4], // línea discontinua elegante
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 2,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                mode: 'nearest',
                intersect: false
            },

            plugins: {
                legend: {
                    labels: {
                        color: "#1E3A5F",
                        font: {
                            size: 13,
                            weight: "bold"
                        }
                    }
                },
                tooltip: {
                    backgroundColor: "#1E3A5F",
                    titleColor: "#fff",
                    bodyColor: "#fff",
                    padding: 10,
                    cornerRadius: 8
                }
            },

            scales: {
                x: {
                    grid: {
                        color: "rgba(0,0,0,0.05)"
                    },
                    ticks: {
                        color: "#555"
                    }
                },
                y: {
                    grid: {
                        color: "rgba(0,0,0,0.05)"
                    },
                    ticks: {
                        color: "#555"
                    }
                }
            },

            onHover: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;

                    document.getElementById("tiempo").innerText = t[index].toFixed(2);
                    document.getElementById("val_analitica").innerText = analitica[index].toFixed(2);
                    document.getElementById("val_numerica").innerText = numerica[index].toFixed(2);
                }
            }
        }
    });
}

function mostrarModal(titulo, mensaje) {
    const modal = document.getElementById("modal");
    const title = document.getElementById("modalTitle");
    const text = document.getElementById("modalText");

    title.innerText = titulo;
    text.innerText = mensaje;

    modal.style.display = "block";
}

// Esperar a que cargue el DOM
document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("modal");
    const closeBtn = document.getElementById("closeModal");

    // Cerrar con botón X
    closeBtn.onclick = () => {
        modal.style.display = "none";
    };

    // Cerrar haciendo clic fuera
    window.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    };

    //  MOSTRAR SIEMPRE AL RECARGAR
    mostrarModal(
    "  Protocolo de Emergencia ",
    "Se ha detectado un nuevo agente patógeno de alta transmisibilidad.\n\n" +
    "El sistema de simulación epidemiológica ha sido habilitado para analizar escenarios de propagación.\n\n" +
    " Parámetros requeridos:\n" +
    "• I₀ → Casos iniciales detectados\n" +
    "• β → Tasa de propagación (nivel de contagio)\n" +
    "• Tiempo → Horizonte de análisis en días\n\n" +
    "⚠️ Tu objetivo es evaluar el comportamiento del brote y anticipar riesgos.\n\n" +
    "Cada decisión puede ser crucial para contener la propagación."
    );
});

const container = document.getElementById('data-container');

async function cargarSimulacion() {

  try {
    // Simular el cálculo matemático (2 segundos)
    const resultados = await miModeloMatematico.ejecutar();

    // 2. Reemplazar el skeleton con los datos reales
    container.innerHTML = `
      <div class="real-card">
        <img src="icon-analitica.png" />
        <span>Analítica</span>
        <span class="value">${resultados.valor}</span>
      </div>
    `;
  } catch (error) {
    console.error("Error en la simulación", error);
  }
}
document.getElementById('searchBtn').addEventListener('click', async () => {
    const ciudadNombre = document.getElementById('cityInput').value;

    if (!ciudadNombre) {
        alert("Escribe el nombre de una ciudad");
        return;
    }

    try {
        // 1. Llamada a tu API de Flask
        const response = await fetch(`/api/buscar_ciudad?nombre=${encodeURIComponent(ciudadNombre)}`);
        
        // --- VALIDACIÓN CRÍTICA ---
        // Si el servidor responde 404 o 500, no intentamos parsear JSON
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); 
            alert(errorData.error || "No se encontró la ciudad en la base de datos.");
            return;
        }

        const data = await response.json();

        // 2. Transferencia automática e inmediata al input I0
        const inputI0 = document.getElementById('I0');
        if (inputI0) {
            inputI0.value = data.poblacion;
            
            // Efecto visual de "flash" para indicar que el valor cambió
            inputI0.style.transition = "background-color 0.3s";
            inputI0.style.backgroundColor = "#d4edda"; 
            setTimeout(() => inputI0.style.backgroundColor = "white", 500);
        }

        // 3. Actualizamos los textos visuales
        const nameElem = document.getElementById('cityName');
        const popElem = document.getElementById('cityPop');
        
        if (nameElem) nameElem.innerText = data.nombre;
        if (popElem) popElem.innerText = data.poblacion.toLocaleString();

        // 4. DISPARO AUTOMÁTICO DE LA SIMULACIÓN
        // Asegúrate de que la función simular() esté definida en tu script
        if (typeof simular === "function") {
            simular();
        }

    } catch (error) {
        console.error("Error detectado:", error);
        alert("Error crítico: El servidor no envió una respuesta válida.");
    }
});