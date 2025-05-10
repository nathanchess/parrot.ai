import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
import os

"""embedding schema:
CREATE TABLE embeddings (
    id SERIAL PRIMARY KEY,
    text_segment TEXT NOT NULL,
    embedding vector(1024),  
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	username TEXT NOT NULL,
	speaker TEXT
);"""

def batch_upload_embeddings(embedding_data: list[tuple[str, list[float], str, str]]) -> None:
    """uploads a batch of embeddings to the database
    each element in the list will be (embedded text, list that represents embedding, user, speaker)
    e.g. [("sentence", [1, 2, 3, 4], "test_user", "speaker1")]"""
    load_dotenv()

    DB_HOST = os.getenv("DB_HOST")
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")

    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

    cursor = conn.cursor()

    formatted_data = [
        (text, f'[{",".join(map(str, embedding))}]', username, speaker)
        for text, embedding, username, speaker in embedding_data
    ]

    sql = """
    INSERT INTO embeddings (text_segment, embedding, username, speaker)
    VALUES %s
    """

    execute_values(cursor, sql, formatted_data)
    conn.commit()

    cursor.close()
    conn.close()