import os
import sys

sys.path.insert(0, os.path.abspath("../"))
print(os.getcwd())
import modules.text_embedding as te
import modules.text_segmentation as ts
import modules.database_interactor as db
import modules.s3_interactor as s3
import modules.transcribe as transcribe
import time

AUDIO_BUCKET_NAME = os.getenv("AUDIO_BUCKET")

while True:
    if s3.bucket_empty():
        print("no files, waiting")
        time.sleep(5)
    
    for filename in s3.get_bucket_filenames(file_extension='.wav', bucket_name=AUDIO_BUCKET_NAME):
        archive_filename = f"archive/{filename}"
        s3.move_s3_file(filename, archive_filename, AUDIO_BUCKET_NAME)
        transcribe.instruct_transcribe_audio(filename = archive_filename, output_filename = filename)


        