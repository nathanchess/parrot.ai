import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime
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

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

def _execute_retrieve_query(query: str, *args) -> list[tuple[str, list[float], str, str, datetime]]:
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

    cursor = conn.cursor()

    cursor.execute(query, *args)
    results = cursor.fetchall()
    cursor.close()
    conn.close()

    formatted_results = [
        (text_segment, username, speaker, created_at)
        for text_segment, _, username, speaker, created_at in results
    ]

    return formatted_results


def batch_upload_embeddings(embedding_data: list[tuple[str, list[float], str, str]]) -> None:
    """uploads a batch of embeddings to the database
    each element in the list will be (embedded text, list that represents embedding, user, speaker)
    e.g. [("sentence", [1, 2, 3, 4], "test_user", "speaker1")]"""

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

def similarity_search(query_embedding: list[float], start = 0, end = 5) -> list[tuple[str, list[float], str, str, datetime]]:
    """given the a starting query embedding, returns the top queries from start to end index.
    each returned query in format of (embedded text, list that represents embedding, user, speaker, timestamp)"""

    query_embedding_str = f'[{",".join(map(str, query_embedding))}]'
    sql = f"""
    SELECT text_segment, embedding, username, speaker, created_at 
    FROM embeddings 
    ORDER BY embedding <-> '{query_embedding_str}' 
    LIMIT {end - start} OFFSET {start};
    """

    formatted_results = _execute_retrieve_query(sql)

    return formatted_results

def timestamp_search(timestamp: datetime, before = 5, after = 5) -> list[tuple[str, list[float], str, str, datetime]]:
    """given the a starting query based on timestamp, 
    returns "before" number of data before current timestamp and 
    "after" number of data after current timestamp.
    each returned query in format of (embedded text, list that represents embedding, user, speaker, timestamp)"""

    sql_before = f"""
    SELECT text_segment, embedding, username, speaker, created_at 
    FROM embeddings 
    WHERE created_at <= %s 
    ORDER BY created_at DESC 
    LIMIT %s;
    """
    
    sql_after = f"""
    SELECT text_segment, embedding, username, speaker, created_at 
    FROM embeddings 
    WHERE created_at > %s 
    ORDER BY created_at ASC 
    LIMIT %s;
    """

    results_before = _execute_retrieve_query(sql_before, (timestamp, abs(before)))
    results_after  = _execute_retrieve_query(sql_after, (timestamp, abs(after)))

    formatted_results = results_after+results_before

    return formatted_results