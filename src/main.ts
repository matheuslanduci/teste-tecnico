import "dotenv/config";

import express from "express";
import { z } from "zod";
import { connectKafka, consumer, producer } from "./config/kafka";
import { connectMongo } from "./config/mongo";
import { TaskModel } from "./models/task";

const app = express();

app.use(express.json());

app.get("/tasks", async (req, res) => {
	const tasks = await TaskModel.find();

	res.json({ tasks });
});

app.post("/tasks", async (req, res) => {
	const schema = z.object({
		title: z.string(),
		description: z.string(),
		completed: z.boolean(),
	});

	const output = schema.safeParse(req.body);

	if (!output.success) {
		res.status(400);
		res.json({ error: output.error });
	}

	const task = output.data;

	await producer.send({
		messages: [
			{
				value: JSON.stringify({
					type: "task_created",
					task,
				}),
			},
		],
		topic: "tasks",
	});

	res.status(202);
	res.json({
		task,
	});
});

app.put("/tasks/:id", async (req, res) => {
	const schema = z.object({
		title: z.string(),
		description: z.string(),
		completed: z.boolean(),
	});

	const output = schema.safeParse(req.body);

	if (!output.success) {
		res.status(400);
		res.json({ error: output.error });
	}

	const task = await TaskModel.findById(req.params.id);

	if (!task) {
		res.status(404);
		res.json({ error: "Task not found" });
	}

	const updatedTask = await TaskModel.findByIdAndUpdate(
		req.params.id,
		output.data,
		{
			new: true,
		},
	);

	res.json({ task: updatedTask });
});

app.delete("/tasks/:id", async (req, res) => {
	const task = await TaskModel.findById(req.params.id);

	if (!task) {
		res.status(404);
		res.json({ error: "Task not found" });
	}

	await TaskModel.findByIdAndDelete(req.params.id);

	res.status(204);
	res.json({ task });
});

async function main() {
	await connectMongo();
	await connectKafka();

	app.listen(3000, () => {
		console.log("App running");
	});

	await consumer.subscribe({ topic: "tasks" });

	await consumer.run({
		eachMessage: async ({ topic, partition, message }) => {
			const schema = z.object({
				type: z.string(),
				task: z.object({
					title: z.string(),
					description: z.string(),
					completed: z.boolean(),
				}),
			});

			const output = schema.safeParse(
				JSON.parse(message.value?.toString() || "{}"),
			);

			if (!output.success) {
				console.error(output.error);
				return;
			}

			const { type, task } = output.data;

			console.log(type, task);

			if (type === "task_created") {
				const result = await TaskModel.create(task);

				console.log("Task created", result);
			}
		},
	});
}

main().catch(console.error);
