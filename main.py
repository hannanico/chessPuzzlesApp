import pandas as pd
import requests
import io
from flask import Flask, jsonify, render_template
import os
from dotenv import load_dotenv
import random

load_dotenv()

app = Flask(__name__)

storage_url = os.getenv("STORAGE_URL")

def fetch_puzzle_chunk(chunk_size=1000):
    response = requests.get(storage_url, stream=True)
    if response.status_code == 200:
        # Stream the response content to avoid loading the entire file into memory
        csv_data = io.StringIO()
        for chunk in response.iter_content(chunk_size=1024):
            if chunk:
                csv_data.write(chunk.decode('utf-8'))
                if csv_data.tell() > chunk_size:  # Stop reading after chunk_size characters
                    break
        
        csv_data.seek(0)
        # Read only the first chunk_size rows from the streamed data
        puzzle_data = pd.read_csv(csv_data, nrows=chunk_size)
        return puzzle_data
    else:
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get-puzzle', methods=['GET'])
def get_puzzle():
    global puzzle_data
    # If puzzle_data is empty or None, fetch a new chunk of puzzles
    if puzzle_data is None or len(puzzle_data) == 0:
        puzzle_data = fetch_puzzle_chunk()  # Fetch a new chunk of puzzles
    
    if puzzle_data is not None and len(puzzle_data) > 0:
        # Pick a random puzzle from the current chunk
        random_puzzle = puzzle_data.sample().iloc[0]
        
        # Remove the puzzle from the current chunk so it won't be used again
        puzzle_data = puzzle_data.drop(random_puzzle.name)

        puzzle_response = {
            'PuzzleId': str(random_puzzle['PuzzleId']),
            'FEN': random_puzzle['FEN'],
            'Moves': random_puzzle['Moves'],
            'Rating': int(random_puzzle['Rating'])  # Convert Rating to int
        }
        return jsonify(puzzle_response)
    else:
        return jsonify({"error": "Failed to fetch puzzle data."}), 500

if __name__ == '__main__':
    app.run(debug=True)
