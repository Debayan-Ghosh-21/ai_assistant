import asyncio
import os
from dotenv import load_dotenv
from open_notebook.database.repository import repo_query

load_dotenv()

async def main():
    try:
        sources = await repo_query("SELECT id, title, asset, full_text, command FROM source")
        for s in sources:
            if s.get('title') == "Processing...":
                print(f"ID: {s['id']}, Asset: {s['asset']}, Command: {s['command']}")
            elif s.get('title') and "Recurrent" in s.get('title'):
                 print(f"ID: {s['id']}, Title: {s['title']}, Asset: {s['asset']}, Command: {s['command']}, Content: {len(s.get('full_text') or '')} chars")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
