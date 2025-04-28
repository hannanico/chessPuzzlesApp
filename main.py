import random
import firebase_admin
from firebase_admin import credentials, storage
from dotenv import load_dotenv
import pandas as pd
import json
import io
import os
from flask import Flask, jsonify, render_template, request, session
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
def load_random_puzzle_part(minRating, maxRating):
    #Define the maximum number of retry attempts
    #I had to do all of this mainly because some of the files were not uploaded to the bucket
    #Will fix this in the future
    max_attempts = 5
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
                puzzles['Rating'] = puzzles['Rating'].astype(int)  # Ensure the rating column is an integer

                # Filter the puzzles based on the rating range
                filtered_puzzles = puzzles[(puzzles['Rating'] >= minRating) & (puzzles['Rating'] <= maxRating)]

                if filtered_puzzles.empty:
                    raise Exception("No puzzles found within the specified rating range")
                else:
                    random_puzzle = filtered_puzzles.sample().iloc[0].to_dict()
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
    minRating = request.args.get('minRating', default=400, type=int)
    maxRating = request.args.get('maxRating', default=3500, type=int)

    try:
        # Load a random puzzle and prepare JSON data for response
        puzzle = load_random_puzzle_part(minRating,maxRating)
        puzzle_response = {
            'PuzzleId': str(puzzle['PuzzleId']),
            'FEN': puzzle['FEN'],
            'Moves': puzzle['Moves'],
            'Rating': int(puzzle['Rating']),
        }
        return jsonify(puzzle_response)
    except Exception as e:
        # Handle errors and send error information back to the client
        return jsonify({"error": str(e)}), 500

# Run the Flask application only if this script is executed directly
if __name__ == '__main__':
    app.run(debug=True)
