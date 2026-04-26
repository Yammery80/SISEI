let chart;
let datosBase = null;
let datosCiudad = null;

// --- FUNCIÓN PRINCIPAL DE SIMULACIÓN ---
async function simular() {
    const botton = document.querySelector("#simularBtn");
    const textButton = botton ? botton.querySelector(".button__text") : null;

    const I0 = parseFloat(document.getElementById("I0").value);
    const beta = parseFloat(document.getElementById("beta").value);
    const t_max = parseFloat(document.getElementById("t_max").value);
    const factor = document.getElementById('quarantineLevel') ? document.getElementById('quarantineLevel').value : 1.0;
    const ciudad = document.getElementById('cityName').innerText;

    if (isNaN(I0) || isNaN(beta) || isNaN(t_max) || I0 <= 0 || t_max <= 0) {
        alert("Por favor, ingrese valores válidos mayores a cero.");
        return;
    }

    if (botton) botton.classList.add("loading");
    if (textButton) textButton.innerText = "Simulando...";

    try {
        const url = (ciudad && ciudad !== "Ninguna" && ciudad !== "-") ? '/simular/ciudad' : '/simular';
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                i0: I0, 
                beta: beta, 
                tiempo: t_max,
                factor_cuarentena: factor,
                ciudad: ciudad
            })
        });

        const data = await response.json();
        datosGlobales = data;
        
        const t = data.t || data.puntos_x;
        const analitica = data.analitica || data.puntos_y;
        const numerica = data.numerica || [];

        // --- LÓGICA DE CAPAS PARA  ---
        let currentTipo = 'base'; 
        // Si el usuario ya buscó una ciudad pero NO ha movido la cuarentena (factor 1.0)
        if (ciudad && ciudad !== "Ninguna" && ciudad !== "-") {
            currentTipo = 'ciudad';
        }
        // Si el usuario ya aplicó una cuarentena (factor < 1.0)
        if (parseFloat(factor) < 1.0) {
            currentTipo = 'cuarentena';
        }

        // Llamamos a graficar pasando el nuevo parámetro 'currentTipo'
        graficar(t, analitica, numerica, currentTipo);
        
        const final = analitica[analitica.length - 1];
        procesarAlertas(final);

    } catch (err) {
        console.error("Error en la simulación:", err);
        alert("Error al conectar con el servidor.");
    } finally {
        if (botton) botton.classList.remove("loading");
        if (textButton) textButton.innerText = "SIMULAR";
    }

    try {
        const url = (ciudad && ciudad !== "Ninguna" && ciudad !== "-") ? '/simular/ciudad' : '/simular';
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                i0: I0, beta: beta, tiempo: t_max,
                factor_cuarentena: factor, ciudad: ciudad
            })
        });

        const data = await response.json();
        datosGlobales = data;

        ejecutarRenderizadoSegunVista(vistaActual);
        
        const final = (data.analitica || data.puntos_y).slice(-1)[0];
        procesarAlertas(final);

    } catch (err) {
        console.error("Error:", err);
    } finally {
    }
}

// --- FUNCIÓN DE BÚSQUEDA ---
const buscarCiudad = async () => {
    const ciudadNombre = document.getElementById('cityInput').value;

    if (!ciudadNombre) {
        alert("Escribe el nombre de una ciudad");
        return;
    }

    try {
        const response = await fetch(`/api/buscar_ciudad?nombre=${encodeURIComponent(ciudadNombre)}`);
        
        if (!response.ok) {
            alert("No se encontró la ciudad.");
            return;
        }

        const data = await response.json();

        // Inyectar en I0 y actualizar etiquetas
        document.getElementById('cityName').innerText = data.nombre;
        document.getElementById('cityPop').innerText = data.poblacion.toLocaleString();

        // Disparo automático
        simular();

    } catch (error) {
        console.error("Error en búsqueda:", error);
    }
};

