import boto3
from dotenv import load_dotenv
from datetime import datetime

import os

load_dotenv()
AUDIO_BUCKET_NAME = os.getenv("AUDIO_BUCKET")
OUTPUT_BUCKET = os.getenv("S3_BUCKET_NAME")

#function to convert .wav files in s3 into transcript json object
def instruct_transcribe_audio(filename: str, output_filename: str) -> str:
    """sends instruction to transcribe audiofile 
    then thrown transcript into transcript processing bucket"""
    transcribe_client = boto3.client('transcribe', region_name='us-west-2')
    
    print("transcribing", filename)

    current_time = datetime.now().strftime("%Y%m%d_%H%M%S")
    transcription_job_name = f"transcribe_{current_time}"

    s3_uri = f"s3://{AUDIO_BUCKET_NAME}/{filename}"
    transcribe_client.start_transcription_job(
        TranscriptionJobName=transcription_job_name,
        Media={'MediaFileUri': s3_uri},
        MediaFormat='wav',
        LanguageCode='en-US',
        OutputBucketName=OUTPUT_BUCKET, 
        OutputKey=f"{output_filename}.json"
    )

