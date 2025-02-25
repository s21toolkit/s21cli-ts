import { Client, TokenAuthProvider, UserAuthProvider } from "@s21toolkit/client"
import { Schema } from "@s21toolkit/client-schema"
import { command, option, optional, string } from "cmd-ts"

export const testCommand = command({
	name: "test",
	description: "Sends test request, displays detailed error messages",
	args: {
		username: option({
			short: "u",
			long: "username",
			type: string,
		}),
		password: option({
			short: "p",
			long: "password",
			type: string,
		}),
		token: option({
			short: "t",
			long: "token",
			type: optional(string),
		}),
	},
	async handler(argv) {
		const { username, password, token } = argv

		const auth = token
			? new TokenAuthProvider(token)
			: new UserAuthProvider(username, password)

		const client = new Client(Schema, auth)

		try {
			const data = await client.api.getCurrentUserExperience()

			console.log("Ok:", data.student?.getExperience.coinsCount ?? "<none>")
		} catch (error) {
			if (!(error instanceof Error)) {
				console.error("Unknown error")

				return
			}

			if (error.cause instanceof Response) {
				console.error("Request error:", error.cause.statusText)
				console.error("Headers:", error.cause.headers)
				console.error("Body:", await error.cause.text())

				return
			}

			console.error("Error:", error)
		}
	},
})
