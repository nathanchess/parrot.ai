import boto3
import logging
import os
from botocore.exceptions import ClientError
from botocore.config import Config

logger = logging.getLogger(__name__)

class S3Handler:

    def __init__(self):
        # Get AWS credentials
        aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
        aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        aws_region = os.getenv('AWS_REGION', 'us-west-2')  # Default to us-west-2 if not specified
            
        # Configure S3 client with explicit credentials
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
            region_name=aws_region,
            config=Config(signature_version='s3v4')  # Use latest signature version
        )
        self.transcribe_client = boto3.client('transcribe')
        self.bucket_name = os.getenv('S3_BUCKET_NAME')
        logger.info(f'🌍 Using AWS Region: {aws_region}')
        logger.info(f'📦 Target S3 Bucket: {self.bucket_name}')

    def upload_audio_to_s3(self, file_obj, filename):
        try:
            logger.info(f'📤 Uploading file {filename} to S3 bucket {self.bucket_name}')
            s3_key = f'audio/{filename}'
            
            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                s3_key,
                ExtraArgs={
                    'ContentType': 'audio/wav'
                }
            )
            
            # Return both the S3 URI (for Transcribe) and HTTPS URL (for reference)
            s3_uri = f"s3://{self.bucket_name}/{s3_key}"
            https_url = f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}"
            
            logger.info(f'✅ File uploaded successfully. S3 URI: {s3_uri}')
            return {
                's3_uri': s3_uri,
                'https_url': https_url
            }
        except Exception as e:
            logger.error(f"Error uploading audio to S3: {e}")
            return None
       
    def transcribe_audio(self, s3_url):
        try:
            logger.info(f'📤 Transcribing audio from {s3_url}')
            response = self.s3_client.Bucket(self.bucket_name).Object(Key=s3_url).get()
            audio_data = response['Body'].read()
            logger.info(f'✅ Audio data read successfully')
            
            # Transcribe audio
            job_arguments = {
                'LanguageCode': 'en-US',
                'Media': {
                    'MediaFileUri': s3_url
                }
            }

            response = self.transcribe_client.start_transcription_job(**job_arguments)
            job = response["TranscriptionJob"]
            logger.info("Started transcription job %s.", s3_url)

            if job.get("TranscriptionJobStatus") == 'COMPLETED':
                logger.info("Transcription job completed successfully.")
                return job.get("Transcript", {}).get("TranscriptFileUri")        
            else:
                logger.error("Transcription job failed. Status: %s", job.get("TranscriptionJobStatus"))
                return None

        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
            return None
            
