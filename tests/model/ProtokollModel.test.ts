import { HydratedDocument } from "mongoose";
import { IProtokoll, Protokoll } from "../../src/model/ProtokollModel";
import { IPfleger, Pfleger } from "../../src/model/PflegerModel";


let pfleger01: HydratedDocument<IPfleger>;
// let protokoll01: HydratedDocument<IProtokoll>; 
beforeEach(async () => {
    pfleger01 = await Pfleger.create({ name: "pfleger01", password: "1234", admin: false });
    // await pfleger01.save() brauche ich nicht, weil .create den Pfleger für mich in der Datenbank speichert
});

test("test if beforeEach is defined", async () => {
    expect(pfleger01).toBeDefined();
})

test("Create Protokoll", async () => {
    const protokoll01 = await Protokoll.create({
        ersteller: pfleger01._id,
        patient: "patient01",
        datum: new Date(2001, 3, 18)
    });
    // await protokoll01.save()
    // const myProtokollFound: HydratedDocument<IProtokoll> | null = await Protokoll.findById(protokoll01._id).exec();

    expect(protokoll01).toBeDefined;


    // const p= await Protokoll.find({ ersteller: pfleger01._id }).exec();

    expect(protokoll01.ersteller).toEqual(pfleger01._id);
    expect(protokoll01.patient).toBe("patient01");
    expect(protokoll01.datum).toEqual(new Date(2001, 3, 18));
});

test("Retrieve Protokoll", async () => {
    // Erstellen des Protokolls
    const protokoll01 = await Protokoll.create({
        ersteller: pfleger01._id,
        patient: "patient01",
        datum: new Date(2001, 3, 18)
    });

    // Suchen nach Protokollen, die von pfleger01 erstellt wurden
    const myProtokollFound = await Protokoll.find({ ersteller: pfleger01._id }).exec();

    // Überprüfen, ob mindestens ein Protokoll gefunden wurde
    expect(myProtokollFound.length).toBeGreaterThan(0);

    // Überprüfen der Eigenschaften des gefundenen Protokolls
    expect(myProtokollFound[0].patient).toEqual("patient01");
    expect(myProtokollFound[0].datum).toEqual(new Date(2001, 3, 18));

    // Überprüfen, ob das ersteller-Feld des gefundenen Protokolls mit pfleger01._id übereinstimmt
    expect(myProtokollFound[0].ersteller).toEqual(pfleger01._id);
});

test("Create Protokoll - Fehlerfall: Fehlendes erforderliches Feld", async () => {
    // ein Protokoll zu erstellen, ohne das erforderliche Feld 'patient' anzugeben
    try {
        const protokollWithoutPatient = await Protokoll.create({
            ersteller: pfleger01._id,
            datum: new Date(2001, 3, 18)
        });
        fail("Das Erstellen des Protokolls sollte fehlschlagen, da das erforderliche Feld 'patient' fehlt.");
    } catch (error) {

        expect(error instanceof Error).toBe(true);
    }
});

test("Delete Protokoll", async () => {

    const protokollToDelete = await Protokoll.create({
        ersteller: pfleger01._id,
        patient: "patient01",
        datum: new Date(2001, 3, 18)
    });

    // Lösche das Protokoll
    await Protokoll.deleteOne({ _id: protokollToDelete._id });

    // Versuche, das gelöschte Protokoll abzurufen
    const deletedProtokoll = await Protokoll.findById(protokollToDelete._id);

    // Überprüfe, ob das gelöschte Protokoll nicht mehr gefunden wird (null zurückgegeben wird)
    expect(deletedProtokoll).toBeNull();
});

test("Search Protokoll", async () => {
    const protokoll01 = await Protokoll.create({
        ersteller: pfleger01._id,
        patient: "patient01",
        datum: new Date(2001, 3, 18)
    });
    const myProtokollFound = await Protokoll.findById(protokoll01._id).exec();
    if (myProtokollFound) {
        expect(myProtokollFound).toBeDefined(); // Überprüfen, ob der Eintrag gefunden wurde

        expect(myProtokollFound.ersteller).toStrictEqual(protokoll01.ersteller); // Überprüfen, ob der Ersteller übereinstimmt
        expect(myProtokollFound.patient).toBe(protokoll01.patient); // Überprüfen, ob der Patient übereinstimmt
        expect(myProtokollFound.datum).toStrictEqual(protokoll01.datum); // Überprüfen, ob das Datum übereinstimmt
    }
});

test("Update Protokoll", async () => {
    const protokoll01 = await Protokoll.create({
        ersteller: pfleger01._id,
        patient: "patient01",
        datum: new Date(2001, 3, 18)
    });
    let pfleger02 = await Pfleger.create({
        name: pfleger01._id,
        password: "patient02"
    });
    const myProtokollUpdated = await Protokoll.updateOne({ _id: protokoll01._id }, { ersteller: pfleger02._id, datum: new Date(2012, 5, 23) });
    expect(myProtokollUpdated.modifiedCount).toBe(1);
    const updatedProtokoll = await Protokoll.findById(protokoll01._id);
    if (updatedProtokoll) {
        expect(updatedProtokoll.ersteller).toStrictEqual(pfleger02._id);
        expect(updatedProtokoll.datum).toEqual(new Date(2012, 5, 23));
    }
});

// import { logger } from "../src/logger"

// test("Logger", () => {
//     logger.debug("Hello Debug")
//     logger.info("Hello Info");
//     logger.warn("Hello Warn");
//     logger.error("Hello Error");
//     logger.http("Hello HTTP");
// })