// --- SOPORTE Y GRÁFICA ---
function graficar(t, analitica, numerica, tipo) {
    const canvas = document.getElementById('grafica');
    const ctx = canvas.getContext('2d');
    if (chart) chart.destroy();

    // Guardamos los datos en la memoria global según el paso
    if (tipo === 'base') datosBase = analitica;
    if (tipo === 'ciudad') datosCiudad = analitica;

    const datasets = [];

    // Capa 1: Referencia Base (Gris)
    if (datosBase) {
        datasets.push({
            label: 'Escenario Base',
            data: datosBase,
            borderColor: 'rgba(169, 169, 169, 0.3)',
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false
        });
    }

    // Capa 2: Con Población Real (Azul claro)
    if (datosCiudad) {
        datasets.push({
            label: 'Sin Cuarentena',
            data: datosCiudad,
            borderColor: 'rgba(42, 127, 186, 0.4)',
            pointRadius: 0,
            fill: false
        });
    }

    // Capa 3: Escenario Actual (Resaltado)
    datasets.push({
        label: 'Simulación Actual',
        data: analitica,
        borderColor: '#1E3A5F',
        backgroundColor: 'rgba(30, 58, 95, 0.1)',
        borderWidth: 4,
        tension: 0.4,
        pointRadius: 0,
        fill: true
    });

    chart = new Chart(ctx, {
        type: 'line',
        data: { labels: t.map(val => Math.round(val)),
            datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
           scales: {
            x: {
                ticks: {
                    maxTicksLimit: 10, 
                    callback: function(value, index, ticks) {
                        return 'Día ' + this.getLabelForValue(value);
                    }
                },
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => value.toLocaleString()
                }
            }
        },
       interaction: { mode: 'index', intersect: false },
            plugins: {
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: function(context) {
                            // ACTUALIZAR MÉTRICAS DEL PUNTO AL PASAR EL MOUSE
                            document.getElementById('tiempo').innerText = context.label + " días";
                            document.getElementById('val_analitica').innerText = Math.round(context.parsed.y).toLocaleString();
                            return `Casos: ${Math.round(context.parsed.y).toLocaleString()}`;
                        }
                    }
                }
            },
            },
            layout: {
            padding: {
                top: 10,
                bottom: 10
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
    );
}


function procesarAlertas(final) {
    if (final > 10000) {
        mostrarModal("🚨 NIVEL CRÍTICO: EXTERMINIO 🚨",

                "EL MODELO INDICA UN COLAPSO TOTAL.\n\n" +

                "⚠️ ALERTA: EXTERMINIO DE LA POBLACIÓN DETECTADO.\n" +

                "Iniciando protocolo de limpieza de la ciudad en 5 minutos.\n\n" +

                "No hay sobrevivientes estimados. Dios nos guarde.",

                "modal-rojo");
    } else if (final > 1000) {
        mostrarModal( "⚠️ Riesgo Elevado de Expansión",

                "La propagación del virus muestra una tendencia acelerada.\n\n" +

                "El brote aún puede ser contenido, pero el margen de acción es limitado.\n\n" +

                "Se recomienda intensificar medidas preventivas y monitoreo continuo.",

                "modal-amarillo");
    } else {
        mostrarModal( "🟢 Propagación Bajo Control",

                "El crecimiento del virus se mantiene dentro de parámetros manejables.\n\n" +

                "Existe una ventana de oportunidad para desarrollar soluciones.\n\n" +

                "Sin embargo, se recomienda vigilancia constante para evitar cambios inesperados.",

                "modal-verde");
    }
}

function mostrarModal(titulo, mensaje, claseColor = "") {
    const modal = document.getElementById("modal");
    const modalContent = modal.querySelector(".modal-content");
    document.getElementById("modalTitle").innerText = titulo;
    document.getElementById("modalText").innerText = mensaje;
    modalContent.className = "modal-content " + claseColor;
    modal.style.display = "block";
}

