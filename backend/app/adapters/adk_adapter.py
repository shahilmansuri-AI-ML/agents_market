class ADKAdapter:

    def run(self, agent_row, input_payload):

        # load ADK agent config

        result = self.execute_adk_agent(input_payload)

        return result
