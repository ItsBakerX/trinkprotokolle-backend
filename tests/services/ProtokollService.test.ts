import { HydratedDocument } from "mongoose";
import { IPfleger, Pfleger } from "../../src/model/PflegerModel";
import { getAlleProtokolle, getProtokoll, createProtokoll, updateProtokoll, deleteProtokoll } from "../../src/services/ProtokollService";
import { PflegerResource, ProtokollResource } from "../../src/Resources";
import { dateToString } from "../../src/services/ServiceHelper";
import { Protokoll } from "../../src/model/ProtokollModel";
import { EintragResource } from "../../src/Resources";
import { getAlleEintraege, getEintrag, createEintrag, updateEintrag, deleteEintrag } from "../../src/services/EintragService";
import { Eintrag } from "../../src/model/EintragModel";
import { createPfleger, deletePfleger } from "../../src/services/PflegerService";



test("getAlleProtokolle mit verschiedenen Einträgen und bestimme die Gesamtmenge", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: false
    };
    const johnCreated = await createPfleger(john);
    expect(johnCreated).toBeDefined();


    const protokoll01: ProtokollResource = {
        patient: "max",
        datum: dateToString(new Date("2024-5-6Z")),
        ersteller: johnCreated.id!
    };
    const protokollCreated01 = await createProtokoll(protokoll01);
    expect(protokollCreated01).toBeDefined();

    const protokoll02: ProtokollResource = {
        patient: "jake",
        datum: dateToString(new Date("2024-5-6Z")),
        ersteller: johnCreated.id!
    };
    const protokollCreated02 = await createProtokoll(protokoll02);
    expect(protokollCreated02).toBeDefined();


    const johnEintrag01: EintragResource = {
        protokoll: protokollCreated01.id!,
        ersteller: johnCreated.id!,
        getraenk: "Kaffee",
        menge: 100
    }
    const johnEintragCreated01 = await createEintrag(johnEintrag01);
    expect(johnEintragCreated01).toBeDefined();


    const johnEintrag02: EintragResource = {
        protokoll: protokollCreated02.id!,
        ersteller: johnCreated.id!,
        getraenk: "Cola",
        menge: 200
    }
    const johnEintragCreated02 = await createEintrag(johnEintrag02);
    expect(johnEintragCreated02).toBeDefined();

    const johnEintrag03: EintragResource = {
        protokoll: protokollCreated02.id!,
        ersteller: johnCreated.id!,
        getraenk: "Milch",
        menge: 500
    }
    const johnEintragCreated03 = await createEintrag(johnEintrag03);
    expect(johnEintragCreated03).toBeDefined();

    const foundAllProtokolle = await getAlleProtokolle(johnCreated.id);
    expect(foundAllProtokolle).toBeDefined();

    expect(foundAllProtokolle[0].patient).toBe(protokollCreated01.patient);
    expect(foundAllProtokolle[0].datum).toBe(protokollCreated01.datum);
    expect(foundAllProtokolle[0].ersteller).toBe(johnCreated.id);
    expect(foundAllProtokolle[0].erstellerName).toBe(johnCreated.name);
    expect(foundAllProtokolle[0].gesamtMenge).toBe(100);

    expect(foundAllProtokolle[1].patient).toBe(protokollCreated02.patient);
    expect(foundAllProtokolle[1].datum).toBe(protokollCreated02.datum);
    expect(foundAllProtokolle[1].ersteller).toBe(johnCreated.id);
    expect(foundAllProtokolle[1].erstellerName).toBe(johnCreated.name);
    expect(foundAllProtokolle[1].gesamtMenge).toBe(700);
})


