import boto3
import logging
import time
import os
import json
import requests
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

def transcribe_audio(s3_url):
    """
    Transcribe audio from an S3 URL using AWS Transcribe
    """
    try:
        # Initialize AWS Transcribe client
        transcribe = boto3.client(
            'transcribe',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
            region_name=os.getenv('AWS_REGION', 'us-west-2')
        )

        # Extract job name from S3 URL
        job_name = f"transcription_{int(time.time())}"
        
        # Start transcription job
        logger.info(f'🎙️ Starting transcription job: {job_name}')
        response = transcribe.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={'MediaFileUri': s3_url},
            MediaFormat='wav',
            LanguageCode='en-US'
        )

        # Wait for transcription to complete
        while True:
            status = transcribe.get_transcription_job(TranscriptionJobName=job_name)
            if status['TranscriptionJob']['TranscriptionJobStatus'] in ['COMPLETED', 'FAILED']:
                break
            logger.info('⏳ Waiting for transcription to complete...')
            time.sleep(5)

        if status['TranscriptionJob']['TranscriptionJobStatus'] == 'COMPLETED':
            # Get the transcription text from the transcript URI
            transcript_uri = status['TranscriptionJob']['Transcript']['TranscriptFileUri']
            response = requests.get(transcript_uri)
            transcript_json = response.json()
            transcript_text = transcript_json['results']['transcripts'][0]['transcript']
            
            logger.info('✅ Transcription completed successfully')
            return transcript_text
        else:
            error_message = status['TranscriptionJob'].get('FailureReason', 'Unknown error')
            logger.error(f'❌ Transcription failed: {error_message}')
            raise Exception(f'Transcription failed: {error_message}')

    except ClientError as e:
        logger.error(f'❌ AWS Transcribe error: {str(e)}')
        raise
    except Exception as e:
        logger.error(f'❌ Error in transcription: {str(e)}')
        raise 