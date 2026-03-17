from pyspark.sql import SparkSession
from pyspark.ml.feature import Tokenizer, StopWordsRemover, HashingTF, IDF, VectorAssembler
from pyspark.sql.functions import lower, regexp_replace

def initialize_spark():
    """Initialize Spark Session for Big Data processing."""
    spark = SparkSession.builder \
        .appName("FakeNewsNLP") \
        .config("spark.executor.memory", "4g") \
        .getOrCreate()
    return spark

def preprocess_data(df):
    """Distributed NLP Preprocessing Pipeline."""
    # 1. Clean Text
    df = df.withColumn("text", lower(df["text"]))
    df = df.withColumn("text", regexp_replace(df["text"], "[^a-zA-Z\\s]", ""))

    # 2. Tokenization
    tokenizer = Tokenizer(inputCol="text", outputCol="words")
    wordsData = tokenizer.transform(df)

    # 3. Remove Stopwords
    remover = StopWordsRemover(inputCol="words", outputCol="filtered")
    filteredData = remover.transform(wordsData)

    # 4. TF-IDF Vectorization
    hashingTF = HashingTF(inputCol="filtered", outputCol="rawFeatures", numFeatures=10000)
    featurizedData = hashingTF.transform(filteredData)

    idf = IDF(inputCol="rawFeatures", outputCol="features")
    idfModel = idf.fit(featurizedData)
    rescaledData = idfModel.transform(featurizedData)

    return rescaledData

if __name__ == "__main__":
    spark = initialize_spark()
    # Example loading from HDFS or local
    # df = spark.read.csv("hdfs:///data/news_dataset.csv", header=True, inferSchema=True)
    print("Spark NLP Module Initialized")
