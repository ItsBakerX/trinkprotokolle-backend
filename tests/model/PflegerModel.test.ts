import { HydratedDocument } from "mongoose";
import { IPfleger, Pfleger } from "../../src/model/PflegerModel";
import bcrypt from "bcryptjs";

let pfleger01: HydratedDocument<IPfleger>;

beforeEach(async () => {
    pfleger01 = await Pfleger.create({ name: "pfleger01", password: "1234", admin: false });
});

test("test if beforeEach is defined", async () => {
    expect(pfleger01).toBeDefined();
})

test("Create Pfleger", async () => {
    // const myPflegerFound: HydratedDocument<IPfleger> | null = await Pfleger.findById(pfleger01._id).exec(); 
    // const myPflegerFound2: HydratedDocument<IPfleger> | null = await Pfleger.findById(pfleger02._id).exec(); 

    const pfleger = await Pfleger.create({
        name: "pfleger02",
        password: "1234",
        admin: false
    });
    const passwordMatch = await bcrypt.compare(
        "1234",
        pfleger!.password
    );
    expect(passwordMatch).toBe(true);

    expect(pfleger).toBeDefined;

    expect(pfleger.name).toBe("pfleger02");
    // expect(pfleger.password).toBe("1234");
    expect(pfleger.admin).toBe(false);
});

test("Retrieve Pfleger", async () => {
    // Erstellen des Pflegers
    const pfleger = await Pfleger.create({
        name: "pfleger02",
        password: "1234",
        admin: false
    });

    // Suchen nach Pflegern, die den Namen pfleger02 haben
    const myPflegerFound = await Pfleger.find({ name: "pfleger02" }).exec();

    // Überprüfen, ob mindestens ein Pfleger gefunden wurde
    expect(myPflegerFound.length).toBeGreaterThan(0);

    // Überprüfen der Eigenschaften des gefundenen Pflegers
    expect(myPflegerFound[0].name).toEqual("pfleger02");
    const passwordMatch = await bcrypt.compare(
        "1234",
        myPflegerFound[0]!.password
    );
    expect(passwordMatch).toBe(true);
    // expect(myPflegerFound[0].password).toEqual("1234");
    expect(myPflegerFound[0].admin).toEqual(false);
});

test("Create Pfleger - Fehlerfall: Fehlendes erforderliches Feld", async () => {
    // ein Pfleger zu erstellen, ohne das erforderliche Feld 'name' anzugeben
    try {
        const pflegerWithoutname = await Pfleger.create({
            password: "1234"
        });
        fail("Das Erstellen des Pflegers sollte fehlschlagen, da das erforderliche Feld 'name' fehlt.");
    } catch (error) {

        expect(error instanceof Error).toBe(true);
    }
});

test("Delete Pfleger", async () => {

    const pflegerToDelete = await Pfleger.create({
        name: "pfleger02",
        password: "1234",
        admin: false
    });

    // Lösche den Pfleger
    await Pfleger.deleteOne({ _id: pflegerToDelete._id });

    // Versuche, das gelöschte Pfleger abzurufen
    const deletedPfleger = await Pfleger.findById(pflegerToDelete._id);

    // Überprüfe, ob das gelöschte Pfleger nicht mehr gefunden wird (null zurückgegeben wird)
    expect(deletedPfleger).toBeNull();
});

test("Search Pfleger", async () => {
    const pfleger = await Pfleger.create({
        name: "pfleger02",
        password: "1234",
        admin: false
    });
    const myPflegerFound = await Pfleger.findById(pfleger._id).exec();
    if (myPflegerFound) {
        expect(myPflegerFound).toBeDefined();

        expect(myPflegerFound.name).toStrictEqual(pfleger.name);
        expect(myPflegerFound.password).toBe(pfleger.password);
        expect(myPflegerFound.admin).toStrictEqual(pfleger.admin);
    }
});

test("Update Pfleger", async () => {
    const pfleger = await Pfleger.create({
        name: "pfleger02",
        password: "1234",
    });
    // const myPflegerUpdated = await Pfleger.updateOne({ name: "pfleger02" }, { name: "pflegerNew", admin: true });
    //                                                  welches Objekt          was wird geändert
    const myPflegerUpdated = await Pfleger.updateOne({ _id: pfleger._id }, { name: "pflegerNew", admin: true });
    expect(myPflegerUpdated.modifiedCount).toBe(1);
    // const updatedPfleger=await Pfleger.findById({_id: pfleger._id});
    // const updatedPfleger=await Pfleger.findOne({name: "pflegerNew"});
    const updatedPfleger = await Pfleger.findOne({ _id: pfleger._id });
    const passwordMatch = await bcrypt.compare(
        "1234",
        updatedPfleger!.password
    );
    expect(passwordMatch).toBe(true);
    if (updatedPfleger) {
        expect(updatedPfleger.name).toStrictEqual("pflegerNew");
        expect(updatedPfleger.admin).toEqual(true);
    }
});

