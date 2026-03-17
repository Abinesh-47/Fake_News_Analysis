import os
import json
from pyspark.sql import SparkSession
from pyspark.sql.functions import from_json, col, expr, window
from pyspark.sql.types import StructType, StructField, StringType, MapType, IntegerType, TimestampType

# Module 7: Diffusion Analytics via Spark Structured Streaming

def start_analytics_streaming(kafka_bootstrap_servers, input_topic, db_uri):
    print("Initializing Spark Structured Streaming...")
    
    # In production, uses org.mongodb.spark:mongo-spark-connector and org.apache.spark:spark-sql-kafka-0-10
    spark = SparkSession.builder \
        .appName("DiffusionAnalytics") \
        .config("spark.mongodb.output.uri", db_uri) \
        .getOrCreate()

    # Define schema for incoming social media interactions (e.g., retweets, shares)
    schema = StructType([
        StructField("news_id", StringType(), True),
        StructField("user_id", StringType(), True),
        StructField("timestamp", TimestampType(), True),
        StructField("action", StringType(), True),         # 'SHARE', 'VIEW', 'COMMENT'
        StructField("follower_count", IntegerType(), True),# Used to calculate potential reach/velocity
        StructField("depth", IntegerType(), True)          # Tracking propagation tree depth
    ])

    print(f"Connecting to Kafka topic {input_topic}...")
    
    # Simulate reading from Kafka (requires Kafka libraries in cluster)
    # df = spark.readStream.format("kafka") \
    #     .option("kafka.bootstrap.servers", kafka_bootstrap_servers) \
    #     .option("subscribe", input_topic) \
    #     .load()
    
    # Placeholder for streaming (Read from json directory for local dev testing)
    input_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "datasets", "streaming_input")
    os.makedirs(input_dir, exist_ok=True)
    
    raw_df = spark.readStream.schema(schema).json(input_dir)

    # 1. Spread Velocity Calculation (Shares per hour rolling window)
    velocity_df = raw_df \
        .withWatermark("timestamp", "1 hour") \
        .groupBy(
            col("news_id"),
            window(col("timestamp"), "1 hour", "10 minutes")
        ).count().withColumnRenamed("count", "shares_in_window")

    # 2. Network Propagation Depth & Influential Accounts
    # Find max depth and sum of followers reached per news item
    impact_df = raw_df \
        .groupBy("news_id") \
        .agg(
            expr("max(depth)").alias("max_propagation_depth"),
            expr("sum(follower_count)").alias("total_potential_reach"),
            expr("count(distinct user_id)").alias("unique_spreaders")
        )
        
    print("Starting Streaming Queries...")

    # Output to Console for debugging (In production, replace with Mongo/Postgres sinks)
    query_velocity = velocity_df.writeStream \
        .outputMode("update") \
        .format("console") \
        .start()

    query_impact = impact_df.writeStream \
        .outputMode("complete") \
        .format("console") \
        .start()

    query_velocity.awaitTermination()
    query_impact.awaitTermination()

if __name__ == "__main__":
    KAFKA_SERVER = "localhost:9092"
    TOPIC = "social_media_shares"
    MONGO_URI = "mongodb://localhost:27017/fakenews.analytics"
    
    start_analytics_streaming(KAFKA_SERVER, TOPIC, MONGO_URI)
