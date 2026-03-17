from pyspark.sql import SparkSession
from pyspark.ml import PipelineModel
from pyspark.sql.functions import expr, from_json, col
from pyspark.sql.types import StructType, StructField, StringType
import os

# Module 1 & 6: Real-Time Ingestion and Ensemble Engine Scoring

def start_ingestion_and_scoring():
    print("Starting Spark Streaming Ingestion & Real-Time Scoring...")
    
    spark = SparkSession.builder \
        .appName("NewsIngestionAndScoring") \
        .getOrCreate()
        
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_path = os.path.join(BASE_DIR, "ml_models", "trained_models", "ensemble_pipeline_model")
    
    # Load the trained PipelineModel
    try:
        print(f"Loading Ensemble Pipeline Model from {model_path}...")
        model = PipelineModel.load(model_path)
    except Exception as e:
        print(f"Warning: Model not found at {model_path}. Train the model first.")
        return

    # Define schema for Incoming News Requests (e.g. from the Node.js API)
    schema = StructType([
        StructField("id", StringType(), True),
        StructField("text", StringType(), True),
        StructField("source_url", StringType(), True)
    ])

    input_dir = os.path.join(BASE_DIR, "datasets", "news_input")
    os.makedirs(input_dir, exist_ok=True)
    
    # Stream from JSON files for local development
    raw_stream = spark.readStream.schema(schema).json(input_dir)
    
    # Apply ML pipeline predictions
    predictions = model.transform(raw_stream)
    
    # Module 6: Ensemble Logic
    # 3 models: Naive Bayes, LR, RF. If 2 or more say it's fake (1), verdict is fake.
    ensemble_df = predictions.withColumn(
        "final_verdict", 
        expr("CASE WHEN (nb_prediction + lr_prediction + rf_prediction) >= 2 THEN 'FAKE' ELSE 'REAL' END")
    ).withColumn(
        "confidence_score",
        # Calculate a rough confidence score based on model consensus
        expr("((nb_prediction + lr_prediction + rf_prediction) / 3.0) * 100")
    ).select("id", "source_url", "final_verdict", "confidence_score")
    
    print("Writing scored output...")
    # Again, Console sink for demo. In production, sink to DB or another Kafka topic.
    query = ensemble_df.writeStream \
        .outputMode("append") \
        .format("console") \
        .start()
        
    query.awaitTermination()

if __name__ == "__main__":
    start_ingestion_and_scoring()
