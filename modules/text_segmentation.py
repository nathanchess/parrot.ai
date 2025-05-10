import boto3

def text_segmentation(full_text: str) -> list[str]:
    """segments text into a list of strings"""
    comprehend = boto3.client('comprehend')

    response = comprehend.batch_detect_syntax(
        TextList=[full_text],
        LanguageCode='en'
    )

    sentences = []
    current_sentence = []

    for result in response['ResultList']:
        for token in result['SyntaxTokens']:
            current_sentence.append(token['Text'])
            
            # Check if the token is a period (.) or another sentence-ending punctuation mark
            if token['Text'] in ['.', '!', '?']:
                sentences.append(" ".join(current_sentence))
                current_sentence = []

    if current_sentence != []:
        sentences.append(" ".join(current_sentence))

    return sentences