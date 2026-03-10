import requests

OLLAMA_URL = "http://host.docker.internal:11434/api/generate"


def generate(prompt: str, model_name: str):

    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False
    }

    response = requests.post(OLLAMA_URL, json=payload)

    response.raise_for_status()

    data = response.json()

    return data.get("response", "")