import boto3
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

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
        string_query = data.get('query')
        matches = data.get('matches', [])
        client = boto3.client('bedrock-runtime', region_name='us-west-2')  
        
        query_text = (
            "Given the information of the initial query question that was asked and also the matching information "
            "that was found with the text and that timeframe, provide the user with an answer to their question "
            "given the matches of information to their question"
        )

        formatted_matches = ' | '.join(' '.join(tup) for tup in matches)
        
        context = string_query + query_text + formatted_matches
        
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