test("Update Pfleger - Fehlerfall: Pfleger existiert nicht", async () => {
    // einen Pfleger zu aktualisieren, der nicht existiert
    try {
        const myPflegerUpdated = await Pfleger.updateOne({ _id: "ungültigeID" }, { name: "ungültigeName", password: "abcd" });
        // Wenn der obige Aufruf erfolgreich ist, sollte der Test fehlschlagen
        fail("Der Aufruf sollte fehlschlagen, da der Pfleger nicht existiert.");
    } catch (error) {
        // Stellen Sie sicher, dass der Fehler "CastError" ist, der auftritt, wenn eine ungültige ID übergeben wird
        expect(error instanceof Error).toBe(true);
    }
});

test("Passwort test", async () => {
    const pfleger = await Pfleger.create({
        name: "pfleger02",
        password: "1234",
        admin: false
    });

    let savedPfleger = await Pfleger.findOneAndUpdate({ name: "pfleger02" }, { password: "123" });
    savedPfleger = await Pfleger.findOne({ name: "pfleger02" });
    // Überprüfen, ob das Passwort gehasht wurde
    expect(savedPfleger).toBeDefined();
    expect(savedPfleger?.password).not.toBe(pfleger.password);
    // Überprüfen, ob das gehashte Passwort korrekt ist
    const passwordMatch = await bcrypt.compare(
        pfleger.password,
        savedPfleger!.password
    );
    expect(passwordMatch).toBe(false);

})

test("Pfleger Password ist gehasht", async () => {
    const pfleger = await Pfleger.create({
        name: "pfleger02",
        password: "1234",
    });
})

test("updateOne Passwort test", async () => {
    const pass1 = "1234";
    const pfleger = await Pfleger.create({
        name: "pfleger02",
        password: pass1,
        admin: false
    });
    const passwordMatch = await bcrypt.compare(pass1, pfleger.password);
    expect(passwordMatch).toBe(true);
    const pass2 = "abcd";
    // updatedPfleger
    await Pfleger.updateOne({ name: "pfleger02" }, { password: pass2 }).exec();
    // findOne gibt das erste Objekt zurück auch wenn mehreren mit der gleichen Eigenschaft gibt
    const foundPfleger = await Pfleger.findOne({ name: "pfleger02" }).exec();

    const passwordMatch2 = await bcrypt.compare(pass2, foundPfleger!.password);
    expect(passwordMatch2).toBe(true);
})

test("updateMany", async () => {
    const pfleger01 = await Pfleger.create({
        name: "pfleger01",
        password: "pass01",
        admin: false
    });

    const pfleger02 = await Pfleger.create({
        name: "pfleger02",
        password: "pass02",
        admin: false
    });
    // beide haben die gemeinsame Eigenschaft "admin" als false, deshalb werden wir die beiden Objekten über admin finden und ändern wir deren Passwort
    await Pfleger.updateMany({ admin: false }, { password: "passNew" });
    const pflegerFound01 = await Pfleger.findOne({ name: "pfleger01" });
    const pflegerFound02 = await Pfleger.findOne({ name: "pfleger02" });

    const pfleger01Compare = await bcrypt.compare("passNew", pflegerFound01!.password);
    expect(pfleger01Compare).toBe(true);
    const pfleger02Compare = await bcrypt.compare("passNew", pflegerFound02!.password);
    expect(pfleger02Compare).toBe(true);
})

// Hashing tests
test("isCorrectPassword bei erstelltem und gespeichertem Pfleger mit .create", async () => {
    const pfleger01 = await Pfleger.create({
        name: "pfleger01",
        password: "pass01",
        admin: false
    })
    const b = await pfleger01.isCorrectPassword("pass01");
    const b2 = await pfleger01.isCorrectPassword("pass010101");

    expect(b).toBe(true);
    expect(b2).toBe(false);
})

test("isCorrectPassword test auf Error mit save, ohne den save Hook wird das Passwort nicht gehasht", async () => {
    const pfleger01 = new Pfleger({
        name: "pfleger01",
        password: "pass01",
    })
    await expect(async () => await pfleger01.isCorrectPassword("pass01")).rejects.toThrowError();
    await pfleger01.save();
    let b = await pfleger01.isCorrectPassword("pass01");
    expect(b).toBe(true);
    b = await pfleger01.isCorrectPassword("pass010101");
    expect(b).toBe(false);
    // expect(await pfleger01.isCorrectPassword(pfleger01.password)).toBeFalsy();
    // await expect(async () => await pfleger01.isCorrectPassword(pfleger01.password)).rejects.toThrowError();
})
