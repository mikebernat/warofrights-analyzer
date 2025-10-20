# Storage Adapters Documentation

## Overview

The sharing feature uses the Adapter Pattern to support multiple storage backends.

## Available Adapters

### 1. Filesystem Adapter (Default)
Stores shares as JSON files locally.

**Configuration:**
```env
STORAGE_TYPE=filesystem
STORAGE_PATH=./sharedAnalysis
```

### 2. S3 Adapter
Stores shares in AWS S3 or S3-compatible storage.

**Configuration:**
```env
STORAGE_TYPE=s3
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
```

## Usage

The storage adapter is automatically selected based on STORAGE_TYPE environment variable.

See server/README.md for more details.
