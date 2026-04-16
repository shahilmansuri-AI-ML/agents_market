class StrandsAdapter:

    def run(self, agent_row, input_payload):

        workflow_definition = agent_row["workflow_definition"]

        # Strands executes no-code workflow
        result = self.execute_strands_workflow(
            workflow_definition,
            input_payload
        )

        return result

    def execute_strands_workflow(self, workflow, input_data):

        # call strands runtime here

        return {
            "result": "executed using strands"
        }
