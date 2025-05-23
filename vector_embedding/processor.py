import os
import sys

sys.path.insert(0, os.path.abspath("../"))
print(os.getcwd())
import modules.text_embedding as te
import modules.text_segmentation as ts
import modules.database_interactor as db
import modules.s3_interactor as s3
import time

def _process_file_contents(file_contents: dict) -> None:
    transcript = s3.get_transcript_from_file_contents(file_contents)
    sentences = ts.text_segmentation(transcript)

    upload_contents = []
    for sentence in sentences:
        print(sentence)
        if not sentence.strip():
            continue
    
        embedded_text = te.embed_text(sentence)
        upload_contents.append((sentence, embedded_text, "test_user", "speaker"))

    db.batch_upload_embeddings(upload_contents)


# #test bd interactor search my timestamp
# from datetime import datetime, timedelta
# for row in db.timestamp_search(datetime.now() - timedelta(hours=2), 2, 2):
#     print(row)

while True:
    if s3.bucket_empty():
        print("no files, waiting")
        time.sleep(5)
    
    for filename in s3.get_bucket_filenames():
        file_contents = s3.read_pop_file(filename)
        _process_file_contents(file_contents)



