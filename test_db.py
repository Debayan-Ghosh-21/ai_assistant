import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from open_notebook.database.repository import repo_query

async def main():
    try:
        await repo_query("REMOVE FIELD chat_id ON TABLE accuracy_log;")
        await repo_query("DEFINE FIELD chat_id ON TABLE accuracy_log TYPE option<string>;")
        print("chat_id fixed")
        
        await repo_query("REMOVE FIELD insight_id ON TABLE accuracy_log;")
        await repo_query("DEFINE FIELD insight_id ON TABLE accuracy_log TYPE option<string>;")
        print("insight_id fixed")
        
        print("Done!")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(main())
