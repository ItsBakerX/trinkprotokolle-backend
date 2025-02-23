// import mongoose from "mongoose";
import { Model, Schema, model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IPfleger {
	name: string
	password: string
	admin?: boolean

}
// Put all user instance methods in this interface:
export interface IPflegerMethods {
	isCorrectPassword(candidatePassword: string): Promise<boolean>;
   }
   type PflegerModel = Model<IPfleger, {}, IPflegerMethods>;
// a schema that knows about IPflegerMethods
// Definiere das Schema für den Pfleger, inklusive seiner Methoden
const myPfleger = new Schema<IPfleger, PflegerModel, IPflegerMethods>({
	name: { type: String, required: true, uniqe: true },
	password: { type: String, required: true },
	admin: { type: Boolean, default: false }
})

myPfleger.method("isCorrectPassword",
		async function (candidatePassword: string): Promise<boolean> {
			const pfleger = this;
			// isModified() prüft ob etwas geändert wurde isModified("password") überprüft nur ob das Passwort geändert wurde
	if (pfleger.isModified("password")) {
		throw new Error("Passwort wurde noch nicht gehasht");
	}
	return bcrypt.compare(candidatePassword, pfleger.password);
		});

// Vor dem Speichern das Passwort hashen
myPfleger.pre("save", async function () {
	const pfleger = this;
	if (pfleger.isModified("password")) {
		// Passwort hashen und ersetzen
		const hashedPassword = await bcrypt.hash(pfleger.password, 10);
		pfleger.password = hashedPassword;
	}
});

myPfleger.pre(["updateOne", "updateMany", "findOneAndUpdate"], async function () {
	const update = this.getUpdate();
	if (update && "password" in update) {
		// Passwort hashen und ersetzen
		const hashedPassword = await bcrypt.hash(update.password, 10);
		update.password = hashedPassword;
	}
});
// const User = model<IUser, UserModel>('User', schema);
export const Pfleger = model("Pfleger", myPfleger);



   


