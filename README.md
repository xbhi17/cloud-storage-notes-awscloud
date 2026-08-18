# AWS Student Notes Storage System

A small web application for storing and managing academic files using Flask and Amazon S3.

I built this project to get practical experience with AWS S3, the Boto3 SDK, Flask, environment-based configuration, and cloud file operations.

## What it does

The application provides a simple dashboard where users can:

* Upload academic files
* View files stored in the S3 bucket
* Search files by filename
* Download files
* Delete files
* See file size and last-modified time

Downloads are handled through temporary S3 presigned URLs instead of making the S3 bucket publicly accessible.

## How it works

The application has three main parts:

```text
Browser
   │
   ▼
Flask application
   │
   ▼
Boto3
   │
   ▼
Amazon S3
```

The Flask application handles the web routes and user actions.

`S3Manager` contains the AWS-related operations, keeping the S3 code separate from the Flask routes.

## Tech Stack

**Backend**

* Python
* Flask
* Boto3

**Cloud**

* Amazon S3

**Frontend**

* HTML
* Bootstrap 5

**Configuration**

* python-dotenv
* Environment variables

## Project Structure

```text
ai-note-storage/
│
├── src/
│   ├── app.py
│   ├── config.py
│   ├── s3_manager.py
│   └── templates/
│       └── index.html
│
├── requirements.txt
├── .gitignore
└── README.md
```

### `app.py`

Contains the Flask routes for:

* Listing files
* Uploading files
* Downloading files
* Deleting files

### `config.py`

Loads AWS configuration from environment variables.

### `s3_manager.py`

Contains the S3 operations:

* Upload object
* List objects
* Generate presigned download URL
* Delete object

Keeping these operations in a separate class makes the Flask routes easier to follow.

## Configuration

Create a `.env` file locally:

```env
FLASK_SECRET_KEY=your_secret_key
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_BUCKET_NAME=your_bucket_name
```

Do not commit the `.env` file to GitHub.

A `.env.example` file can be used to document the required variables without exposing credentials.

## Installation

Clone the repository and enter the project directory:

```bash
git clone <your-repository-url>
cd ai-note-storage
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```bash
.venv\Scripts\activate
```

On Linux/macOS:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## Run

Start the Flask application:

```bash
python -m src.app
```

Then open:

```text
http://127.0.0.1:5000
```

## S3 Download Flow

When a user clicks Download, the application does not directly expose the bucket.

Instead:

```text
User
  │
  ▼
Flask /download/<filename>
  │
  ▼
Boto3 generates presigned URL
  │
  ▼
Temporary S3 URL
  │
  ▼
File download
```

The generated URL is configured to expire after one hour.

## Error Handling

AWS operations catch `ClientError` exceptions and return a failure result to the Flask application.

The UI then displays a success or failure message to the user.

## What I learned

This project helped me understand the difference between local file storage and object storage in the cloud.

The main things I worked with were:

* S3 object storage
* Boto3
* Presigned URLs
* Flask routing
* Environment variables
* File uploads
* MIME type detection
* Separating cloud logic from application routes

## Limitations

This is a learning project rather than a production deployment.

The current version does not include:

* User authentication
* Per-user file ownership
* Database-backed metadata
* File size limits
* File type allowlisting
* S3 pagination
* CSRF protection
* Automated tests

These would be some of the first things I would address before deploying it for multiple users.

## Possible Improvements

* Add user authentication
* Store file metadata in a database
* Add per-user S3 prefixes
* Add file type and size validation
* Add pagination for large buckets
* Add automated tests
* Containerize the application
* Deploy the Flask application on AWS
* Add CI/CD

## Author

**Mallidi Mohan**

Mathematics & Computing
Indian Institute of Technology Goa
