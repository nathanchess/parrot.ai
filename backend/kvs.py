import boto3
import time
import logging
from botocore.exceptions import ClientError
from typing import Callable, Optional
from s3_handler import S3Handler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class KVSHandler:
    def __init__(self, stream_name="parrot-audio-stream", on_new_record: Optional[Callable] = None):
        self.stream_name = stream_name
        self.kvs_client = boto3.client('kinesisvideo')
        self.kinesis_client = boto3.client('kinesis')  # Add regular Kinesis client
        self.kvs_media_client = None
        self.stream_arn = None
        self.data_endpoint = None
        self.on_new_record = on_new_record  # Callback function for new records
        self.s3_handler = S3Handler()
        
    def create_stream_if_not_exists(self):
        """Create KVS stream if it doesn't exist"""
        try:
            # Check if stream exists
            response = self.kvs_client.describe_stream(StreamName=self.stream_name)
            self.stream_arn = response['StreamInfo']['StreamARN']
            logger.info(f"Stream {self.stream_name} already exists")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                # Create new stream
                response = self.kvs_client.create_stream(
                    StreamName=self.stream_name,
                    DataRetentionInHours=24,
                    MediaType='audio/mpeg'
                )
                self.stream_arn = response['StreamARN']
                logger.info(f"Created new stream: {self.stream_name}")
            else:
                raise

    def get_data_endpoint(self):
        """Get the data endpoint for the stream"""
        try:
            response = self.kvs_client.get_data_endpoint(
                StreamName=self.stream_name,
                APIName='PUT_MEDIA'
            )
            self.data_endpoint = response['DataEndpoint']
            self.kvs_media_client = boto3.client(
                'kinesis-video-media',
                endpoint_url=self.data_endpoint
            )
            logger.info(f"Got data endpoint: {self.data_endpoint}")
        except ClientError as e:
            logger.error(f"Error getting data endpoint: {e}")
            raise

    def process_audio_data(self, record_info):
        """Process new audio data by saving it to S3"""
        try:
            print('📥 Processing new audio data...')
            timestamp = record_info['timestamp']
            data = record_info['data']
            
            # Create a unique filename using timestamp
            filename = f"kvs_audio_{timestamp}.mp3"
            s3_key = f"kvs_fragments/{filename}"
            
            # Upload to S3
            s3_uri, s3_url = self.s3_handler.upload_audio(data, s3_key)
            print(f'✅ Audio fragment saved to S3: {s3_uri}')
            
            return {
                's3_uri': s3_uri,
                's3_url': s3_url,
                'timestamp': timestamp,
                'filename': filename
            }
        except Exception as e:
            print(f'❌ Error processing audio data: {str(e)}')
            raise

    def put_media(self, audio_data):
        """Put media into the KVS stream"""
        try:
            print('📤 Preparing to put media into KVS stream...')
            
            # Create a fragment with timestamp
            timestamp = int(time.time() * 1000)
            
            # Put record into stream using the Kinesis client
            response = self.kinesis_client.put_record(
                StreamName=self.stream_name,
                Data=audio_data,
                PartitionKey=str(timestamp)  # Using timestamp as partition key
            )
            print('✅ Media successfully put into KVS stream')
            
            # Process the audio data and save to S3
            record_info = {
                'timestamp': timestamp,
                'data': audio_data,
                'sequence_number': response.get('SequenceNumber'),
                'shard_id': response.get('ShardId')
            }
            
            # Call the callback function if it exists
            if self.on_new_record:
                try:
                    self.on_new_record(record_info)
                except Exception as e:
                    print(f'⚠️ Error in on_new_record callback: {str(e)}')
            
            # Process the audio data
            try:
                self.process_audio_data(record_info)
            except Exception as e:
                print(f'⚠️ Error processing audio data: {str(e)}')
            
            return response
        except Exception as e:
            print(f'❌ Error putting media into KVS stream: {str(e)}')
            raise

    def get_media_fragments(self, start_timestamp, end_timestamp):
        """Get media fragments from the stream for a time range"""
        try:
            if not self.kvs_media_client:
                self.get_data_endpoint()

            response = self.kvs_media_client.get_media_for_fragment_list(
                StreamName=self.stream_name,
                Fragments=[f"{start_timestamp}-{end_timestamp}"]
            )
            
            return response['Payload'].read()
        except ClientError as e:
            logger.error(f"Error getting media fragments: {e}")
            raise

    def cleanup(self):
        """Clean up resources"""
        try:
            self.kvs_client.delete_stream(StreamName=self.stream_name)
            logger.info(f"Deleted stream: {self.stream_name}")
        except ClientError as e:
            logger.error(f"Error deleting stream: {e}")
            raise
