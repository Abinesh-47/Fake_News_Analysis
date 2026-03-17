from pyspark.ml.classification import NaiveBayes, LogisticRegression, RandomForestClassifier
from pyspark.ml.evaluation import MulticlassClassificationEvaluator
from pyspark.ml import Pipeline

def train_models(train_data, test_data):
    """Implement and compare multiple classification algorithms."""
    
    results = {}

    # 1. Naive Bayes
    nb = NaiveBayes(featuresCol="features", labelCol="label")
    nb_model = nb.fit(train_data)
    nb_preds = nb_model.transform(test_data)
    results['Naive Bayes'] = evaluate(nb_preds)

    # 2. Logistic Regression
    lr = LogisticRegression(featuresCol="features", labelCol="label")
    lr_model = lr.fit(train_data)
    lr_preds = lr_model.transform(test_data)
    results['Logistic Regression'] = evaluate(lr_preds)

    # 3. Random Forest
    rf = RandomForestClassifier(featuresCol="features", labelCol="label")
    rf_model = rf.fit(train_data)
    rf_preds = rf_model.transform(test_data)
    results['Random Forest'] = evaluate(rf_preds)

    return results

def evaluate(predictions):
    """Calculate Accuracy, Precision, Recall, and F1-score."""
    evaluator = MulticlassClassificationEvaluator(labelCol="label", predictionCol="prediction")
    
    metrics = {
        "accuracy": evaluator.evaluate(predictions, {evaluator.metricName: "accuracy"}),
        "f1": evaluator.evaluate(predictions, {evaluator.metricName: "f1"}),
        "weightedPrecision": evaluator.evaluate(predictions, {evaluator.metricName: "weightedPrecision"}),
        "weightedRecall": evaluator.evaluate(predictions, {evaluator.metricName: "weightedRecall"})
    }
    return metrics
