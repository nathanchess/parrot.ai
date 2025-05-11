import boto3
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv
import json

load_dotenv()

BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
AUDIO_BUCKET_NAME = os.getenv("AUDIO_BUCKET")

def bucket_empty() -> bool:
    """returns a boolean value to check if bucket is empty"""
    s3_client = boto3.client('s3')

    try:
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME)

        if 'Contents' not in response:
            return True
        
        return False

    except ClientError as e:
        print(f"Error occurred: {e}")
        return False  
    
def get_bucket_filenames(file_extension = ".json", bucket_name = BUCKET_NAME) -> list[str]:
    """returns the filenames of all files in the s3 bucket
    only returns files of given filetype and ignored directories"""
    s3_client = boto3.client('s3')
    filenames = []

    try:
        response = s3_client.list_objects_v2(Bucket=bucket_name)

        if 'Contents' in response:
            for obj in response['Contents']:
                key = obj['Key']
                if not key.endswith("/") and key.endswith(file_extension):
                    filenames.append(key)
        return filenames

    except ClientError as e:
        print(f"Error occurred: {e}")
        return []
    
def read_pop_file(filename: str) -> str:
    """return the given file contents and deletes the file"""
    s3_client = boto3.client('s3')
    try:
        response = s3_client.get_object(Bucket=BUCKET_NAME, Key=filename)

        file_content = response['Body'].read().decode('utf-8')
        
        json_data = json.loads(file_content)
        
        s3_client.delete_object(Bucket=BUCKET_NAME, Key=filename)
        
        return json_data

    except ClientError as e:
        print(f"Error occurred: {e}")
        return None 
    
def get_transcript_from_file_contents(json_data: str) -> str:
    """returns the transcript from file contents"""
    try:
        transcript = json_data["transcript"]
        return transcript
    except:
        print("error finding transcript in file")
        return None
    
def move_s3_file(source_key: str, destination_key: str, bucket_name = BUCKET_NAME) -> bool:
    """Moves a file within an S3 bucket from source_key to destination_key."""
    s3_client = boto3.client('s3')
    
    try:
        s3_client.copy_object(
            Bucket=bucket_name,
            CopySource={'Bucket': bucket_name, 'Key': source_key},
            Key=destination_key
        )

        s3_client.delete_object(Bucket=bucket_name, Key=source_key)
        return True

    except ClientError as e:
        print(f"Error occurred: {e}")
        return False

# def upload_audio(file_obj, filename) -> dict[str, str]:
#         try:
#             s3_client = boto3.client('s3')
#             s3_key = f'{filename}'

#             s3_client.upload_fileobj(
#                 file_obj,
#                 AUDIO_BUCKET_NAME,
#                 s3_key,
#                 ExtraArgs={
#                     'ContentType': 'audio/wav'
#                 }
#             )
            
#             # Return both the S3 URI (for Transcribe) and HTTPS URL (for reference)
#             s3_uri = f"s3://{AUDIO_BUCKET_NAME}/{s3_key}"
#             https_url = f"https://{AUDIO_BUCKET_NAME}.s3.amazonaws.com/{s3_key}"
            
#             return {
#                 's3_uri': s3_uri,
#                 'https_url': https_url
#             }
        
#         except ClientError as e:
#             print(f"Error occurred: {e}")
#             return False  
