import boto3
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv
import json

load_dotenv()

BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

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
    
def get_bucket_filenames() -> list[str]:
    """returns the filenames of all files in the s3 bucket"""
    s3_client = boto3.client('s3')
    filenames = []

    try:
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME)

        if 'Contents' in response:
            filenames = [obj['Key'] for obj in response['Contents']]
        
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

