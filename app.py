from flask import Flask, render_template, request, jsonify
import numpy as np
import requests

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/simular', methods=['POST'])
def simular():
    data = request.json

    # Aseguramos que I0 y beta no sean negativos desde la entrada
    I0 = max(0.0, float(data['I0']))
    beta = max(0.0, float(data['beta'])) # <--- Corrección aquí
    t_max = float(data['t_max'])

    # Generación de tiempo
    t = np.linspace(0, t_max, 100)

    # -------- SOLUCIÓN ANALÍTICA --------
    I_analitica = np.maximum(0, I0 * np.exp(beta * t))

    # -------- SOLUCIÓN NUMÉRICA (EULER) --------
    dt = t[1] - t[0]
    I_numerica = [I0]

    for i in range(len(t)-1):
        nuevo = I_numerica[i] + beta * I_numerica[i] * dt
        
        # RESTRICCIÓN: Solo valores positivos (mínimo 0)
        if nuevo < 0:
            nuevo = 0
            
        I_numerica.append(nuevo)

    return jsonify({
        "t": t.tolist(),
        "analitica": I_analitica.tolist(),
        "numerica": I_numerica
    })
    
def obtener_datos_ciudad(nombre_ciudad):
    api_url = f"https://api.api-ninjas.com/v1/city?name={nombre_ciudad}"
                            
    headers ={'X-Api-Key': 'tNssOw1aHKQ22juYTbM7cgEoGb6kiA6ORQ2bpF84'}
    try:
        response = requests.get(api_url, headers=headers)
        if response.status_code == 200:
            datos = response.json()
            if datos:
                return datos[0]['population']
    except Exception as e:
        print(f"Error: {e}")
    return None
    
@app.route('/api/buscar_ciudad')
def buscar_ciudad():
    nombre = request.args.get('nombre')
    poblacion = obtener_datos_ciudad(nombre)
    
    if poblacion:
        return jsonify({
            "nombre": nombre,
            "poblacion": poblacion
        })
    
    return jsonify({"error": "Ciudad no encontrada"}), 404
    
@app.route('/simular/ciudad', methods=['POST'])
def simular_ciudad():
    data = request.json
    nombre_ciudad = data.get('ciudad')
    
    r = float(data.get('tasa_r', 0.5))    # Tasa de contagio
    t_final = int(data.get('tiempo', 30)) # Días a simular
    i0 = float(data.get('i0', 1))         # Infectados iniciales
    
    poblacion_k= obtener_datos_ciudad(nombre_ciudad)
    
    if poblacion_k:
    
        t_espacio = np.linspace(0, t_final, 100)
    
        C = (poblacion_k -i0)/i0
    
        infectados_y = poblacion_k / (1 + C * np.exp(-r * t_espacio))
    
        return jsonify({
            "status": "success",
            "ciudad": nombre_ciudad,
            "poblacion": poblacion_k,
            "puntos_x": t_espacio.tolist(),
            "puntos_y": infectados_y.tolist()
        })
    
    return jsonify({"status": "error", "message": "Ciudad no encontrada"}), 404

@app.route('/simular/variable', methods=['POST'])
def simular_variable():
    data = request.json
    nombre_ciudad = data.get('ciudad')
    t_final = int(data.get('tiempo', 30))
    i0 = float(data.get('i0', 1))
    
    poblacion_k = obtener_datos_ciudad(nombre_ciudad)
    
    if poblacion_k:
        t = np.linspace(0, t_final, 100)
        
        # Simulamos una tasa que oscila: r promedio + una onda senoidal
        r_base = float(data.get('tasa_r', 0.2))
        tasa_variable = r_base * (1 + 0.5 * np.sin(2 * np.pi * t / 7)) 
        
        # Resolvemos numéricamente (Euler) porque la analítica con P(t) 
        dt = t[1] - t[0]
        infectados = [i0]
        
        for i in range(len(t)-1):
            # Usamos Bernoulli
            r_actual = r_base * (1 + 0.5 * np.sin(2 * np.pi * t[i] / 7))
            cambio = r_actual * infectados[i] * (1 - infectados[i] / poblacion_k)
            nuevo = infectados[i] + cambio * dt
            infectados.append(nuevo)

        return jsonify({
            "status": "success",
            "puntos_x": t.tolist(),
            "puntos_y": infectados,
            "tasa_visual": tasa_variable.tolist()
        })
if __name__ == '__main__':
    app.run(debug=True)