// --- EVENTOS ---
document.addEventListener("DOMContentLoaded", () => {
    // Configurar cierre de modal
    document.getElementById("closeModal").onclick = () => { document.getElementById("modal").style.display = "none"; };
    
    // Evento buscar
    document.getElementById('searchBtn').addEventListener('click', buscarCiudad);

    // Evento cuarentena
    const qLevel = document.getElementById('quarantineLevel');
    if(qLevel) {
        qLevel.addEventListener('change', simular);
    }

    // Modal inicial
    mostrarModal("Protocolo de Emergencia", "Analiza la propagación y anticipa riesgos.", "modal-verde");
});

let debounceTimer;

document.getElementById('cityInput').addEventListener('input', (e) => {
    const query = e.target.value;
    clearTimeout(debounceTimer);

    // Solo buscamos si el usuario escribió 3 o más letras
    if (query.length < 3) return;

    debounceTimer = setTimeout(async () => {
        try {
            const response = await fetch(`https://secure.geonames.org/searchJSON?q=${query}&maxRows=5&username=alfredo_dev&style=short`);
            const data = await response.json();

            const list = document.getElementById('citiesList');
            list.innerHTML = ""; // Limpiar sugerencias viejas

            if (data.geonames) {
                data.geonames.forEach(city => {
                    const option = document.createElement('option');
                    // Mostramos nombre y país
                    option.value = `${city.name}`; 
                    list.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Error en autocompletado:", error);
        }
    }, 300); 
});

// Lista local de ciudades (puedes agregar todas las que quieras)
const ciudadesMexico = [
    "Apizaco", "Tlaxcala", "Huamantla", "Chiautempan", "Zacatelco", 
    "Puebla", "Cholula", "Ciudad de México", "Monterrey", "Guadalajara", 
    "Querétaro", "Mérida", "Cancún", "Tijuana", "León", "Toluca"
];

const cityInput = document.getElementById('cityInput');
const citiesList = document.getElementById('citiesList');

cityInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    
    // Limpiamos la lista cada vez que el usuario escribe
    citiesList.innerHTML = "";

    // Solo filtramos si hay al menos 2 letras para que sea más reactivo
    if (query.length < 2) return;

    // Filtramos el arreglo local
    const sugerencias = ciudadesMexico.filter(ciudad => 
        ciudad.toLowerCase().includes(query)
    );

    // Creamos los elementos <option> para el datalist
    sugerencias.forEach(ciudad => {
        const option = document.createElement('option');
        option.value = ciudad;
        citiesList.appendChild(option);
    });
});

let vistaActual = 'logistica';
let datosGlobales = null; // Para guardar lo que mande Flask

function cambiarVista(nuevaVista) {
    vistaActual = nuevaVista;
    const t = datosGlobales.t;
    const datos = datosGlobales.analitica;

    if (vistaActual === 'incidencia') {
        // Calculamos la diferencia diaria (Derivada)
        const diaria = datos.map((val, i) => i === 0 ? val : val - datos[i-1]);
        graficar(t, diaria, [], 'bar'); // Cambiamos a tipo barras
    } 
    else if (vistaActual === 'logaritmica') {
        graficar(t, datos, [], 'line', 'logarithmic');
    }
}

function cambiarVista(tipo) {
    const loaderElem = document.getElementById('mainLoader');
    loaderElem.style.display = "block"; // Encender animación

    setTimeout(() => {
        // ... tu lógica de cambiar el gráfico ...
        loaderElem.style.display = "none"; // Apagar cuando termine el render
        
        // Cerrar el menú hamburguesa automáticamente al elegir
        document.getElementById('menuToggle').checked = false;
    }, 600); // 600ms de "carga" para que se aprecie la animación
}

function cambiarVista(nuevaVista) {
    if (!datosGlobales) return;
    
    const loaderVista = document.getElementById('mainLoader');
    loaderVista.style.display = "block"; 
    vistaActual = nuevaVista;

    setTimeout(() => {
        const t = datosGlobales.t || datosGlobales.puntos_x;
        const I = datosGlobales.analitica || datosGlobales.puntos_y; // Infectados
        const N = parseFloat(document.getElementById('cityPop').innerText.replace(/,/g, '')) || 100000;
        const beta = parseFloat(document.getElementById('beta').value);

        const ctx = document.getElementById('grafica').getContext('2d');
        if (chart) chart.destroy();

        let datasets = [];
        let escala = 'linear';
        let tipoGrafica = 'line';

        switch(nuevaVista) {
            case 'logistica':
                // La que ya tenemos (Acumulados)
                datasets.push({
                    label: 'Curva Analítica (Infectados Totales)',
                    data: I,
                    borderColor: '#1E3A5F',
                    backgroundColor: 'rgba(30, 58, 95, 0.1)',
                    fill: true,
                    tension: 0.4
                });
                break;

            case 'incidencia':
                // Nuevos Casos (Derivada)
                const diaria = I.map((v, i) => i === 0 ? v : v - I[i-1]);
                datasets.push({
                    label: 'Nuevos Casos Diarios',
                    data: diaria,
                    backgroundColor: '#D17942',
                    type: 'bar'
                });
                break;

            case 'sir':
                // Simulamos S y R basados en I para el modelo SIR
                const R = I.map(v => v * 0.8); // Recuperados estimados
                const S = I.map(v => N - v);   // Susceptibles restantes
                datasets = [
                    { label: 'S (Susceptibles)', data: S, borderColor: '#2ecc71', fill: false },
                    { label: 'I (Infectados)', data: I, borderColor: '#e74c3c', fill: false },
                    { label: 'R (Recuperados)', data: R, borderColor: '#3498db', fill: false }
                ];
                break;

            case 'reproduccion':
                // Tasa Rt (Beta * Susceptibles / N)
                const Rt = I.map(v => beta * ((N - v) / N) * 10); // Multiplicador para visibilidad
                datasets.push({
                    label: 'Tasa de Reproducción (Rt)',
                    data: Rt,
                    borderColor: '#f1c40f',
                    borderWidth: 3,
                    fill: false,
                    stepped: true
                });
                // Línea de seguridad en 1.0
                datasets.push({
                    label: 'Umbral Crítico (1.0)',
                    data: Array(t.length).fill(1),
                    borderColor: 'red',
                    borderDash: [10,5],
                    pointRadius: 0,
                    fill: false
                });
                break;
        }

        chart = new Chart(ctx, {
            type: tipoGrafica,
            data: { labels: t.map(v => Math.round(v)), datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, type: escala } }
            }
        });

        loaderVista.style.display = "none";
        document.getElementById('menuToggle').checked = false;
    }, 600);

    vistaActual = nuevaVista;
    const loader = document.getElementById('mainLoader');
    loader.style.display = "block";

    setTimeout(() => {
        ejecutarRenderizadoSegunVista(nuevaVista);
        loader.style.display = "none";
        document.getElementById('menuToggle').checked = false;
    }, 400);
}

function ejecutarRenderizadoSegunVista(tipoVista) {
    if (!datosGlobales) return;

    const t = datosGlobales.t || datosGlobales.puntos_x;
    const d = datosGlobales.analitica || datosGlobales.puntos_y;
    const ciudad = document.getElementById('cityName').innerText;
    
    let capa = (ciudad !== "Ninguna") ? 'ciudad' : 'base';

    if (tipoVista === 'incidencia') {
        const diaria = d.map((v, i) => i === 0 ? v : v - d[i-1]);
        graficar(t, diaria, 'cuarentena', 'linear', 'bar');
    } 
    else if (tipoVista === 'logaritmica') {
        graficar(t, d, 'cuarentena', 'logarithmic', 'line');
    }
    else if (tipoVista === 'sir') {
        graficar(t, d, 'cuarentena', 'linear', 'line');
    }
    else {
        graficar(t, d, capa, 'linear', 'line');
    }
}
