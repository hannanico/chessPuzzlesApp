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
puzzle_data = None  # Global variable to store the data in memory

def fetch_puzzles(chunk_size=1000):
    global puzzle_data
    response = requests.get(storage_url, stream=True)  # Stream the response to handle large files
    if response.status_code == 200:
        # Stream the response content in chunks to avoid loading the entire file into memory
        csv_data = io.StringIO()
        for chunk in response.iter_content(chunk_size=1024):
            if chunk:
                csv_data.write(chunk.decode('utf-8'))
        
        csv_data.seek(0)
        # Read only a limited number of rows (chunk_size) to reduce memory usage
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
    if puzzle_data is None:
        puzzle_data = fetch_puzzles()  # Fetch and cache the data on the first request
    
    if puzzle_data is not None:
        # Pick a random puzzle from the loaded chunk of the dataset
        random_puzzle = puzzle_data.sample().iloc[0]
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
