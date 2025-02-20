import { Schema, model } from "mongoose";

const schema = new Schema({
	title: { type: String, required: true },
	description: { type: String, required: true },
	completed: Boolean,
});

export const TaskModel = model("Task", schema);
