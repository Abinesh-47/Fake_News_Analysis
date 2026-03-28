from pyspark.sql import SparkSession

try:
    spark = SparkSession.builder.appName("DataFrameTest").master("local[1]").getOrCreate()
    print("Spark initialized.")
    data = [("Alice", 1), ("Bob", 2)]
    df = spark.createDataFrame(data, ["name", "id"])
    df.show()
    print("DataFrame created from list successfully!")
    spark.stop()
except Exception as e:
    print(f"DataFrame creation failed: {e}")
