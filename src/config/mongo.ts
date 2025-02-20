import mongoose from "mongoose";
import { env } from "./env";

export async function connectMongo() {
	await mongoose.connect(env.DATABASE_URL, {
		authSource: "admin",
	});
}
