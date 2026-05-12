import asyncio
import os
import json
from dotenv import load_dotenv
from open_notebook.database.repository import repo_query, ensure_record_id

load_dotenv()

async def main():
    try:
        command_id = "command:3w1ih7ky35fplfy8reyf"
        result = await repo_query("SELECT result FROM command WHERE id = $id", {"id": ensure_record_id(command_id)})
        if result:
            print(json.dumps(result[0]['result'], indent=2))
        else:
            print("Command not found")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
