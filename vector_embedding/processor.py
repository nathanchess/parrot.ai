import os
import sys

sys.path.insert(0, os.path.abspath("../"))
print(os.getcwd())
import modules.text_embedding as te
import modules.text_segmentation as ts
import modules.database_interactor as db
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

# testing database query
query_text = "i love nathan"
similar_data = db.similarity_search(te.embed_text(query_text))
for x in similar_data:
    print(x)
