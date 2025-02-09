

We choose to work on the iris dataset for this practical work. 

## Q1 - Predictive model

Here the code to load and train de iris dataset. 
For the purpose of the practical work, I set `test_size=0.8` to reduce the accuracy of the model. 
````
iris = load_iris()
X_train, X_test, y_train, y_test = train_test_split(iris.data, iris.target, test_size=0.8, random_state=42)

model = RandomForestClassifier(random_state=42)
model.fit(X_train, y_train)
````


For the route, we decided to return the input (which are the features) and the prediction with the name of the flower.
````@app.route('/predict', methods=['GET'])
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
`````

## Q2 - Consensus prediction with the average

For this question, I took the result of each model, convert it into

````
for url in models_urls:
    response = requests.get(url, params=features)
    if response.status_code == 200: #si on a bien un code 200 (=les paramètre sont ok) on ajoute la préd a la liste
        predictions.append(response.json()["prediction"])
````

Each model result is converted in number, which are then normalized. 
We can now make an average of all the results and get the consensus.

## Q3 and Q4

For this part, we firstly store the weights of each models : 

```
default_weights = [0.25, 0.25, 0.25, 0.25]
weights_file = "weights.pkl"

if os.path.exists(weights_file):
    with open(weights_file, "rb") as f:
        model_weights = pickle.load(f)
else:
    model_weights = default_weights
    with open(weights_file, "wb") as f:
        pickle.dump(model_weights, f)
```

Then, we will group the results by model and sum their respective weights.
For example, if the results are [flowerA, flowerB, flowerA], we will add up the weights of flowerA together.
This allows us to create a dictionary where each unique model result is associated with its total weight.
```
if prediction in prediction_weights:
    prediction_weights[prediction] += model_weights[i]
else:
    prediction_weights[prediction] = model_weights[i]
```

After that, we can have the result with the best weight : 
```
consensus_prediction = max(prediction_weights, key=prediction_weights.get)
```

Finaly, we have to update the model weight. 
If the model have the same result as the consensus prediction, then it will increase by a learning rate. 
If not, it will be decreased by the same learning rate.

```
learning_rate = 0.05
for i in range(len(predictions)):
    if(predictions[i] == consensus_prediction):
        model_weights[i] += learning_rate
    else:
        model_weights[i] -= learning_rate
```


