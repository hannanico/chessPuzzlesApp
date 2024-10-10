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

def fetch_puzzles():
    global puzzle_data
    response = requests.get(storage_url)
    if response.status_code == 200:
        # Use io.StringIO to read the response content as if it were a file
        csv_data = io.StringIO(response.text)
        puzzle_data = pd.read_csv(csv_data)  # Store the data in memory
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
        # Pick a random puzzle from the dataset
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
