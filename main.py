import requests
import pandas as pd
import io
import json
import os
from dotenv import load_dotenv

load_dotenv()

storage_url = os.getenv("STORAGE_URL")

# Fetch the CSV file from Firebase
response = requests.get(storage_url)

# Check if the request was successful
if response.status_code == 200:
    # Use io.StringIO to read the response content as if it were a file
    csv_data = io.StringIO(response.text)

    data = {}
    
    # Load CSV into pandas DataFrame
    df = pd.read_csv(csv_data)
    df_first_5 = df.head()

    # Iterate through each row in the DataFrame
    for index, row in df_first_5.iterrows():
        key = row['PuzzleId']  # Corrected to use 'PuzzleId'
        data[key] = {
            'FEN': row['FEN'],
            'Moves': row['Moves'],
            'Rating': row['Rating']
        }

    # Convert the dictionary to JSON format
    json_data = json.dumps(data, indent=4)  # Use json.dumps to convert dictionary to JSON string

    print("JSON data (pretty):")
    print(json_data)  # Pretty print the JSON

else:
    print(f"Failed to fetch file. Status code: {response.status_code}")
