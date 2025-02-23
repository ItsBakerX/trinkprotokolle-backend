import { IPfleger, Pfleger } from "../../src/model/PflegerModel";
import { getAlleProtokolle, getProtokoll, createProtokoll, updateProtokoll, deleteProtokoll } from "../../src/services/ProtokollService";
import { getAlleEintraege, getEintrag, createEintrag, updateEintrag, deleteEintrag } from "../../src/services/EintragService";
import { getAllePfleger, createPfleger, updatePfleger, deletePfleger } from "../../src/services/PflegerService";
import { ProtokollResource } from "../../src/Resources";
import { dateToString } from "../../src/services/ServiceHelper";
import { Protokoll } from "../../src/model/ProtokollModel";
import { PflegerResource } from "../../src/Resources";
import { EintragResource } from "../../src/Resources";



test("getAlleEintraege", async () => {
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



    const foundAllEintraege = await getAlleEintraege(protokollCreated.id!);
    expect(foundAllEintraege).toBeDefined();
    expect(foundAllEintraege[0]).toEqual({
        id: johnEintragCreated01.id,
        protokoll: protokollCreated.id,
        ersteller: johnCreated.id,
        getraenk: "Kaffee",
        menge: 100,
        createdAt: dateToString(new Date()),
        erstellerName: "john",
        kommentar: undefined
    })
    expect(foundAllEintraege[1]).toEqual({
        id: johnEintragCreated02.id,
        protokoll: protokollCreated.id,
        ersteller: johnCreated.id,
        getraenk: "Cola",
        menge: 200,
        createdAt: dateToString(new Date()),
        erstellerName: "john",
        kommentar: undefined
    })
})

test("getAlleEintraege Fehler Protokoll not found", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: false
    };
    const johnCreated = await createPfleger(john);

    const protokoll: ProtokollResource = {
        patient: "max",
        datum: dateToString(new Date("2024-5-6Z")),
        ersteller: johnCreated.id!
    };
    const protokollCreated = await createProtokoll(protokoll);

    const johnEintrag01: EintragResource = {
        protokoll: protokollCreated.id!,
        ersteller: johnCreated.id!,
        getraenk: "Kaffee",
        menge: 100
    }
    const johnEintragCreated01 = await createEintrag(johnEintrag01);


    const johnEintrag02: EintragResource = {
        protokoll: protokollCreated.id!,
        ersteller: johnCreated.id!,
        getraenk: "Cola",
        menge: 200
    }
    const johnEintragCreated02 = await createEintrag(johnEintrag02);

    await deleteProtokoll(protokollCreated.id!);
    await expect(async () => await getAlleEintraege(protokollCreated.id!)).rejects.toThrow();
})

test("createEintrag", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: false
    };
    const johnCreated = await createPfleger(john);
    expect(johnCreated).toBeDefined();
    const johnProtokoll: ProtokollResource = {
        ersteller: johnCreated.id!,
        patient: "pat1",
        datum: dateToString(new Date("2024-5-6Z")),
    };
    const johnProtokollCreated = await createProtokoll(johnProtokoll);
    expect(johnProtokollCreated).toBeDefined();
    const johnEintrag: EintragResource = {
        protokoll: johnProtokollCreated.id!,
        ersteller: johnCreated.id!,
        getraenk: "Kaffee",
        menge: 100
    }
    const johnEintragCreated = await createEintrag(johnEintrag);
    expect(johnEintragCreated).toBeDefined();
    expect(johnEintragCreated).toEqual({
        id: johnEintragCreated.id,
        protokoll: johnProtokollCreated.id,
        ersteller: johnCreated.id,
        getraenk: "Kaffee",
        menge: 100,
        createdAt: dateToString(new Date()),
        erstellerName: "john",
        kommentar: undefined
    })
})

test("createEintrag Error Protokoll existiert nicht", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: false
    };
    const johnEintrag: EintragResource = {
        protokoll: "no protokoll",
        ersteller: john.id!,
        getraenk: "Kaffee",
        menge: 100
    }
    await expect(async () => await createEintrag(johnEintrag)).rejects.toThrow();
})


test("getEintrag", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: false
    };
    const johnCreated = await createPfleger(john);
    expect(johnCreated).toBeDefined();
    const johnProtokoll: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2024-5-6Z")),
        ersteller: johnCreated.id!
    };
    const johnProtokollCreated = await createProtokoll(johnProtokoll);
    expect(johnProtokollCreated).toBeDefined();
    const johnEintrag: EintragResource = {
        protokoll: johnProtokollCreated.id!,
        ersteller: johnCreated.id!,
        getraenk: "Kaffee",
        menge: 100
    }
    const johnEintragCreated = await createEintrag(johnEintrag);
    expect(johnEintragCreated).toBeDefined();


    const foundEintrag = await getEintrag(johnEintragCreated.id!);
    expect(foundEintrag).toBeDefined();
    expect(foundEintrag).toEqual({
        id: johnEintragCreated.id,
        protokoll: johnProtokollCreated.id,
        ersteller: johnCreated.id,
        getraenk: "Kaffee",
        menge: 100,
        createdAt: dateToString(new Date()),
        erstellerName: "john",
        kommentar: undefined
    })
})

test("getEintrag Fehler Ersteller not found", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: false
    };
    const johnCreated = await createPfleger(john);
    expect(johnCreated).toBeDefined();
    const johnProtokoll: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2024-5-6Z")),
        ersteller: johnCreated.id!
    };
    const johnProtokollCreated = await createProtokoll(johnProtokoll);
    expect(johnProtokollCreated).toBeDefined();
    const johnEintrag: EintragResource = {
        protokoll: johnProtokollCreated.id!,
        ersteller: johnCreated.id!,
        getraenk: "Kaffee",
        menge: 100
    }
    const johnEintragCreated = await createEintrag(johnEintrag);
    expect(johnEintragCreated).toBeDefined();

    await deletePfleger(johnCreated.id!);
    await expect(async () => await getEintrag(johnEintragCreated.id!)).rejects.toThrow();
})

