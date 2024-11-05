import random
import firebase_admin
from firebase_admin import credentials, storage
from dotenv import load_dotenv
import pandas as pd
import json
import io
import os
from flask import Flask, jsonify, render_template

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
    # Choose a random part number and the corresponding file name
    part_number = random.randint(1, 500)
    part_filename = f'lichess_db_puzzle_part_{part_number}.csv'

    # Connect to Firebase storage and fetch the selected puzzle part file
    bucket = storage.bucket()
    blob = bucket.blob(part_filename)
    data = blob.download_as_text()

    # Load the CSV data into a DataFrame and randomly select one puzzle
    puzzles = pd.read_csv(io.StringIO(data))
    random_puzzle = puzzles.sample().iloc[0]
    return random_puzzle

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
