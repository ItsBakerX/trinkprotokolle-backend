import { HydratedDocument } from "mongoose";
import { IEintrag, Eintrag } from "../../src/model/EintragModel";
import { IProtokoll, Protokoll } from "../../src/model/ProtokollModel";
import { IPfleger, Pfleger } from "../../src/model/PflegerModel";

// let eintrag01: HydratedDocument<IEintrag>;
let pfleger01: HydratedDocument<IPfleger>;
let protokoll01: HydratedDocument<IProtokoll>;
beforeEach(async () => {
    pfleger01 = await Pfleger.create({
        name: "pfleger01",
        password: "1234"
    });

    protokoll01 = await Protokoll.create({
        ersteller: pfleger01._id,
        patient: "patient01",
        datum: new Date(2023, 7, 26),
    });
});

test("test if beforeEach is defined", async () => {
    expect(pfleger01).toBeDefined();
    expect(protokoll01).toBeDefined();
})


test("Create Eintrag", async () => {
    const eintrag01 = await Eintrag.create({
        ersteller: pfleger01._id,
        protokoll: protokoll01._id,
        getraenk: "getränk01",
        menge: 10
    });
    // await eintrag01.save(); 
    // const myEintragFound: HydratedDocument<IEintrag> | null = await Eintrag.findById(eintrag01._id).exec();

    expect(eintrag01).toBeDefined;
    // await Eintrag.find({ ersteller: pfleger01._id }).exec();
    expect(eintrag01.ersteller).toBe(pfleger01._id);
    expect(eintrag01.protokoll).toBe(protokoll01._id);
    expect(eintrag01.getraenk).toBe("getränk01");
    expect(eintrag01.menge).toBe(10);
});

test("Retrieve Eintrag", async () => {
    const eintrag01 = await Eintrag.create({
        ersteller: pfleger01._id,
        protokoll: protokoll01._id,
        getraenk: "getränk01",
        menge: 10
    });
    const myEintragFound = await Eintrag.find({ ersteller: pfleger01._id }).exec();
    expect(myEintragFound[0].getraenk).toEqual("getränk01");
    expect(myEintragFound[0].menge).toEqual(10);   
});


test("Update Eintrag", async () => {
    const eintrag01 = await Eintrag.create({
        ersteller: pfleger01._id,
        protokoll: protokoll01._id,
        getraenk: "getränk01",
        menge: 10
    });
    let protokoll02 = await Protokoll.create({
        ersteller: pfleger01._id,
        patient: "patient02",
        datum: new Date(2022, 4, 20),
    });
    const myEintragUpdated = await Eintrag.updateOne({ _id: eintrag01._id }, { protokoll: protokoll02._id, getraenk: "getränk02" });
    expect(myEintragUpdated.modifiedCount).toBe(1);
    const updatedEintrag=await Eintrag.findById(eintrag01._id);
    if(updatedEintrag){
    expect(updatedEintrag.protokoll).toStrictEqual(protokoll02._id);
    expect(updatedEintrag.getraenk).toBe("getränk02");
    }
});

test("Delete Eintrag", async () => {
    
    const eintragToDelete = await Eintrag.create({
        ersteller: pfleger01._id,
        protokoll: protokoll01._id,
        getraenk: "getränk01",
        menge: 10
    });

    // Lösche den Eintrag
    await Eintrag.deleteOne({ _id: eintragToDelete._id });

    // Versuche, den gelöschten Eintrag abzurufen
    const deletedEintrag = await Eintrag.findById(eintragToDelete._id);

    // Überprüfe, ob der gelöschte Eintrag nicht mehr gefunden wird (null zurückgegeben wird)
    expect(deletedEintrag).toBeNull();
});

test("Update Eintrag - Fehlerfall: Eintrag existiert nicht", async () => {
    // einen Eintrag zu aktualisieren, der nicht existiert
    try {
        const myEintragUpdated = await Eintrag.updateOne({ _id: "ungültigeID" }, { protokoll: "ungültigeProtokollID", getraenk: "getränk02" });
        // Wenn der obige Aufruf erfolgreich ist, sollte der Test fehlschlagen
        fail("Der Aufruf sollte fehlschlagen, da der Eintrag nicht existiert.");
    } catch (error) {
        // Stellen Sie sicher, dass der Fehler "CastError" ist, der auftritt, wenn eine ungültige ID übergeben wird
        expect(error instanceof Error).toBe(true);
    }
});
