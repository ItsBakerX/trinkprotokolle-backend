import {Schema, model, Types} from "mongoose";

export interface IProtokoll{
	ersteller: Types.ObjectId
	patient: string
	datum: Date
	public?: boolean
    closed?: boolean
    updatedAt?: Date
}


const myProtokoll = new Schema<IProtokoll>({
	ersteller: {type: Schema.Types.ObjectId, ref: "Pfleger", required: true },
	patient: {type: String, required: true},
	datum: {type: Date, required: true},
	public: {type: Boolean, default: false},
    closed: {type: Boolean, default: false},

},{
	timestamps: {createdAt: false, updatedAt: true}
})

export const Protokoll = model("Protokoll", myProtokoll);

