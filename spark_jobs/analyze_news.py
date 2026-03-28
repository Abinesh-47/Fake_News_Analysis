import os
import json
import pandas as pd
try:
    from pyspark.sql import SparkSession
    from pyspark.sql.functions import length
    SPARK_AVAILABLE = True
except ImportError:
    SPARK_AVAILABLE = False

try:
    from hdfs import InsecureClient
    HDFS_CLIENT_AVAILABLE = True
except ImportError:
    HDFS_CLIENT_AVAILABLE = False

# Path configuration
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
pipeline_dir = os.path.join(project_root, "data_pipeline")
input_path = os.path.join(pipeline_dir, "raw_news.json")
local_output_path = os.path.join(pipeline_dir, "processed_news.json")

# HDFS Configuration
HDFS_URL = "http://localhost:9870"  # WebHDFS default
HDFS_PATH = "/orbitx/news/processed_news.json"
SIMULATED_HDFS_DIR = os.path.join(project_root, "hdfs_simulation", "orbitx", "news")

def save_to_hdfs_or_sim(data_pdf):
    """Saves the processed data to HDFS or a simulated local directory."""
    success = False
    
    # 1. Attempt Real HDFS via WebHDFS
    if HDFS_CLIENT_AVAILABLE:
        try:
            # We use orbitx as the user for the HDFS simulation context
            client = InsecureClient(HDFS_URL, user='orbitx')
            with client.write(HDFS_PATH, encoding='utf-8', overwrite=True) as writer:
                data_pdf.to_json(writer, orient="records", indent=4)
            print(f"SUCCESS: Data saved to HDFS at {HDFS_PATH}")
            success = True
        except Exception as e:
            print(f"HDFS Connection Failed (expected if no cluster): {e}")

    # 2. Fallback to HDFS Simulation (Local Directory)
    if not success:
        print(f"SIMULATION: Saving to local HDFS simulation at {SIMULATED_HDFS_DIR}")
        if not os.path.exists(SIMULATED_HDFS_DIR):
            os.makedirs(SIMULATED_HDFS_DIR)
        
        sim_file_path = os.path.join(SIMULATED_HDFS_DIR, "processed_news.json")
        data_pdf.to_json(sim_file_path, orient="records", indent=4)
        print(f"SUCCESS: Simulated HDFS data stored at {sim_file_path}")

def run_analysis():
    print(f"Loading news from: {input_path}")
    if not os.path.exists(input_path):
        print(f"ERROR: Input file not found at {input_path}")
        return

    pdf = pd.read_json(input_path)
    processed_pdf = None
    
    if SPARK_AVAILABLE:
        try:
            print("Attempting analysis with Apache Spark...")
            spark = SparkSession.builder \
                .appName("OrbitX-News-Analysis") \
                .master("local[1]") \
                .config("spark.sql.execution.arrow.pyspark.enabled", "true") \
                .getOrCreate()
            
            df = spark.createDataFrame(pdf)
            
            # Clean data: Remove null titles and duplicates
            # Improved credibility: base 60 + boost for trusted domains + (length % 15)
            # Trusted keywords in link or title
            trusted_domains = ["thehindu", "reuters", "bbc", "apnews", "indianexpress", "ndtv", "timesofindia", "dailythanthi", "dinamalar", "dinakaran", "indiatoday"]
            
            from pyspark.sql.functions import when, col, lower
            
            # Simple scoring logic in Spark
            df = df.withColumn("is_trusted", col("link").rlike("|".join(trusted_domains)))
            df = df.withColumn("credibility_score", 
                               when(col("is_trusted"), 85 + (length("title") % 10))
                               .otherwise(60 + (length("title") % 15)))
            
            df = df.withColumn("status", when(col("credibility_score") > 80, "VERIFIED").otherwise("SUSPECT"))
            
            # Save result back to Pandas
            processed_pdf = df.toPandas()
            
            # Optional: Native Spark HDFS write if environment supports it
            try:
                # df.write.mode("overwrite").json("hdfs://localhost:9000/orbitx/news")
                pass
            except:
                pass

            spark.stop()
        except Exception as e:
            print(f"Spark analysis failed (environment issue): {e}")

        # Fallback logic using Pandas
        print("Running analysis with Pandas engine...")
        processed_pdf = pdf.dropna(subset=["title"])
        processed_pdf = processed_pdf.drop_duplicates(subset=["title"])
        
        # Consistent Pandas fallback logic
        trusted_domains = ["thehindu", "reuters", "bbc", "apnews", "indianexpress", "ndtv", "timesofindia", "dailythanthi", "dinamalar", "dinakaran", "indiatoday"]
        
        def calculate_score(row):
            link = str(row.get('link', '')).lower()
            is_trusted = any(domain in link for domain in trusted_domains)
            if is_trusted:
                return 85 + (len(str(row['title'])) % 10)
            return 60 + (len(str(row['title'])) % 15)
            
        processed_pdf["credibility_score"] = processed_pdf.apply(calculate_score, axis=1)
        processed_pdf["status"] = processed_pdf["credibility_score"].apply(lambda s: "VERIFIED" if s > 80 else "SUSPECT")

    # 1. Save to Local API Output (for Dashboard)
    processed_pdf.to_json(local_output_path, orient="records", indent=4)
    print(f"Local API data updated at: {local_output_path}")

    # 2. Save to HDFS (Real or Simulated)
    save_to_hdfs_or_sim(processed_pdf)

if __name__ == "__main__":
    run_analysis()
