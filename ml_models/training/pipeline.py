import os
from pyspark.sql import SparkSession
from pyspark.ml.feature import Tokenizer, StopWordsRemover, HashingTF, IDF
from pyspark.ml.classification import NaiveBayes, LogisticRegression, RandomForestClassifier
from pyspark.ml import Pipeline
from pyspark.ml.evaluation import MulticlassClassificationEvaluator

# Module 4, 5, 6: NLP Preprocessing, Machine Learning Classification, Ensemble Verdict Engine

def train_models(data_path, model_save_path):
    print("Initializing Spark Session for ML Pipeline...")
    spark = SparkSession.builder \
        .appName("FakeNewsDetectionML") \
        .config("spark.driver.memory", "4g") \
        .getOrCreate()

    print(f"Loading dataset from: {data_path}")
    # Schema expected: id, text, label (1 for Fake, 0 for Real)
    df = spark.read.csv(data_path, header=True, inferSchema=True)
    
    # Drop rows with null text
    df = df.na.drop(subset=["text", "label"])

    (trainingData, testData) = df.randomSplit([0.8, 0.2], seed=42)

    print("Step 1: NLP Preprocessing (Tokenization, Stopwords, TF-IDF)")
    tokenizer = Tokenizer(inputCol="text", outputCol="words")
    remover = StopWordsRemover(inputCol="words", outputCol="filtered")
    hashingTF = HashingTF(inputCol="filtered", outputCol="rawFeatures", numFeatures=10000)
    idf = IDF(inputCol="rawFeatures", outputCol="features")

    print("Step 2: Defining Machine Learning Models")
    # 1. Naive Bayes
    nb = NaiveBayes(featuresCol="features", labelCol="label", predictionCol="nb_prediction")
    
    # 2. Logistic Regression
    lr = LogisticRegression(featuresCol="features", labelCol="label", predictionCol="lr_prediction")
    
    # 3. Random Forest
    rf = RandomForestClassifier(featuresCol="features", labelCol="label", predictionCol="rf_prediction", numTrees=50)

    # Build the main pipeline combining NLP and Models
    pipeline = Pipeline(stages=[tokenizer, remover, hashingTF, idf, nb, lr, rf])

    print("Training the Big Data ML Pipeline... This might take some time.")
    model = pipeline.fit(trainingData)
    
    print("Evaluating Models on Test Data...")
    predictions = model.transform(testData)
    
    # Evaluate individual models
    evaluator = MulticlassClassificationEvaluator(labelCol="label", metricName="accuracy")
    
    print("--- Model Accuracy ---")
    nb_acc = evaluator.evaluate(predictions.select("label", "nb_prediction").withColumnRenamed("nb_prediction", "prediction"))
    lr_acc = evaluator.evaluate(predictions.select("label", "lr_prediction").withColumnRenamed("lr_prediction", "prediction"))
    rf_acc = evaluator.evaluate(predictions.select("label", "rf_prediction").withColumnRenamed("rf_prediction", "prediction"))
    
    print(f"Naive Bayes: {nb_acc * 100:.2f}%")
    print(f"Logistic Regression: {lr_acc * 100:.2f}%")
    print(f"Random Forest: {rf_acc * 100:.2f}%")

    print("Saving the tuned model to disk...")
    model.write().overwrite().save(os.path.join(model_save_path, "ensemble_pipeline_model"))
    print("ML Pipeline complete!")
    
    spark.stop()

if __name__ == "__main__":
    # Specify paths (usually from CLI args in production)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    dataset_path = os.path.join(BASE_DIR, "datasets", "fake_news_dataset.csv") # Placeholder
    model_output_path = os.path.join(BASE_DIR, "ml_models", "trained_models")
    
    # Dummy creation of empty dataset file for testing purposes if it doesn't exist
    if not os.path.exists(dataset_path):
        os.makedirs(os.path.dirname(dataset_path), exist_ok=True)
        with open(dataset_path, "w") as f:
            f.write("id,text,label\n1,Sample fake news article,1\n2,Real news article,0\n")
            
    train_models(dataset_path, model_output_path)
