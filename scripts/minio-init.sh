#!/bin/sh

# Wait for MinIO to be ready
echo "Waiting for MinIO to start..."
until mc alias set local http://localhost:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" > /dev/null 2>&1; do
    echo "MinIO not ready, waiting..."
    sleep 2
done

echo "MinIO is ready, creating bucket..."

# Create bucket if it doesn't exist
mc mb local/"$MINIO_BUCKET_NAME" --ignore-existing

echo "Bucket '$MINIO_BUCKET_NAME' created successfully"
