from pyspark.sql import SparkSession
try:
    spark = SparkSession.builder.appName("Test").getOrCreate()
    print("Spark initialized successfully!")
    df = spark.createDataFrame([("test", 1)], ["name", "id"])
    df.show()
    print("Spark DataFrame created successfully!")
    spark.stop()
except Exception as e:
    print(f"Spark initialization failed: {e}")
