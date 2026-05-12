from youtube_transcript_api import YouTubeTranscriptApi
import json

video_id = '4KpRP-YUw6c'
try:
    api = YouTubeTranscriptApi()
    transcript_list = api.list(video_id)
    print("Available transcripts:")
    for t in transcript_list:
        print(f"- {t.language_code} ({t.language}), generated: {t.is_generated}")
    
    preferred_langs = ["en", "pt", "es", "de", "nl", "en-GB", "fr", "hi", "ja"]
    print(f"\nTrying to find transcript for: {preferred_langs}")
    
    try:
        t = transcript_list.find_manually_created_transcript(preferred_langs)
        print(f"Found manual: {t.language_code}")
    except Exception as e:
        print(f"No manual transcript found: {e}")
        
    try:
        t = transcript_list.find_generated_transcript(preferred_langs)
        print(f"Found generated: {t.language_code}")
    except Exception as e:
        print(f"No generated transcript found: {e}")

except Exception as e:
    print(f"Error: {e}")
