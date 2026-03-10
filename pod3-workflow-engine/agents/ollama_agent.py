from adapters.ollama_adapter import generate


class OllamaAgent:

    def run(self, system_prompt, model_name, input_payload):

        user_input = input_payload.get("text")

        prompt = f"{system_prompt}\n\nUser: {user_input}"

        response = generate(prompt, model_name)

        return {

            "response": response

        }
