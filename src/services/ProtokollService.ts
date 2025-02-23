import { ProtokollResource } from "../Resources";
import { Protokoll } from "../model/ProtokollModel";
import { Pfleger } from "../../src/model/PflegerModel";
import mongoose from "mongoose";
import { Schema, model, Types } from "mongoose";
import { dateToString, stringToDate } from "./ServiceHelper";
import { error } from "console";
import { Eintrag } from "../model/EintragModel";
import { getAlleEintraege, getEintrag } from "./EintragService";

/**
 * Gibt alle Protokolls zurück, die für einen Pfleger sichtbar sind. Dies sind:
 * - alle öffentlichen (public) Protokolls
 * - alle eigenen Protokolls, dies ist natürlich nur möglich, wenn die pflegerId angegeben ist.
 */
// Quelle für getAlleProtokolle: Dariusz MC Lenachan
export async function getAlleProtokolle(pflegerId?: string): Promise<ProtokollResource[]> {
    let protokolle;
    const publicP = await Protokoll.find({ public: true }).exec();
    // if (pflegerId) {
    //     const foundPfleger = await Pfleger.findById(pflegerId).exec();
    //     if (!foundPfleger) {
    //         throw new Error("PflegerId not found");
    //     }
    //     const pflegerProtokolle = await Protokoll.find({ public: false, ersteller: new mongoose.Types.ObjectId(pflegerId) }).exec();
    //     if (pflegerProtokolle.length !== 0) {
    //         protokolle = pflegerProtokolle.concat(publicP);
    //     }
    // } else {
    //     protokolle = publicP;
    // }
    if(pflegerId){
        protokolle=await Protokoll.find({$or: [ { public: true }, {ersteller: pflegerId }]}).exec();
    }else{
        protokolle=await Protokoll.find({$or: [ { public: true }]}).exec();
    }
    const resultProts = [];

    for (const p of protokolle!) {
        const foundPfleger = await Pfleger.findById(p.ersteller).exec();
        if (!foundPfleger) {
            throw new Error("Ersteller of Protokoll not found")
        }
        // const eintragFound = await Eintrag.findById({protokoll: p.id}).exec();
        let getEintraege = await getAlleEintraege(p.id);
        if (!getEintraege) {
            throw new Error(`no protokoll with id found, cannot update`);
        }
        // Berechne die Gesamtmenge aller Einträge im Protokoll
        let gesamtMenge: number = getEintraege.map(eintrag => eintrag.menge).reduce((acc, menge) => acc + menge, 0);
         
        resultProts.push({
            id: p.id,
            patient: p.patient,
            datum: dateToString(p.datum),
            public: p.public,
            closed: p.closed,
            ersteller: foundPfleger.id,
            erstellerName: foundPfleger.name,
            updatedAt: dateToString(p.updatedAt!),
            gesamtMenge: gesamtMenge
        });
    }
    return resultProts;
}

/**
 * Liefer die Protokoll mit angegebener ID.
* Falls keine Protokoll gefunden wurde, wird ein Fehler geworfen.
*/
export async function getProtokoll(id: string): Promise<ProtokollResource> {
    const protokoll = await Protokoll.findById(id).exec();
    if (!protokoll) {
        throw new Error("protokoll not found")
    }
    // erstellerName aus dem Pfleger-Modell abrufen
    const ersteller = await Pfleger.findById(protokoll.ersteller).exec(); // Annahme: Es gibt ein Pfleger-Modell
    if (!ersteller) {
        throw new Error("Ersteller not found");
    }
    let getEintraege = await getAlleEintraege(protokoll.id);
        if (!getEintraege) {
            throw new Error(`no protokoll with id found, cannot update`);
        }
        // Berechne die Gesamtmenge aller Einträge im Protokoll
        let gesamtMenge: number = getEintraege.map(eintrag => eintrag.menge).reduce((acc, menge) => acc + menge, 0);
    return {
        id: protokoll.id,
        patient: protokoll.patient,
        datum: dateToString(protokoll.datum),
        public: protokoll.public,
        closed: protokoll.closed,
        ersteller: ersteller.id,
        erstellerName: ersteller.name,
        updatedAt: dateToString(protokoll.updatedAt!),
        gesamtMenge: gesamtMenge
    }

}

