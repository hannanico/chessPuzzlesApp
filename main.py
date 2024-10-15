import random
import firebase_admin
from firebase_admin import credentials, storage
import pandas as pd
import json
import io
import os
from flask import Flask, jsonify, render_template

# Initialize the Flask app
app = Flask(__name__)

# Load Firebase credentials from the enviromental variable
firebase_credentials_str = json.loads(os.getenv('FIREBASE_CREDENTIALS'))

if not firebase_credentials_str:
    raise ValueError("FIREBASE_CREDENTIALS environment variable not set or empty.")

# Replace escaped newlines with actual newlines
firebase_credentials_str = firebase_credentials_str.replace('\\n', '\n')

# Load the credentials from the JSON string
firebase_credentials = json.loads(firebase_credentials_str)

# Initialize Firebase connection
cred = credentials.Certificate(firebase_credentials)  # Path to the downloaded JSON file
firebase_admin.initialize_app(cred, {
    'storageBucket': 'chesspuzzels-5a9ab.appspot.com'  # Replace with your Firebase bucket name
})

# Function to load a random puzzle part from Firebase
def load_random_puzzle_part():
    # Randomly select a part number from the available parts (assuming 500 parts for now)
    part_number = random.randint(1, 500)
    part_filename = f'lichess_db_puzzle_part_{part_number}.csv'

    # Fetch the file from Firebase Storage
    bucket = storage.bucket()
    blob = bucket.blob(part_filename)
    data = blob.download_as_text()

    # Load the CSV content into a pandas DataFrame
    puzzles = pd.read_csv(io.StringIO(data))

    # Select a random puzzle from the part
    random_puzzle = puzzles.sample().iloc[0]
    return random_puzzle

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get-puzzle', methods=['GET'])
def get_puzzle():
    try:
        # Load a random puzzle
        puzzle = load_random_puzzle_part()

        # Prepare the response
        puzzle_response = {
            'PuzzleId': str(puzzle['PuzzleId']),
            'FEN': puzzle['FEN'],
            'Moves': puzzle['Moves'],
            'Rating': int(puzzle['Rating'])  # Convert Rating to int
        }
        return jsonify(puzzle_response)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
