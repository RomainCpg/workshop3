import pickle
import os
import numpy as np
from flask import Flask, request, jsonify
import requests
from sklearn.datasets import load_iris
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

app = Flask(__name__)



#Entrainement du modele
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(iris.data, iris.target, test_size=0.8, random_state=42)

model = RandomForestClassifier(random_state=42)
model.fit(X_train, y_train)

with open("iris_model.pkl", "wb") as f:
    pickle.dump(model, f)

@app.route('/')
def hello_world():
    return 'Exemple route : /predict?feature0=5.1&feature1=3.5&feature2=1.4&feature3=2.0'

#Prédiction via API
@app.route('/predict', methods=['GET'])
def predict():
    try:
        features = [float(request.args.get(f"feature{i}")) for i in range(4)]
    except TypeError:
        return jsonify({"error": "Invalid input. Provide 4 numerical features."}), 400

    prediction = model.predict([features])[0]
    class_name = ["setosa", "versicolor", "virginica"][prediction]

    return jsonify({
        "input": features,
        "prediction": class_name
    })


models_urls = [
    "https://0e0b-89-30-29-68.ngrok-free.app/predict",
    "https://0e66-89-30-29-68.ngrok-free.app/predict",
    "https://2d22-89-30-29-68.ngrok-free.app/predict",
    "https://db76-89-30-29-68.ngrok-free.app/predict"
]




@app.route('/aggregate_predict', methods=['GET'])
def aggregate_prediction():
    try:
        default_weights = [0.25, 0.25, 0.25, 0.25]
        weights_file = "weights.pkl"

        if os.path.exists(weights_file):
            with open(weights_file, "rb") as f:
                model_weights = pickle.load(f)
        else:
            model_weights = default_weights
            with open(weights_file, "wb") as f:
                pickle.dump(model_weights, f)

        features = {f"feature{i}": request.args.get(f"feature{i}") for i in range(4)}
        old_weight = model_weights.copy()
        predictions = []
        prediction_weights = {}

        for i, url in enumerate(models_urls):
            response = requests.get(url, params=features)
            if response.status_code == 200:
                prediction = response.json()["prediction"]
                predictions.append(prediction)

                # Ajouter le poids au cumul de cette prédiction
                if prediction in prediction_weights:
                    prediction_weights[prediction] += model_weights[i]
                else:
                    prediction_weights[prediction] = model_weights[i]

        if not prediction_weights:
            return jsonify({"error": "No valid responses from models"}), 500

        # **🔝 Sélection de la prédiction avec le poids total le plus élevé**
        consensus_prediction = max(prediction_weights, key=prediction_weights.get)



        learning_rate = 0.05
        for i in range(len(predictions)):
            if(predictions[i] == consensus_prediction):
                model_weights[i] += learning_rate
            else:
                model_weights[i] -= learning_rate

        with open(weights_file, "wb") as f:
            pickle.dump(model_weights, f)

        return jsonify({
            "input": features,
            "individual_predictions": predictions,
            "consensus_prediction": consensus_prediction,
            "updated model weight": model_weights,
            "old model weight": old_weight
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400


model_weights2 = [0.25, 0.25, 0.25, 0.25]
@app.route('/aggregate_predict2', methods=['GET'])
def aggregate_prediction2():
    try:
        # Récupérer les features passées en paramètre
        features = {f"feature{i}": request.args.get(f"feature{i}") for i in range(4)}

        predictions = [] #ici yaura toute les prédictions de chaque api

        for url in models_urls:
            response = requests.get(url, params=features)
            if response.status_code == 200: #si on a bien un code 200 (=les paramètre sont ok) on ajoute la préd a la liste
                predictions.append(response.json()["prediction"])

        print(predictions)

        if not predictions:
            return jsonify({"error": "No valid responses from models"}), 500

        # transformer les réponses en nombre
        class_mapping = {"setosa": 0, "versicolor": 1, "virginica": 2}
        encoded_responses = [class_mapping[class_name] for class_name in predictions]

        weighted_sum = sum(encoded_responses[i] * model_weights2[i] for i in range(len(encoded_responses)))
        consensus_prediction = int(round(weighted_sum))

        class_name = ["setosa", "versicolor", "virginica"][consensus_prediction]

        return jsonify({
            "input": features,
            "individual_predictions": predictions,
            "consensus_prediction": class_name
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, threaded=True)