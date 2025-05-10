import os
import sys

sys.path.insert(0, os.path.abspath("../"))
print(os.getcwd())
import modules.text_embedding as te
import modules.text_segmentation as ts
import modules.database_interactor as db
import modules.s3_interactor as s3
import time
# #testing text embedding
# text = "hi this is some sample text"

# print(te.embed_text(text))


# #testing aws text segmentation
# test = "hi this is a sentence. this is another sentence. nathan is the coolest guy around"
# print('\n\n\n', ts.text_segmentation(test))

# # testing database inserter
# sample_text = "i hate strawberries"
# test_embedding = [(sample_text, te.embed_text(sample_text), "test_user", "nathan")]
# db.batch_upload_embeddings(test_embedding)

# # testing database query
# query_text = "i love nathan"
# similar_data = db.similarity_search(te.embed_text(query_text))
# for x in similar_data:
#     print(x)

def _process_file_contents(file_contents: dict) -> None:
    transcript = file_contents["results"]["transcripts"][0]["transcript"]
    sentences = ts.text_segmentation(transcript)

    upload_contents = []
    for sentence in sentences:
        embedded_text = te.embed_text(sentence)
        upload_contents.append((sentence, embedded_text, "test_user", "speaker"))

    db.batch_upload_embeddings(upload_contents)



while True:
    if not s3.bucket_empty():
        print("no files, waiting")
        time.sleep(5)
    
    for filename in s3.get_bucket_filenames():
        file_contents = s3.read_pop_file(filename)
        _process_file_contents(file_contents)