test("getProtokoll", async () => {
    const pfleger = await Pfleger.create({
        name: "pfleger",
        password: "pass1",
        admin: false
    });
    const john: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2021-08-03Z")),
        ersteller: pfleger.id
    };

    const johnProtokoll = await createProtokoll(john);
    if (!johnProtokoll) {
        throw Error();
    }
    const johnFound = await getProtokoll(johnProtokoll.id!);

    expect(johnFound.id).toBe(johnProtokoll.id);
    expect(johnFound.patient).toBe(johnProtokoll.patient);
    expect(johnFound.datum).toBe(johnProtokoll.datum);
    expect(johnFound.public).toBe(false);
    expect(johnFound.closed).toBe(false);
    expect(johnFound.ersteller).toBe(pfleger.id);
    expect(johnFound.erstellerName).toBe(johnProtokoll.erstellerName);
    expect(johnFound.updatedAt).toBe(johnProtokoll.updatedAt);
})

test("getProtokoll und bestimme die Gesamtmenge von seinem Einträgen", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: false
    };
    const johnCreated = await createPfleger(john);
    expect(johnCreated).toBeDefined();


    const protokoll: ProtokollResource = {
        patient: "max",
        datum: dateToString(new Date("2024-5-6Z")),
        ersteller: johnCreated.id!
    };
    const protokollCreated = await createProtokoll(protokoll);
    expect(protokollCreated).toBeDefined();


    const johnEintrag01: EintragResource = {
        protokoll: protokollCreated.id!,
        ersteller: johnCreated.id!,
        getraenk: "Kaffee",
        menge: 100
    }
    const johnEintragCreated01 = await createEintrag(johnEintrag01);
    expect(johnEintragCreated01).toBeDefined();


    const johnEintrag02: EintragResource = {
        protokoll: protokollCreated.id!,
        ersteller: johnCreated.id!,
        getraenk: "Cola",
        menge: 200
    }
    const johnEintragCreated02 = await createEintrag(johnEintrag02);
    expect(johnEintragCreated02).toBeDefined();


    const foundProtokolle = await getProtokoll(protokollCreated.id!);

    expect(foundProtokolle).toBeDefined();
    expect(foundProtokolle.gesamtMenge).toBe(300);
})

test("getProtokoll Fehler protokoll not found", async () => {
    const pfleger = await Pfleger.create({
        name: "pfleger",
        password: "pass1",
        admin: false
    });
    const john: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2021-08-03Z")),
        ersteller: pfleger.id
    };

    const johnProtokoll = await createProtokoll(john);
    deleteProtokoll(johnProtokoll.id!);
    await expect(async () =>  await getProtokoll(johnProtokoll.id!)).rejects.toThrow();

    
})

test("Create Protokoll", async () => {
    const pfleger = await Pfleger.create({
        name: "pfleger",
        password: "pass1",
        admin: false
    });
    const john: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2021-08-03Z")),
        ersteller: pfleger.id
    };

    const protokollCreated = await createProtokoll(john);
    expect(protokollCreated.id).toBe(protokollCreated.id);
    expect(protokollCreated.patient).toBe("john");
    expect(protokollCreated.datum).toBe("03.08.2021");
    expect(protokollCreated.public).toBe(false);
    expect(protokollCreated.closed).toBe(false);
    expect(protokollCreated.ersteller).toBe(pfleger.id);
    expect(protokollCreated.erstellerName).toBe("pfleger");
    expect(protokollCreated.updatedAt).toBe(dateToString(new Date()));
})

test("UpdateProtokoll", async () => {
    const pfleger = await Pfleger.create({
        name: "pfleger",
        password: "pass1",
        admin: false
    });
    const john: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2021-08-03Z")),
        ersteller: pfleger.id,
        public: false
    };
    const johnProtokoll = await createProtokoll(john);
    expect(johnProtokoll).toBeDefined();

    const max: ProtokollResource = {
        id: johnProtokoll.id,
        ersteller: pfleger.id!,
        patient: "max",
        datum: dateToString(new Date("2022-11-1Z")),
        public: true,
        closed: true
    };
    const updatedJohnProtokoll = await updateProtokoll(max);
    // await expect(async () =>  await updateProtokoll(max)).rejects.toThrow();

    expect(updatedJohnProtokoll.id).toEqual(johnProtokoll.id);
    expect(updatedJohnProtokoll.patient).toEqual("max");
    expect(updatedJohnProtokoll.datum).toEqual("01.11.2022");
    expect(updatedJohnProtokoll.public).toEqual(true);
    expect(updatedJohnProtokoll.closed).toEqual(true);
})

