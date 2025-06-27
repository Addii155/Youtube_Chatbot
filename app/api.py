import requests
from dotenv import load_dotenv
import os

load_dotenv()
API_KEY = os.getenv('YOUTUBE_API_KEY')

def get_comments(video_id: str):
    url = f"https://www.googleapis.com/youtube/v3/commentThreads"
    params = {
        'part': 'snippet',
        'videoId': video_id,
        'key': API_KEY,
        'maxResults': 100,
    }

    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise Exception(f"YouTube API error: {response.status_code} - {response.text}")

    data = response.json()
    comments = []
    for item in data.get('items', []):
        snippet = item['snippet']['topLevelComment']['snippet']
        comments.append({
            "author": snippet.get("authorDisplayName"),
            "comment": snippet.get("textDisplay")
        })

    return comments
