import type { Client } from "@s21toolkit/client"
import { command, option, string } from "cmd-ts"
import dayjs from "dayjs"
import { getGoalIdFromNodeCode } from "@/adapters/getGoalIdFromNodeCode"
import { getAuthorizedClient } from "@/auth"
import { duration } from "@/cli/arguments/duration"
import { resolveGoalIdFromGitRemote } from "@/git"

async function resolveProjectModuleId(client: Client, projectCode: string) {
	if (projectCode === "this") {
		return await resolveGoalIdFromGitRemote()
	}

	const { user } = await client.api.getCurrentUser()

	const goalId = await getGoalIdFromNodeCode(
		client,
		projectCode,
		user.getCurrentUser.currentSchoolStudentId,
	)

	return goalId
}

export const watchForSlotsCommand = command({
	aliases: ["watch", "wfs", "watch-for-slots"],
	name: "wfs",
	description: "Watches for evaluation slots for the specified project",
	args: {
		projectCode: option({
			long: "project",
			short: "p",
			description:
				"Project to seek slots for, use `this` to infer from current repository (default)",
			type: string,
			defaultValue: () => "this",
		}),
		timeAhead: option({
			long: "time-ahead",
			short: "t",
			description: "Time period to seek slots in",
			defaultValue: () => 60 * 60 * 12,
			type: duration,
		}),
	},
	async handler(args) {
		const client = getAuthorizedClient()

		const moduleId = await resolveProjectModuleId(client, args.projectCode)

		const module = await client.api.calendarGetModule({ moduleId })

		const taskId = module.student.getModuleById.currentTask.task.id

		console.log(
			`Watching on project ${module.student.getModuleById.moduleTitle}...`,
		)

		for (;;) {
			const slots =
				await client.api.calendarGetNameLessStudentTimeslotsForReview({
					from: dayjs().toDate(),
					to: dayjs().add(args.timeAhead, "seconds").toDate(),
					taskId,
				})

			const { timeSlots } =
				slots.student.getNameLessStudentTimeslotsForReview
			if (timeSlots.length === 0) {
				continue
			}

			const startTime = timeSlots[0]!
				.validStartTimes[0]! as unknown as string

			await client.api.calendarAddBookingToEventSlot({
				answerId:
					module.student.getModuleById.trajectory.levels[0]!
						.goalElements[0]!.points[0]!.studentTask.lastAnswer.id,
				wasStaffSlotChosen: timeSlots[0]!.staffSlot.toString(),
				startTime,
				isOnline: false,
			})

			console.log(
				`Subscribed on slot ${new Date(startTime).toLocaleString()}`,
			)
		}
	},
})