test("getEintrag Fehler Protokoll not found", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: false
    };
    const johnCreated = await createPfleger(john);
    expect(johnCreated).toBeDefined();
    const johnProtokoll: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2024-5-6Z")),
        ersteller: johnCreated.id!
    };
    const johnProtokollCreated = await createProtokoll(johnProtokoll);
    expect(johnProtokollCreated).toBeDefined();
    const johnEintrag: EintragResource = {
        protokoll: johnProtokollCreated.id!,
        ersteller: johnCreated.id!,
        getraenk: "Kaffee",
        menge: 100
    }
    const johnEintragCreated = await createEintrag(johnEintrag);
    expect(johnEintragCreated).toBeDefined();

    await deleteProtokoll(johnProtokollCreated.id!);
    await expect(async () => await getEintrag(johnEintragCreated.id!)).rejects.toThrow();
})
test("updateEintrag", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: false
    };
    const johnCreated = await createPfleger(john);
    expect(johnCreated).toBeDefined();

    const johnProtokoll: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2024-5-6Z")),
        ersteller: johnCreated.id!
    };
    const johnProtokollCreated = await createProtokoll(johnProtokoll);
    expect(johnProtokollCreated).toBeDefined();

    const johnEintrag: EintragResource = {
        protokoll: johnProtokollCreated.id!,
        ersteller: johnCreated.id!,
        getraenk: "Kaffee",
        menge: 100
    }
    const johnEintragCreated = await createEintrag(johnEintrag);
    expect(johnEintragCreated).toBeDefined();

    const updatedEintrag: EintragResource = {
        id: johnEintragCreated.id,
        protokoll: johnProtokollCreated.id!,
        ersteller: johnCreated.id!,
        getraenk: "Wasser",
        menge: 250
    }
    const updatedJohnEintrag = await updateEintrag(updatedEintrag);
    expect(updatedJohnEintrag).toBeDefined();


    expect(updatedJohnEintrag).toEqual({
        id: johnEintragCreated.id,
        protokoll: johnProtokollCreated.id,
        ersteller: johnCreated.id,
        getraenk: "Wasser",
        menge: 250,
        createdAt: dateToString(new Date()),
        erstellerName: "john",
        kommentar: undefined
    })
})

test("updateEintrag Fehler Id is required", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: false
    };
    const johnCreated = await createPfleger(john);
    expect(johnCreated).toBeDefined();

    const johnProtokoll: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2024-5-6Z")),
        ersteller: johnCreated.id!
    };
    const johnProtokollCreated = await createProtokoll(johnProtokoll);
    expect(johnProtokollCreated).toBeDefined();

    const johnEintrag: EintragResource = {
        protokoll: johnProtokollCreated.id!,
        ersteller: johnCreated.id!,
        getraenk: "Kaffee",
        menge: 100
    }
    const johnEintragCreated = await createEintrag(johnEintrag);
    expect(johnEintragCreated).toBeDefined();

    const updatedEintrag: EintragResource = {
        protokoll: johnProtokollCreated.id!,
        ersteller: johnCreated.id!,
        getraenk: "Wasser",
        menge: 250
    }
    await expect(async () => await updateEintrag(updatedEintrag)).rejects.toThrow();
})

test("updateEintrag Fehler no Eintrag with id found", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: false
    };
    const johnCreated = await createPfleger(john);
    expect(johnCreated).toBeDefined();

    const johnProtokoll: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2024-5-6Z")),
        ersteller: johnCreated.id!
    };
    const johnProtokollCreated = await createProtokoll(johnProtokoll);
    expect(johnProtokollCreated).toBeDefined();

    const johnEintrag: EintragResource = {
        protokoll: johnProtokollCreated.id!,
        ersteller: johnCreated.id!,
        getraenk: "Kaffee",
        menge: 100
    }
    const johnEintragCreated = await createEintrag(johnEintrag);
    expect(johnEintragCreated).toBeDefined();

    const updatedEintrag: EintragResource = {
        id: johnEintragCreated.id,
        protokoll: johnProtokollCreated.id!,
        ersteller: johnCreated.id!,
        getraenk: "Wasser",
        menge: 250
    }
    await deleteEintrag(updatedEintrag.id!);
    await expect(async () => await updateEintrag(updatedEintrag)).rejects.toThrow();
})

test("delete Eintrag", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: false
    };
    const johnCreated = await createPfleger(john);
    expect(johnCreated).toBeDefined();

    const johnProtokoll: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2024-5-6Z")),
        ersteller: johnCreated.id!
    };
    const johnProtokollCreated = await createProtokoll(johnProtokoll);
    expect(johnProtokollCreated).toBeDefined();

    const johnEintrag: EintragResource = {
        protokoll: johnProtokollCreated.id!,
        ersteller: johnCreated.id!,
        getraenk: "Kaffee",
        menge: 100
    }
    const johnEintragCreated = await createEintrag(johnEintrag);
    expect(johnEintragCreated).toBeDefined();

    await deleteEintrag(johnEintragCreated.id!);
    const deletedEintrag = await Protokoll.findById(johnEintragCreated.id).exec();
    expect(deletedEintrag).toBeNull();
    await expect(async () => await getEintrag(johnEintragCreated.id!)).rejects.toThrow();
})

test("delete Eintrag Error", async () => {
    await expect(async () => await deleteEintrag("6634bef7f73cff6b2ff99a0f")).rejects.toThrow();
})