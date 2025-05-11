# Parrot.AI Backend

A Flask-based backend service for handling audio processing, transcription, and storage.

## Features

- Real-time audio streaming to Kinesis Video Streams (KVS)
- Audio transcription using AWS Transcribe
- Audio storage in AWS S3
- RESTful API endpoints for audio processing
- Background audio fragment processing

## Tech Stack

- Python 3.8+
- Flask
- AWS Services:
  - Kinesis Video Streams
  - S3
  - Transcribe
- Boto3 (AWS SDK)

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- AWS Account with appropriate permissions
- AWS CLI configured

## Setup

1. Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables in `.env`:
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
S3_BUCKET_NAME=your_bucket_name
```

4. Start the server:
```bash
python app.py
```

## API Endpoints

### POST /transcribe
Transcribes audio data and returns the transcription.
- Request body: `{ "audio_data": "base64_encoded_audio" }`
- Response: `{ "transcription": "text", "s3_uri": "uri", "s3_url": "url" }`

### POST /stream-audio
Streams audio data to KVS.
- Request body: Raw audio data
- Response: `{ "status": "success", "message": "Audio streamed successfully" }`

### GET /get-audio
Retrieves audio fragments from KVS.
- Query parameters: `start_time`, `end_time`
- Response: Audio stream

## Project Structure

```
backend/
├── app.py              # Main Flask application
├── kvs.py             # Kinesis Video Streams handler
├── s3_handler.py      # S3 storage handler
├── transcribe_audio.py # Audio transcription handler
└── requirements.txt    # Python dependencies
```

## Development

- Use `python app.py` to start the development server
- The server runs on `http://localhost:5000` by default
- Debug mode is enabled for development

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security Notes

- Never commit `.env` files or AWS credentials
- Use IAM roles with minimal required permissions
- Enable CORS only for trusted origins
- Implement rate limiting for production use 