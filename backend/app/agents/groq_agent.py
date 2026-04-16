from app.adapters.groq_adapter import generate
from app.runtime.response_formatter import ResponseFormatter


class GroqAgent:

    def __init__(self):
        self.formatter = ResponseFormatter()

    def run(self, system_prompt, model_name, input_payload):

        user_input = input_payload.get("text", "")

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input}
        ]

        raw_response = generate(messages, model_name)

        final_response = self.formatter.refine(raw_response)

        return {
            "response": final_response
        }