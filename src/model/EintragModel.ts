// import mongoose from "mongoose";
import {Schema, model, Types} from "mongoose";

export interface IEintrag{
	ersteller: Types.ObjectId
	protokoll: Types.ObjectId
	getraenk: string
	menge: number
	kommentar?: string
    createdAt?: Date

}


const myEitrag = new Schema<IEintrag>({
	ersteller: {type: Schema.Types.ObjectId, ref: "Pfleger", required: true },
	protokoll: {type: Schema.Types.ObjectId, ref: "Protokoll", required: true },
	getraenk: {type: String, required: true},
	menge: {type: Number, required: true},
	kommentar: {type: String},
    
},{
	timestamps: {createdAt: true, updatedAt: false}
})

export const Eintrag = model("Eintrag", myEitrag);


