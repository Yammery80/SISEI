from flask import Flask, render_template, request, jsonify
import numpy as np

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/simular', methods=['POST'])
def simular():
    data = request.json

    I0 = float(data['I0'])
    beta = float(data['beta'])
    t_max = float(data['t_max'])

    # Tiempo
    t = np.linspace(0, t_max, 100)

    # -------- SOLUCIÓN ANALÍTICA --------
    I_analitica = I0 * np.exp(beta * t)

    # -------- SOLUCIÓN NUMÉRICA (EULER) --------
    dt = t[1] - t[0]
    I_numerica = [I0]

    for i in range(len(t)-1):
        nuevo = I_numerica[i] + beta * I_numerica[i] * dt
        I_numerica.append(nuevo)

    return jsonify({
        "t": t.tolist(),
        "analitica": I_analitica.tolist(),
        "numerica": I_numerica
    })

if __name__ == '__main__':
    app.run(debug=True)