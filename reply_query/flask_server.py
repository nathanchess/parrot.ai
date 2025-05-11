import boto3
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

import sys
import os

# Add the parent directory of 'reply_query' to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from modules import text_embedding, database_interactor

app = Flask(__name__)

CORS(app)


@app.route("/", methods=["GET"])
def helloWorld():
    try:
        return jsonify("Hello World")
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/bedrock", methods=["POST"])
def bedrock_query() -> dict:
    try:
        data = request.json
        string_query = data.get('query') # query needs to get transformed into a embedded text 
        embedding = text_embedding.embed_text(string_query) # transform for embed
        matches = database_interactor.similarity_search(embedding)
        client = boto3.client('bedrock-runtime', region_name='us-west-2')  
        query_text = (
            "Given the information of the initial query question that was asked and also the matching information "
            "that was found with the text and that timeframe, provide the user with an answer to their question or just reply to them as their assistant if they didn't ask a question,"
            "given the matches of information to their question"
            "Also note that you are parrot.ai a tool that helps users remember information that was recorded."
        )

        formatted_matches = ' | '.join(' '.join(tup) for tup in matches)
        
        context = "Initial Query: " + string_query + "| Matches: " + formatted_matches + "| Context: "
        
        payload = {
            "modelId": "anthropic.claude-3-5-haiku-20241022-v1:0",
            "messages": [
                {
                    "role": "user",
                    "content": [
                            {
                                'text': context
                            }
                        ]
                }
            ],
            "inferenceConfig": {
                "maxTokens": 200,
                "stopSequences": [],
                "temperature": 1,
                "topP": 0.999
            }
        }

        response = client.converse(
            modelId=payload['modelId'],
            messages=payload['messages'],
            inferenceConfig=payload['inferenceConfig']
        )

        return jsonify(response['output']['message']['content'][0]['text'])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)