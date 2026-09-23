import os

import uvicorn
from dotenv import load_dotenv


load_dotenv()

uvicorn.run(
    "main:app",
    host=os.getenv("API_HOST", "127.0.0.1"),
    port=int(os.getenv("API_PORT", "2010")),
    reload=True,
)