test("UpdateProtokoll Fehler ID is required", async () => {
    const pfleger = await Pfleger.create({
        name: "pfleger",
        password: "pass1",
        admin: false
    });
    const john: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2021-08-03Z")),
        ersteller: pfleger.id,
        public: false
    };
    const johnProtokoll = await createProtokoll(john);
    expect(johnProtokoll).toBeDefined();

    const max: ProtokollResource = {
        ersteller: pfleger.id!,
        patient: "max",
        datum: dateToString(new Date("2022-11-1Z")),
        public: true
    };
   await expect(async () =>  await updateProtokoll(max)).rejects.toThrow();
 
})

test("UpdateProtokoll Fehler no protokoll with id found", async () => {
    const pfleger = await Pfleger.create({
        name: "pfleger",
        password: "pass1",
        admin: false
    });
    const john: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2021-08-03Z")),
        ersteller: pfleger.id,
        public: false
    };
    const johnProtokoll = await createProtokoll(john);
    expect(johnProtokoll).toBeDefined();

    const max: ProtokollResource = {
        id: johnProtokoll.id,
        ersteller: pfleger.id!,
        patient: "max",
        datum: dateToString(new Date("2022-11-1Z")),
        public: true
    };
    await deleteProtokoll(max.id!);
   await expect(async () =>  await updateProtokoll(max)).rejects.toThrow();
 
})

test("delete Protokoll", async () => {
    const pfleger = await Pfleger.create({
        name: "pfleger",
        password: "pass1",
        admin: false
    });
    const john: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2021-08-03Z")),
        ersteller: pfleger.id,
        public: false
    };
    const johnProtokoll = await createProtokoll(john);
    expect(johnProtokoll).toBeDefined();
    await deleteProtokoll(johnProtokoll.id!);
    const deletedProtokoll = await Protokoll.findById(johnProtokoll.id).exec();
    expect(deletedProtokoll).toBeNull();

})

test("delete Protokoll Fehler Protokoll not found, weil Pfleger gelöscht wurde", async () => {
    const pfleger = await Pfleger.create({
        name: "pfleger",
        password: "pass1",
        admin: false
    });
    const john: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2021-08-03Z")),
        ersteller: pfleger.id,
        public: false
    };
    const johnProtokoll = await createProtokoll(john);
    expect(johnProtokoll).toBeDefined();
    await deletePfleger(pfleger.id)
    await expect(async () =>  await deleteProtokoll(johnProtokoll.id!)).rejects.toThrow();

})
test("delete Protokoll mit seinem Eintrag", async () => {
    const pfleger = await Pfleger.create({
        name: "pfleger",
        password: "pass1",
        admin: false
    });
    const john: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2021-08-03Z")),
        ersteller: pfleger.id,
        public: false
    };
    const johnProtokoll = await createProtokoll(john);
    expect(johnProtokoll).toBeDefined();

    const johnEintrag: EintragResource = {
        protokoll: johnProtokoll.id!,
        ersteller: pfleger.id!,
        getraenk: "Kaffee",
        menge: 100
    }
    const johnEintragCreated = await createEintrag(johnEintrag);

    await deleteProtokoll(johnProtokoll.id!);
    const deletedProtokoll = await Protokoll.findById(johnProtokoll.id).exec();
    const deletedEintrag = await Eintrag.findById(johnEintragCreated.id).exec();
    expect(deletedProtokoll).toBeNull();
    expect(deletedEintrag).toBeNull();
})