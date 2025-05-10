import os
import sys

sys.path.insert(0, os.path.abspath("../"))
print(os.getcwd())
import modules.text_embedding as te
import modules.text_segmentation as ts

# #testing text embedding
# text = "hi this is some sample text"

# print(te.embed_text(text))


# #testing aws text segmentation
# test = "hi this is a sentence. this is another sentence. nathan is the coolest guy around"
# print('\n\n\n', ts.text_segmentation(test))