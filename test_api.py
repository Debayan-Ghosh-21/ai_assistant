import httpx
import asyncio

async def test():
    # Make a request to the backend directly
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            print("Sending request to FastAPI...")
            response = await client.post(
                "http://localhost:5055/api/accuracy-logs",
                json={"chat_id": "chat_session:dummy", "insight_id": "403l2druwp26wi2clfg5"}
            )
            print("Status code:", response.status_code)
            print("Response:", response.text)
        except Exception as e:
            print("Exception:", e)

if __name__ == "__main__":
    asyncio.run(test())