/**
 * Erzeugt das Protokoll.
 */
export async function createProtokoll(protokollResource: ProtokollResource): Promise<ProtokollResource> {


    const ersteller = await Pfleger.findById(protokollResource.ersteller).exec();
    if (!ersteller) {
        throw new Error("Ersteller not found");
    }
    const duplicateEntry = await Protokoll.findOne({ patient: protokollResource.patient, datum: stringToDate(protokollResource.datum) }).exec();
    if (duplicateEntry) {
        throw new Error("Unique constraint of Patient Datum combination violated");
    }
    const protokoll = await Protokoll.create({
        ersteller: ersteller.id,
        patient: protokollResource.patient,
        datum: stringToDate(protokollResource.datum),
        public: protokollResource.public,
        closed: protokollResource.closed,
        updatedAt: protokollResource.updatedAt
    })
    return {
        id: protokoll.id,
        patient: protokoll.patient,
        datum: dateToString(protokoll.datum),
        public: protokoll.public,
        closed: protokoll.closed,
        ersteller: ersteller.id,
        erstellerName: ersteller.name,
        updatedAt: dateToString(protokoll.updatedAt!),
        gesamtMenge: 0
    }
}

/**
 * Ändert die Daten einer Protokoll.
 */
export async function updateProtokoll(protokollResource: ProtokollResource): Promise<ProtokollResource> {
    if (!protokollResource.id) {
        throw new Error("Id is required");
    }
    const protokollFound = await Protokoll.findById(new mongoose.Types.ObjectId(protokollResource.id)).exec();
    if (!protokollFound) {
        throw new Error(`no protokoll with id found, cannot update`);
    }
    const ersteller = await Pfleger.findById(protokollResource.ersteller).exec();
    if (!ersteller) {
        throw new Error("Ersteller not found");
    }
    const duplicateEntry = await Protokoll.findOne({ patient: protokollResource.patient, datum: stringToDate(protokollResource.datum) }).exec();
    if (duplicateEntry) {
        throw new Error("Unique constraint of Patient Datum combination violated");
    }

    // protokollFound.ersteller = ersteller.id;
    protokollFound.patient = protokollResource.patient;
    protokollFound.datum = stringToDate(protokollResource.datum);

    if (protokollResource.public) {
        protokollFound.public = protokollResource.public;
    }
    if (protokollResource.closed) {
        protokollFound.closed = protokollResource.closed;
    }

    await protokollFound.save();
    return {
        id: protokollFound.id,
        patient: protokollFound.patient,
        datum: dateToString(protokollFound.datum),
        public: protokollFound.public,
        closed: protokollFound.closed,
        ersteller: ersteller.id,
        erstellerName: ersteller.name,
        updatedAt: dateToString(protokollFound.updatedAt!),
    }
}

/**
 * Beim Löschen wird die Protokoll über die ID identifiziert.
 * Falls keine Protokoll nicht gefunden wurde (oder aus
 * anderen Gründen nicht gelöscht werden kann) wird ein Fehler geworfen.
 * Wenn die Protokoll gelöscht wird, müssen auch alle zugehörigen Eintrags gelöscht werden.
 */
export async function deleteProtokoll(id: string): Promise<void> {
    const searchedProtokoll = await Protokoll.findById(id).exec();
    if (!searchedProtokoll) {
        throw new Error("Protokoll not found, cannot delete");
    }

    const searchedEintrag = await Eintrag.find({ protokoll: id }).exec();
    if (searchedEintrag.length !== 0) {
        await Eintrag.deleteMany({ protokoll: id });
    }
    await Protokoll.deleteOne({ _id: new mongoose.Types.ObjectId(id) });
}    
