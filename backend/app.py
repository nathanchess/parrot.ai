import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import logging
import tempfile
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

from s3_handler import S3Handler
from transcribe_audio import transcribe_audio

s3_handler = S3Handler()

@app.route('/ingest-microphone-prompt-audio', methods=['POST'])
def ingest_audio():
    try:
        logger.info('📥 Received audio ingestion request')
        
        # Get the audio data from the request
        data = request.json
        if not data or 'audio' not in data:
            logger.error('❌ No audio data provided in request')
            return jsonify({'error': 'No audio data provided'}), 400
        
        audio_data = data['audio']
        logger.info(f'✅ Audio data received successfully (length: {len(audio_data)} characters)')

        # Decode base64 audio data
        try:
            audio_bytes = base64.b64decode(audio_data)
            logger.info('✅ Successfully decoded base64 audio data')
        except Exception as e:
            logger.error(f'❌ Error decoding base64 audio data: {str(e)}')
            return jsonify({'error': 'Invalid audio data format'}), 400

        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name
            logger.info(f'✅ Saved audio to temporary file: {temp_file_path}')

        try:
            # Upload to S3
            file_name_timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"microphone_prompt_audio_{file_name_timestamp}.wav"
            
            # Open the file in binary read mode
            with open(temp_file_path, 'rb') as file_obj:
                s3_result = s3_handler.upload_audio_to_s3(file_obj, filename)
                if not s3_result:
                    raise Exception("Failed to upload to S3")
                logger.info(f'✅ Successfully uploaded audio to S3: {s3_result["https_url"]}')
            
            # Clean up temporary file
            os.unlink(temp_file_path)
            logger.info('✅ Cleaned up temporary file')

            # Transcribe the audio
            logger.info('🎙️ Starting transcription...')
            transcription = transcribe_audio(s3_result['s3_uri'])
            logger.info(f'✅ Transcription completed: {transcription}')

            return jsonify({
                'status': 'success',
                'message': 'Audio processed successfully',
                's3_url': s3_result['https_url'],
                'transcription': transcription
            })
            
        except Exception as e:
            logger.error(f'❌ Error processing audio: {str(e)}')
            # Clean up temporary file in case of error
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            return jsonify({'error': 'Failed to process audio'}), 500
        
    except Exception as e:
        logger.error(f'❌ Error processing request: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/send-transcription-to-s3', methods=['POST'])
def send_transcription_to_s3():

    try:
        logger.info('📥 Received audio ingestion request')
        
        # Get the audio data from the request
        data = request.json
        if not data or 'audio' not in data:
            logger.error('❌ No audio data provided in request')
            return jsonify({'error': 'No audio data provided'}), 400
        
        audio_data = data['audio']
        logger.info(f'✅ Audio data received successfully (length: {len(audio_data)} characters)')

        # Decode base64 audio data
        try:
            audio_bytes = base64.b64decode(audio_data)
            logger.info('✅ Successfully decoded base64 audio data')
        except Exception as e:
            logger.error(f'❌ Error decoding base64 audio data: {str(e)}')
            return jsonify({'error': 'Invalid audio data format'}), 400

        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name
            logger.info(f'✅ Saved audio to temporary file: {temp_file_path}')

        try:
            # Upload to S3
            file_name_timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"microphone_prompt_audio_{file_name_timestamp}.wav"
            
            # Open the file in binary read mode
            with open(temp_file_path, 'rb') as file_obj:
                s3_result = s3_handler.upload_audio_to_s3(file_obj, filename)
                if not s3_result:
                    raise Exception("Failed to upload to S3")
                logger.info(f'✅ Successfully uploaded audio to S3: {s3_result["https_url"]}')
            
            # Clean up temporary file
            os.unlink(temp_file_path)
            logger.info('✅ Cleaned up temporary file')

            return jsonify({
                'status': 'success',
                'message': 'Audio processed successfully',
                's3_url': s3_result['https_url'],
                'transcription': 'This is a test transcription'
            })
            
        except Exception as e:
            logger.error(f'❌ Error processing audio: {str(e)}')
            # Clean up temporary file in case of error
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            return jsonify({'error': 'Failed to process audio'}), 500
        
    except Exception as e:
        logger.error(f'❌ Error processing request: {str(e)}')
        return jsonify({'error': str(e)}), 500

        

if __name__ == '__main__':
    logger.info('🚀 Starting Flask server...')
    app.run(host='0.0.0.0', port=5000, debug=True) 