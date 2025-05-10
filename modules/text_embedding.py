import boto3
import json

def embed_text(text: str, model_id = "amazon.titan-embed-text-v2:0"):
    """generate embedings given the text"""
    client = boto3.client(
        'bedrock-runtime',
        region_name='us-west-2' 
    )

    native_request = {
        "inputText": text
    }

    request = json.dumps(native_request)

    response = client.invoke_model(modelId=model_id, body=request)

    response_body = json.loads(response['body'].read())
    embedding = response_body["embedding"]

    return embedding
