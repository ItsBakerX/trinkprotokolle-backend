// @ts-nocxheck

import supertest from "supertest";
import app from "../../src/app";
import { createPfleger } from "../../src/services/PflegerService";
import { createProtokoll, deleteProtokoll } from "../../src/services/ProtokollService";
import { createEintrag } from "../../src/services/EintragService";
import { dateToString } from "../../src/services/ServiceHelper";
import jwt from 'jsonwebtoken';

import { ProtokollResource } from "../../src/Resources";
import { Protokoll } from "../../src/model/ProtokollModel";
import { performAuthentication, supertestWithAuth } from "../supertestWithAuth";

let idBehrens: string
let idProtokoll: string

beforeEach(async () => {
    // create a pfleger
    const behrens = await createPfleger({ name: "Hofrat Behrens", password: "geheim", admin: false })
    idBehrens = behrens.id!;
    const protokoll = await createProtokoll({ patient: "H. Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: true });
    idProtokoll = protokoll.id!;
})

test("/api/protokoll/:id/eintrage get, 5 Einträge", async () => {

    for (let i = 1; i <= 5; i++) {
        await createEintrag({ getraenk: "BHTee", menge: i * 10, protokoll: idProtokoll, ersteller: idBehrens })
    }
    const testee = supertest(app);
    const response = await testee.get(`/api/protokoll/${idProtokoll}/eintraege`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(5);
});

test("/api/protokoll/:id/eintrage get, keine Einträge", async () => {
    const testee = supertest(app);
    const response = await testee.get(`/api/protokoll/${idProtokoll}/eintraege`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(0);
});

test("/api/protokoll/:id/eintrage get, falsche Protokoll-ID", async () => {
    const testee = supertest(app);
    const response = await testee.get(`/api/protokoll/${idBehrens}/eintraege`);
    expect(response.statusCode).toBe(404);
});

// protokoll
test("/api/protokoll/alle get, 5 Protokolle", async () => {

    for (let i = 1; i <= 4; i++) {
        await createProtokoll({
            patient: "max" + i,
            datum: dateToString(new Date("2024-5-6Z")),
            ersteller: idBehrens,
            public: true
        })
    }
    const testee = supertest(app);
    const response = await testee.get(`/api/protokoll/alle`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(5);
});

test("/api/protokoll/:id get, 1 Protokoll", async () => {

    const testee = supertest(app);
    const response = await testee.get(`/api/protokoll/${idProtokoll}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.patient).toBe("H. Castorp");
});

test("/api/protokoll/:id get, 1 Protokoll", async () => {

    const privateP = await createProtokoll({ patient: "unkown", datum: `01.11.1912`, ersteller: idBehrens, public: false });
    const testee = supertest(app);
    const response = await testee.get(`/api/protokoll/${privateP.id}`);
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("STOP, not owner of this Protokoll are not allowed to read");
});

test("/api/protokoll/ post, 1 Protokoll, mit valider token sollte erfolgreich sein", async () => {

    const jason = await createPfleger({ name: "jason", password: "geheim", admin: false })
    // ich muss die Recource erstellen, da post die Methode creatProtokoll schon hat und ausführt
    const prot = { patient: "jack", datum: `01.11.1912`, ersteller: jason.id!, public: true };
    await performAuthentication("jason", "geheim");
    const testee = supertestWithAuth(app);
    const response = await testee
    .post("/api/protokoll/")
    .send(prot);
    expect(response.statusCode).toBe(200);
    expect(response.body.patient).toBe("jack");
});

test("/api/protokoll/ post, 1 Protokoll, ohne token sollte scheitern", async () => {

    const jason = await createPfleger({ name: "jason", password: "geheim", admin: false })
    // ich muss die Recource erstellen, da post die Methode creatProtokoll schon hat und ausführt
    const prot = { patient: "jack", datum: `01.11.1912`, ersteller: jason.id!, public: true };
    const testee = supertest(app);
    const response = await testee
    .post("/api/protokoll/")
    .send(prot);
    expect(response.statusCode).toBe(401);
});

test("/api/protokoll/ post NEGATIV, 1 Protokoll", async () => {

    const prot = { patient: "jack", datum: `01.11.1912`, public: true };
    await performAuthentication("Hofrat Behrens", "geheim");
    const testee = supertestWithAuth(app);
    const response = await testee
    .post("/api/protokoll/")
    .send(prot);
    expect(response.statusCode).toBe(400);
});

test("/api/protokoll/:id put POSITIV, 1 Protokoll, mit valider token sollte erfolgreich sein, protokoll darf nur vom ersteller geändert werden", async () => {

    
    const jason = await createPfleger({ name: "jason", password: "geheim", admin: false })
    const prot = { id: idProtokoll,patient: "jack", datum: `01.11.1912`, ersteller: jason.id, public: true };
    // da die Änderung im Protokoll vom Behrens statt findet, sollte Behrens angemeldet sein
    await performAuthentication("Hofrat Behrens", "geheim");
    const testee = supertestWithAuth(app);
    
    const response = await testee
    .put(`/api/protokoll/${idProtokoll}`)
    .send(prot);
    expect(response.statusCode).toBe(200);
    expect(response.body.patient).toBe(prot.patient);
    expect(response.body.errors).toBeUndefined();
});

test("/api/protokoll/:id put POSITIV, 1 private Protokoll with the owner, protokoll darf nur vom ersteller geändert werden", async () => {

    
    const jason = await createPfleger({ name: "jason", password: "geheim", admin: false })
    const prot = { id: idProtokoll,patient: "jack", datum: `01.11.1912`, ersteller: jason.id, public: false };
    // da die Änderung im Protokoll vom Behrens statt findet, sollte Behrens angemeldet sein
    await performAuthentication("Hofrat Behrens", "geheim");
    const testee = supertestWithAuth(app);

    const response = await testee
    .put(`/api/protokoll/${idProtokoll}`)
    .send(prot);
    expect(response.statusCode).toBe(200);
    expect(response.body.patient).toBe(prot.patient);
    expect(response.body.errors).toBeUndefined();
});

test("/api/protokoll/:id put POSITIV, 1 private Protokoll without the owner, should not be able to update", async () => {

    
    const jason = await createPfleger({ name: "jason", password: "geheim", admin: false })
    const prot = { id: idProtokoll,patient: "jack", datum: `01.11.1912`, ersteller: jason.id, public: false };
    // jason is logged in even though we want to make changes in the protokoll of Behrens, thats why it should not work
    await performAuthentication("jason", "geheim");
    const testee = supertestWithAuth(app);

    const response = await testee
    .put(`/api/protokoll/${idProtokoll}`)
    .send(prot);
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("STOP, not owner of this Protokoll are not allowed to make changes");
});

test("/api/protokoll/:id put, 1 Protokoll, ohne token sollte scheitern", async () => {

    const jason = await createPfleger({ name: "jason", password: "geheim", admin: false })
    const prot = { id: idProtokoll,patient: "jack", datum: `01.11.1912`, ersteller: jason.id, public: true };
    const testee = supertest(app);

    const response = await testee
    .put(`/api/protokoll/${idProtokoll}`)
    .send(prot);
    expect(response.statusCode).toBe(401);
});


test("/api/protokoll/:id put NEGATIV, 1 Protokoll", async () => {

    
    const jason = await createPfleger({ name: "jason", password: "geheim", admin: false })
    const prot = {patient: "jack", datum: `01.11.1912`, ersteller: jason.id, public: true };
    await performAuthentication("Hofrat Behrens", "geheim");
    const testee = supertestWithAuth(app);

    const response = await testee
    .put(`/api/protokoll/${idProtokoll}`)
    .send(prot);
    expect(response.statusCode).toBe(400);
});

test("/api/protokoll/:id delete POSITIV, 1 Protokoll, mit valider token", async () => {

    await performAuthentication("Hofrat Behrens", "geheim");
    const testee = supertestWithAuth(app);
    const response = await testee
    .delete(`/api/protokoll/${idProtokoll}`);
    expect(response.statusCode).toBe(204);
});
test("/api/protokoll/:id delete POSITIV, 1 private Protokoll with the owner", async () => {

    const privateP = await createProtokoll({ patient: "unkown", datum: `01.11.1912`, ersteller: idBehrens, public: false });
    await performAuthentication("Hofrat Behrens", "geheim");
    const testee = supertestWithAuth(app);
    const response = await testee
    .delete(`/api/protokoll/${privateP.id}`);
    expect(response.statusCode).toBe(204);
    const deletedProtokoll = await Protokoll.findById(privateP.id).exec();
    expect(deletedProtokoll).toBeNull();
});
test("/api/protokoll/:id delete, 1 private Protokoll without the owner, should not be able to delete", async () => {

    const priv = await createPfleger({ name: "priv pfleger", password: "geheim", admin: false })
    // Behrens did create this protokoll
    const privateP = await createProtokoll({ patient: "unkown", datum: `01.11.1912`, ersteller: idBehrens, public: false });
    // priv is logged in
    await performAuthentication(priv.name, "geheim");
    const testee = supertestWithAuth(app);
    const response = await testee
    .delete(`/api/protokoll/${privateP.id}`);
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("STOP, not owner of this Protokoll are not allowed to make changes");
    const deletedProtokoll = await Protokoll.findById(privateP.id).exec();
    expect(deletedProtokoll).toBeDefined();
});
test("/api/protokoll/:id delete POSITIV, 1 Protokoll, ohne token", async () => {

    const testee = supertest(app);
    const response = await testee
    .delete(`/api/protokoll/${idProtokoll}`);
    expect(response.statusCode).toBe(401);
});

test("/api/protokoll/:id delete NEGATIV, 1 Protokoll", async () => {

    await performAuthentication("Hofrat Behrens", "geheim");

    const testee = supertestWithAuth(app);
    const response = await testee
    .delete(`/api/protokoll/idProtokoll`);
    expect(response.statusCode).toBe(400);
});