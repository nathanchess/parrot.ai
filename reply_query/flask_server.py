import boto3
import json

def bedrock_query(string_query: str, matches: list[tuple[str, str]]) -> dict:
    
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

    print(response['output']['message']['content'][0]['text'])



if __name__ == "__main__":
    # Example list of tuples simulating a conversation at a sushi restaurant with timestamps
    matches = [
        ("User: Hi, I'd like to see the menu for today.", "2025-05-03 12:00:00"),
        ("Server: Sure! Here's the menu. We have sushi rolls, sashimi, nigiri, and some appetizers.", "2025-05-03 12:01:15"),
        ("User: I'm in the mood for something spicy, what do you recommend?", "2025-05-03 12:03:00"),
        ("Server: We have a spicy tuna roll, or you might like our spicy salmon sashimi. Both are popular!", "2025-05-03 12:04:30"),
        ("User: The spicy tuna roll sounds great. Can I get a side of miso soup with that?", "2025-05-03 12:06:00"),
        ("Server: Absolutely, we'll add that to your order! Would you like to drink anything?", "2025-05-03 12:07:00"),
        ("User: I'll have some green tea, please.", "2025-05-03 12:08:00"),
        ("Server: Great choice! Your order will be ready shortly. Thank you for choosing our restaurant!", "2025-05-03 12:09:30")
    ]

    # Example query string (user asking what they ordered)
    query = "What did I order today?"

    # Call the bedrock_query function
    bedrock_query(query, matches)