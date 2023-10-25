import { createGqlQueryRequest } from "@s21toolkit/client"
import { command, option, positional } from "cmd-ts"
import { json } from "@/cli/arguments/json"
import { getDefaultClient } from "@/tools/getDefaultClient"

export const gqlCommand = command({
	name: "gql",
	description: "Performs arbitrary GQL query, returns raw JSON data",
	args: {
		query: positional({
			displayName: "query",
		}),
		variables: option({
			short: "v",
			long: "variables",
			type: json,
			defaultValue: () => ({}),
		}),
	},
	async handler(argv) {
		const { query, variables } = argv

		const client = getDefaultClient()

		const request = createGqlQueryRequest(
			query,
			variables as Record<string, unknown>,
		)

		const data = await client.request(request)

		console.log(JSON.stringify(data, undefined, 2))
	},
})
