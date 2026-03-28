from pyspark.sql import SparkSession
import os

try:
    print("Testing minimal Spark initialization...")
    spark = SparkSession.builder \
        .appName("MinimalTest") \
        .master("local[1]") \
        .getOrCreate()
    
    print("Spark context initialized.")
    df = spark.sql("SELECT 'Working' as status, 100 as score")
    df.show()
    print("Spark SQL query executed successfully!")
    spark.stop()
except Exception as e:
    print(f"Spark failed: {e}")
