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
        const final = data.analitica[data.analitica.length - 1];

        // Lógica de Modales con Clases de Color y Alertas
        if (final > 10000) {
            mostrarModal(
                "🚨 NIVEL CRÍTICO: EXTERMINIO 🚨",
                "EL MODELO INDICA UN COLAPSO TOTAL.\n\n" +
                "⚠️ ALERTA: EXTERMINIO DE LA POBLACIÓN DETECTADO.\n" +
                "Iniciando protocolo de limpieza de la ciudad en 5 minutos.\n\n" +
                "No hay sobrevivientes estimados. Dios nos guarde.",
                "modal-rojo"
            );
        } 
        else if (final > 1000) {
            mostrarModal(
                "⚠️ Riesgo Elevado de Expansión",
                "La propagación del virus muestra una tendencia acelerada.\n\n" +
                "El brote aún puede ser contenido, pero el margen de acción es limitado.\n\n" +
                "Se recomienda intensificar medidas preventivas y monitoreo continuo.",
                "modal-amarillo"
            );
        } 
        else {
            mostrarModal(
                "🟢 Propagación Bajo Control",
                "El crecimiento del virus se mantiene dentro de parámetros manejables.\n\n" +
                "Existe una ventana de oportunidad para desarrollar soluciones.\n\n" +
                "Sin embargo, se recomienda vigilancia constante para evitar cambios inesperados.",
                "modal-verde"
            );
        }
    })
    .finally(() => {
        boton.classList.remove("loading");
        boton.innerText = "Simular";
    });
}

function graficar(t, analitica, numerica) {
    const ctx = document.getElementById('grafica').getContext('2d');
    if (chart) chart.destroy();

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
                    tension: 0.4,
                    pointRadius: 0,
                    borderWidth: 3
                },
                {
                    label: 'Modelo Numérico',
                    data: numerica,
                    borderColor: "#1E3A5F",
                    borderDash: [6, 4],
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
            interaction: { mode: 'nearest', intersect: false },
            plugins: {
                legend: { labels: { color: "#1E3A5F", font: { size: 13, weight: "bold" } } }
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

function mostrarModal(titulo, mensaje, claseColor = "") {
    const modal = document.getElementById("modal");
    const modalContent = modal.querySelector(".modal-content");
    const title = document.getElementById("modalTitle");
    const text = document.getElementById("modalText");

    // Limpiar clases previas de color
    modalContent.classList.remove("modal-rojo", "modal-amarillo", "modal-verde");
    
    // Añadir la clase nueva si existe
    if (claseColor) modalContent.classList.add(claseColor);

    title.innerText = titulo;
    text.innerText = mensaje;
    modal.style.display = "block";
}

document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modal");
    const closeBtn = document.getElementById("closeModal");

    closeBtn.onclick = () => { modal.style.display = "none"; };
    window.onclick = (e) => { if (e.target === modal) modal.style.display = "none"; };

    mostrarModal(
        "Protocolo de Emergencia",
        "Se ha detectado un nuevo agente patógeno de alta transmisibilidad.\n\n" +
        "El sistema de simulación epidemiológica ha sido habilitado para analizar escenarios de propagación.\n\n" +
        "Parámetros requeridos:\n" +
        "• I₀ → Casos iniciales detectados\n" +
        "• β → Tasa de propagación\n" +
        "• Tiempo → Horizonte de análisis\n\n" +
        "⚠️ Tu objetivo es evaluar el comportamiento del brote y anticipar riesgos."
    );
});