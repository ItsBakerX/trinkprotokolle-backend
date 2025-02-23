import { PflegerResource } from "../Resources";
import mongoose from "mongoose";
import { Pfleger } from "../model/PflegerModel";
import { Protokoll } from "../model/ProtokollModel";
import { deleteProtokoll } from "./ProtokollService";


/**
 * Die Passwörter dürfen nicht zurückgegeben werden.
 */
export async function getAllePfleger(): Promise<PflegerResource[]> {
    const pflegern = await Pfleger.find().exec();
    return pflegern.map(pfleger => {
        return {
            id: pfleger.id,
            name: pfleger.name,
            admin: pfleger.admin!
        }
    })
}

/**
 * Erzeugt einen Pfleger. Das Password darf nicht zurückgegeben werden.
 */
export async function createPfleger(pflegerResource: PflegerResource): Promise<PflegerResource> {

    function getPassword() {
        throw new Error("Password is required!");
    }
    const duplicateEntry = await Pfleger.findOne({ name: pflegerResource.name }).exec();
    if (duplicateEntry) {
        throw new Error("Duplicate, name pfleger already exists");
    }

    let pflegerPassword = pflegerResource.password || getPassword();
    const pfleger = await Pfleger.create({
        name: pflegerResource.name,
        admin: pflegerResource.admin,
        password: pflegerPassword
    })
    return {
        id: pfleger.id,
        name: pfleger.name,
        admin: pfleger.admin!
    }
}


/**
 * Updated einen Pfleger.
 */
export async function updatePfleger(pflegerResource: PflegerResource): Promise<PflegerResource> {
    const pflegerFound = await Pfleger.findById(pflegerResource.id).exec();
    if (!pflegerFound) {
        throw new Error(`no pfleger with id ${pflegerResource.id} found, cannot update`);
    }
    
    if (pflegerResource.name) {
        pflegerFound.name = pflegerResource.name;
    }
    if (pflegerResource.password) {
        pflegerFound.password = pflegerResource.password;
    }
    if (pflegerResource.admin) {
        pflegerFound.admin = pflegerResource.admin;
    }
    await pflegerFound.save();
    return {
        id: pflegerFound.id,
        name: pflegerFound.name,
        admin: pflegerFound.admin!
    }
}

/**
 * Beim Löschen wird der Pfleger über die ID identifiziert.
 * Falls Pfleger nicht gefunden wurde (oder aus
 * anderen Gründen nicht gelöscht werden kann) wird ein Fehler geworfen.
 * Wenn der Pfleger gelöscht wird, müssen auch alle zugehörigen Protokolls und Eintrags gelöscht werden.
 */
export async function deletePfleger(id: string): Promise<void> {
    const searchedPfleger = await Pfleger.findById(id).exec();
    if (!searchedPfleger) {
        throw new Error("Pfleger not found, cannot delete");
    }
    const searchedProtokolle = await Protokoll.find({ersteller: id}).exec();
    for(let p of searchedProtokolle){
        await deleteProtokoll(p.id);
    }
    await Pfleger.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
}