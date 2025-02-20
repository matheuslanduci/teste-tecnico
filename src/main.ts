import "dotenv/config";

import express from "express";
import { z } from "zod";
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

	const task = await TaskModel.create(output.data);

	res.status(201);
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

	app.listen(3000, () => {
		console.log("App running");
	});
}

main().catch(console.error);
