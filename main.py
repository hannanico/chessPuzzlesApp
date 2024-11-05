import random
import firebase_admin
from firebase_admin import credentials, storage
from dotenv import load_dotenv
import pandas as pd
import json
import io
import os
from flask import Flask, jsonify, render_template
import time

# Initialize Flask application
app = Flask(__name__)

# Load environment variables from .env file for local testing
load_dotenv()

# Load and parse Firebase credentials from environment variables
firebase_credentials = json.loads(os.getenv('FIREBASE_CREDENTIALS'))

# Initialize Firebase admin using the loaded credentials and specify the storage bucket
cred = credentials.Certificate(firebase_credentials)
firebase_admin.initialize_app(cred, {
    'storageBucket': 'chesspuzzels-5a9ab.appspot.com'
})

# Function to randomly select and load a chess puzzle from Firebase
def load_random_puzzle_part():
    max_attempts = 5  # Define the maximum number of retry attempts
    attempts = 0

    while attempts < max_attempts:
        part_number = random.randint(1, 500)  # Randomly select a part number
        part_filename = f'lichess_db_puzzle_part_{part_number}.csv'

        bucket = storage.bucket()
        blob = bucket.blob(part_filename)

        # Ensure the file actually exists before attempting to download
        if blob.exists():
            try:
                data = blob.download_as_text()  # Attempt to download the file
                puzzles = pd.read_csv(io.StringIO(data))  # Load the data into a DataFrame
                random_puzzle = puzzles.sample().iloc[0]  # Randomly select a puzzle
                return random_puzzle
            except Exception as e:
                print(f"Error processing the puzzle file: {e}")
                attempts += 1
                time.sleep(1)  # Wait briefly before retrying
        else:
            print(f"File not found: {part_filename}, retrying...")
            attempts += 1
            time.sleep(1)  # Wait briefly before retrying

    raise Exception("Failed to load a puzzle after several attempts")

# Define the route for the index page
@app.route('/')
def index():
    # Serve the main page to the client
    return render_template('index.html')

# Define the route to fetch a random puzzle via a GET request
@app.route('/get-puzzle', methods=['GET'])
def get_puzzle():
    try:
        # Load a random puzzle and prepare JSON data for response
        puzzle = load_random_puzzle_part()
        puzzle_response = {
            'PuzzleId': str(puzzle['PuzzleId']),
            'FEN': puzzle['FEN'],
            'Moves': puzzle['Moves'],
            'Rating': int(puzzle['Rating'])  # Ensure the rating is sent as an integer
        }
        return jsonify(puzzle_response)
    except Exception as e:
        # Handle errors and send error information back to the client
        return jsonify({"error": str(e)}), 500

# Run the Flask application only if this script is executed directly
if __name__ == '__main__':
    app.run(debug=True)
