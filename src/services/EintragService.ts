import { EintragResource } from "../Resources";
import { Eintrag } from "../model/EintragModel";
import { Pfleger } from "../model/PflegerModel";
import { Protokoll } from "../model/ProtokollModel";
import { dateToString } from "./ServiceHelper";
import mongoose from "mongoose";

/**
 * Gibt alle Eintraege in einem Protokoll zurück.
 * Wenn das Protokoll nicht gefunden wurde, wird ein Fehler geworfen.
 */
export async function getAlleEintraege(protokollId: string): Promise<EintragResource[]> {
    const found = await Protokoll.findById(protokollId).exec();
    if(!found){
        throw new Error("Protokoll not found");
    }
    const eintragAll = await Eintrag.find({protokoll: found.id})
    .populate("ersteller", "id.name")
    .populate("protokoll", "id")
    .exec();

    

    return await Promise.all(eintragAll.map(async (eintrag)=>{
        const pfleger = await Pfleger.findById(eintrag.ersteller).exec();
        return{
            id: eintrag.id,
            getraenk: eintrag.getraenk,
            menge: eintrag.menge,
            kommentar: eintrag.kommentar,
            ersteller: pfleger!.id,
            erstellerName: pfleger!.name,
            createdAt: dateToString(eintrag.createdAt!),
            protokoll: protokollId
        }
    }))
}

/**
 * Liefert die EintragResource mit angegebener ID.
 * Falls kein Eintrag gefunden wurde, wird ein Fehler geworfen.
 */
export async function getEintrag(id: string): Promise<EintragResource> {
    const eintrag = await Eintrag.findById(id).exec();
    if (!eintrag) {
        throw new Error(`No eintrag found`);
    }
    const pfleger = await Pfleger.findById(eintrag.ersteller).exec();
    if (!pfleger) {
        throw new Error("Ersteller not found");
    }
    const protokoll = await Protokoll.findById(eintrag.protokoll).exec();
    if (!protokoll) {
        throw new Error("Protokoll not found");
    }
    return {
        id: eintrag.id,
        getraenk: eintrag.getraenk,
        menge: eintrag.menge,
        kommentar: eintrag.kommentar,
        ersteller: pfleger.id,
        erstellerName: pfleger.name,
        createdAt: dateToString(eintrag.createdAt!),
        protokoll: protokoll.id
    }
}

/**
 * Erzeugt eine Eintrag.
 * Daten, die berechnet werden aber in der gegebenen Ressource gesetzt sind, werden ignoriert.
 * Falls die Liste geschlossen (done) ist, wird ein Fehler wird geworfen.
 */
export async function createEintrag(eintragResource: EintragResource): Promise<EintragResource> {
    const pfleger = await Pfleger.findById(eintragResource.ersteller).exec();
    if (!pfleger) {
        throw new Error(`No pfleger found with id ${eintragResource.ersteller}`);
    }
    const protokoll = await Protokoll.findById(eintragResource.protokoll).exec();
    if (!protokoll) {
        throw new Error(`No protokoll found with id ${eintragResource.protokoll}`);
    }
    if (protokoll.closed) {
        throw new Error(`Protokoll is already closed`);
    }

    const eintrag = await Eintrag.create({
        getraenk: eintragResource.getraenk,
        menge: eintragResource.menge,
        kommentar: eintragResource.kommentar,
        ersteller: eintragResource.ersteller,
        protokoll: eintragResource.protokoll
    })
    return {
        id: eintrag.id,
        getraenk: eintrag.getraenk,
        menge: eintrag.menge,
        kommentar: eintrag.kommentar,
        ersteller: pfleger.id,
        erstellerName: pfleger.name,
        createdAt: dateToString(eintrag.createdAt!),
        protokoll: protokoll.id
    }
}


/**
 * Updated eine Eintrag. Es können nur Name, Quantity und Remarks geändert werden.
 * Aktuell können Eintrags nicht von einem Protokoll in einen anderen verschoben werden.
 * Auch kann der Creator nicht geändert werden.
 * Falls die Protokoll oder Creator geändert wurde, wird dies ignoriert.
 */
export async function updateEintrag(eintragResource: EintragResource): Promise<EintragResource> {
    if (!eintragResource.id) {
        throw new Error("Id is required");
    }
    const eintragFound = await Eintrag.findById(new mongoose.Types.ObjectId(eintragResource.id)).exec();
    if (!eintragFound) {
        throw new Error(`no Eintrag with id found, cannot update`);
    }
    const pfleger = await Pfleger.findById(eintragResource.ersteller).exec();
    if (!pfleger) {
        throw new Error(`No pfleger found with id ${eintragResource.ersteller}`);
    }
    const protokoll = await Protokoll.findById(eintragResource.protokoll).exec();
    if (!protokoll) {
        throw new Error(`No protokoll found with id ${eintragResource.protokoll}`);
    }
    if (protokoll.closed) {
        throw new Error(`Protokoll is already closed`);
    }


    // eintragFound.ersteller = pfleger.id;
    // eintragFound.protokoll = protokoll.id;
    eintragFound.getraenk = eintragResource.getraenk;
    eintragFound.menge = eintragResource.menge;
    eintragFound.kommentar = eintragResource.kommentar;

    await eintragFound.save();
    return {
        id: eintragFound.id,
        getraenk: eintragFound.getraenk,
        menge: eintragFound.menge,
        kommentar: eintragFound.kommentar,
        ersteller: pfleger.id,
        erstellerName: pfleger.name,
        createdAt: dateToString(eintragFound.createdAt!),
        protokoll: protokoll.id
    }
}


/**
 * Beim Löschen wird das Eintrag über die ID identifiziert. 
 * Falls es nicht gefunden wurde (oder aus
 * anderen Gründen nicht gelöscht werden kann) wird ein Fehler geworfen.
 */
export async function deleteEintrag(id: string): Promise<void> {
    const searchedEintrag = await Eintrag.findById(id).exec();
    if (!searchedEintrag) {
        throw new Error("Eintrag not found, cannot delete");
    }
    await Eintrag.deleteOne({ _id: new mongoose.Types.ObjectId(id)}).exec();
}

