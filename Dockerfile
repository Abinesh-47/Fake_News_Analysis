# --- ORBIT-X FORENSIC ENGINE DOCKERFILE ---
# Optimized for Render.com Deployment

FROM node:22-bullseye

# 1. Install System Dependencies (Java 17 + Python 3 + Spark Requirements)
RUN apt-get update && apt-get install -y \
    openjdk-17-jre-headless \
    python3 \
    python3-pip \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 2. Set Environment Variables for Java and Spark
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV PATH=$PATH:$JAVA_HOME/bin
ENV PYSPARK_PYTHON=python3
ENV PYSPARK_DRIVER_PYTHON=python3

# 3. Create app directory
WORKDIR /app

# 4. Install Node.js dependencies
COPY package*.json ./
RUN npm install

# 5. Install Python dependencies for Spark jobs
RUN pip3 install --no-cache-dir pyspark pandas axios requests

# 6. Copy application source
COPY . .

# 7. Create necessary data directories for the pipeline
RUN mkdir -p data_pipeline spark_jobs hdfs_simulation/orbitx/news uploads

# 8. Expose the port (Render will override this via $PORT)
EXPOSE 3000

# 9. Start the forensic server
# We use tsx to run our TypeScript server directly in production
CMD ["npm", "run", "start"]
