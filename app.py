from flask import Flask, render_template, request, jsonify
import numpy as np
import requests

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

def obtener_poblacion_api(nombre_ciudad):
    # API Key del usuario integrada
    api_url = f"https://api.api-ninjas.com/v1/city?name={nombre_ciudad}"
    headers = {'X-Api-Key': 'tNssOw1aHKQ22juYTbM7cgEoGb6kiA6ORQ2bpF84'}
    try:
        response = requests.get(api_url, headers=headers)
        if response.status_code == 200:
            datos = response.json()
            if datos:
                return datos[0]['population']
    except Exception as e:
        print(f"Error API: {e}")
    return None

@app.route('/simular', methods=['POST'])
def simular():
    try:
        data = request.json
        I0 = float(data.get('i0', 1))
        beta = float(data.get('beta', 0.2))
        t_max = float(data.get('tiempo', 10))
        factor = float(data.get('factor_cuarentena', 1.0))
        ciudad = data.get('ciudad')

        # Tasa de crecimiento neta k
        k = beta * factor
        t = np.linspace(0, t_max, 100)
        dt = t[1] - t[0]

        # Verificar si hay una ciudad seleccionada para aplicar límite de población
        poblacion_k = obtener_poblacion_api(ciudad) if (ciudad and ciudad != "Ninguna" and ciudad != "-") else None

        if poblacion_k:
            # MODELO LOGÍSTICO (Crecimiento con límite)
            C = (poblacion_k - I0) / I0
            I_analitica = poblacion_k / (1 + C * np.exp(-k * t))
            
            # Euler Logístico
            I_numerica = [I0]
            for i in range(len(t)-1):
                cambio = k * I_numerica[i] * (1 - I_numerica[i] / poblacion_k)
                I_numerica.append(I_numerica[i] + cambio * dt)
        else:
            # MODELO DE VARIABLES SEPARABLES (Exponencial puro - Según la imagen)
            # I(t) = I0 * e^(kt)
            I_analitica = I0 * np.exp(k * t)
            
            # Euler Exponencial
            I_numerica = [I0]
            for i in range(len(t)-1):
                cambio = k * I_numerica[i]
                I_numerica.append(I_numerica[i] + cambio * dt)

        return jsonify({
            "t": t.tolist(),
            "analitica": I_analitica.tolist(),
            "numerica": I_numerica,
            "es_logistico": poblacion_k is not None
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/buscar_ciudad')
def buscar_ciudad():
    nombre = request.args.get('nombre')
    pob = obtener_poblacion_api(nombre)
    if pob:
        return jsonify({"nombre": nombre, "poblacion": pob})
    return jsonify({"error": "Ciudad no encontrada"}), 404

if __name__ == '__main__':
    app.run(debug=True)