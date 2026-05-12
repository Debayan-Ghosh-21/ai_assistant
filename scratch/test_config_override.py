import content_core.config
from content_core.processors.youtube import extract_youtube_transcript
from content_core.common import ProcessSourceState
import asyncio

async def main():
    # Before override
    print(f"Config before: {content_core.config.CONFIG.get('youtube_transcripts')}")
    
    # Override
    content_core.config.CONFIG["youtube_transcripts"] = {"preferred_languages": ["hi"]}
    print(f"Config after: {content_core.config.CONFIG.get('youtube_transcripts')}")
    
    # Test extraction (mock state)
    state = ProcessSourceState(url="https://youtu.be/4KpRP-YUw6c")
    result = await extract_youtube_transcript(state)
    print(f"Extraction success: {len(result['content']) > 0}")
    print(f"Content length: {len(result['content'])}")
    print(f"Title: {result['title']}")

if __name__ == "__main__":
    asyncio.run(main())
