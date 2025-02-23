// @ts-nocxheck
import dotenv from "dotenv";
dotenv.config();

import "restmatcher";
import supertest from "supertest";
import app from "../../src/app";
import { createPfleger } from "../../src/services/PflegerService";
import { createProtokoll } from "../../src/services/ProtokollService";
import { createEintrag } from "../../src/services/EintragService";
import { performAuthentication, supertestWithAuth } from "../supertestWithAuth";

let idBehrens: string
let idProtokoll: string
let idEintrag: string
let nameBehrens: string;
let passBehrens: string;

beforeEach(async () => {
    // create a pfleger
    const behrens = await createPfleger({ name: "Hofrat Behrens", password: "geheim", admin: false })
    idBehrens = behrens.id!;
    nameBehrens=behrens.name;
    passBehrens=behrens.password!;
    const protokoll = await createProtokoll({ patient: "H. Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: true });
    idProtokoll = protokoll.id!;
    const eintrag = await createEintrag({ protokoll: idProtokoll, ersteller: idBehrens,getraenk: "Kaffee",menge: 100});
    idEintrag = eintrag.id!;

})

test("/api/eintrag/:id get, 1 Eintrag, mit valider token sollte Erfolgreich sein", async () => {

    await performAuthentication("Hofrat Behrens", "geheim");

    const testee = supertestWithAuth(app);
    const response = await testee
    .get(`/api/eintrag/${idEintrag}`)
    expect(response.statusCode).toBe(200);
    expect(response.body.getraenk).toBe("Kaffee");
});
test("/api/eintrag/:id get, 1 private Eintrag, mit valider token aber nicht ersteller, sollte nicht funktionieren", async () => {

    const user = await createPfleger({ name: "user", password: "geheim", admin: false })
    const privateP = await createProtokoll({ patient: "Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: false });
    const privateE = await createEintrag({ protokoll: privateP.id!, ersteller: idBehrens,getraenk: "Kaffee",menge: 100});

    await performAuthentication(user.name, "geheim");

    const testee = supertestWithAuth(app);
    const response = await testee
    .get(`/api/eintrag/${privateE.id}`)
    expect(response.statusCode).toBe(403);
});
test("/api/eintrag/:id get, 1 public Eintrag, mit valider token aber nicht ersteller, sollte erfolgreich sein", async () => {

    const user = await createPfleger({ name: "user", password: "geheim", admin: false })
    const publicP = await createProtokoll({ patient: "Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: true });
    const publicE = await createEintrag({ protokoll: publicP.id!, ersteller: idBehrens,getraenk: "Kaffee",menge: 100});

    await performAuthentication(user.name, "geheim");

    const testee = supertestWithAuth(app);
    const response = await testee
    .get(`/api/eintrag/${publicE.id}`)
    expect(response.statusCode).toBe(200);
});

test("/api/eintrag/:id get, 1 Eintrag, ohne token sollte Erfolgreich sein", async () => {

    const testee = supertest(app);
    const response = await testee.get(`/api/eintrag/${idEintrag}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.getraenk).toBe("Kaffee");
});


test("/api/eintrag/ post, 1 Eintrag, mit valider Token sollte Erflogreich sein", async () => {

    await performAuthentication("Hofrat Behrens", "geheim");

    const eintrag ={
        protokoll: idProtokoll,
        ersteller: idBehrens,
        getraenk: "Kaffee",
        menge: 100
    }
    const testee = supertestWithAuth(app);
    const response = await testee
    .post("/api/eintrag/")
    .send(eintrag);
    expect(response.statusCode).toBe(200);
    expect(response.body.getraenk).toBe("Kaffee");
});
test("/api/eintrag/ post, 1 Eintrag in public protokoll, mit valider Token, aber nicht ersteller sollte erfolgreich sein", async () => {

    const user = await createPfleger({ name: "user", password: "geheim", admin: false })
    await performAuthentication(user.name, "geheim");

    const eintrag ={
        // protokoll is public
        protokoll: idProtokoll,
        ersteller: idBehrens,
        getraenk: "Kaffee",
        menge: 100
    }
    const testee = supertestWithAuth(app);
    const response = await testee
    .post("/api/eintrag/")
    .send(eintrag);
    expect(response.statusCode).toBe(200);
    expect(response.body.getraenk).toBe("Kaffee");
});
test("/api/eintrag/ post, 1 Eintrag in private protokoll, mit valider Token, aber nicht ersteller sollte scheitern", async () => {

    const user = await createPfleger({ name: "user", password: "geheim", admin: false })
    const privateP = await createProtokoll({ patient: "Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: false });
    await performAuthentication(user.name, "geheim");

    const eintrag ={
        // protokoll is public
        protokoll: privateP.id,
        ersteller: idBehrens,
        getraenk: "Kaffee",
        menge: 100
    }
    const testee = supertestWithAuth(app);
    const response = await testee
    .post("/api/eintrag/")
    .send(eintrag);
    expect(response.statusCode).toBe(403);
});
test("/api/eintrag/ post, 1 Eintrag in private protokoll, mit valider Token, und ersteller sollte erfolgreich sein", async () => {

    const privateP = await createProtokoll({ patient: "Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: false });
    await performAuthentication("Hofrat Behrens", "geheim");

    const eintrag ={
        // protokoll is public
        protokoll: privateP.id,
        ersteller: idBehrens,
        getraenk: "Kaffee",
        menge: 100
    }
    const testee = supertestWithAuth(app);
    const response = await testee
    .post("/api/eintrag/")
    .send(eintrag);
    expect(response.statusCode).toBe(200);
});
test("/api/eintrag/ post, 1 Eintrag, ohne token sollte scheitern", async () => {

    const eintrag ={
        protokoll: idProtokoll,
        ersteller: idBehrens,
        getraenk: "Kaffee",
        menge: 100
    }
    const testee = supertest(app);
    const response = await testee
    .post("/api/eintrag/")
    .send(eintrag);
    expect(response.statusCode).toBe(401);
});

test("/api/eintrag/:id put POSITIV, 1 Eintrag, mit valider token sollte Erfolgreich sein", async () => {

    await performAuthentication("Hofrat Behrens", "geheim");


    const eintrag ={
        id: idEintrag,
        protokoll: idProtokoll,
        ersteller: idBehrens,
        getraenk: "Kaffee",
        menge: 100
    }
    const testee = supertestWithAuth(app);
    const response = await testee
    .put(`/api/eintrag/${idEintrag}`)
    .send(eintrag);
    expect(response.statusCode).toBe(200);
    expect(response.body.getraenk).toBe(eintrag.getraenk);
    expect(response.body.errors).toBeUndefined();
});
test("/api/eintrag/:id put POSITIV, 1 public Eintrag, mit valider token, aber nicht ersteller darf nicht verändert werden, sollte scheitern", async () => {

    const user = await createPfleger({ name: "user", password: "geheim", admin: false })
    await performAuthentication(user.name, "geheim");


    const eintrag ={
        id: idEintrag,
        protokoll: idProtokoll,
        ersteller: idBehrens,
        getraenk: "Kaffee",
        menge: 100
    }
    const testee = supertestWithAuth(app);
    const response = await testee
    .put(`/api/eintrag/${idEintrag}`)
    .send(eintrag);
    expect(response.statusCode).toBe(403);
});
test("/api/eintrag/:id put POSITIV, 1 private Eintrag, mit valider token, und ersteller darf verändert werden, sollte erfolgreich sein", async () => {

    const privateP = await createProtokoll({ patient: "Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: false });
    await performAuthentication("Hofrat Behrens", "geheim");


    const eintrag ={
        id: idEintrag,
        protokoll: privateP.id,
        ersteller: idBehrens,
        getraenk: "Kaffee",
        menge: 100
    }
    const testee = supertestWithAuth(app);
    const response = await testee
    .put(`/api/eintrag/${idEintrag}`)
    .send(eintrag);
    expect(response.statusCode).toBe(200);
});

test("/api/eintrag/:id put, 1 Eintrag, ohne Token sollte scheitern", async () => {

    const eintrag ={
        id: idEintrag,
        protokoll: idProtokoll,
        ersteller: idBehrens,
        getraenk: "Kaffee",
        menge: 100
    }
    const testee = supertest(app);
    const response = await testee
    .put(`/api/eintrag/${idEintrag}`)
    .send(eintrag);
    expect(response.statusCode).toBe(401);
});

test("/api/eintrag/:id delete, 1 Eintrag, mit valider Token sollte Erfolgreich sein", async () => {

    await performAuthentication("Hofrat Behrens", "geheim");

    const testee = supertestWithAuth(app);
    const response = await testee
    .delete(`/api/eintrag/${idEintrag}`)
    expect(response.statusCode).toBe(204);
});
test("/api/eintrag/:id delete, 1 public Eintrag, mit valider Token, aber nicht ersteller darf nicht gelöscht werden, sollte scheitern", async () => {

    const user = await createPfleger({ name: "user", password: "geheim", admin: false })
    await performAuthentication(user.name, "geheim");

    const testee = supertestWithAuth(app);
    const response = await testee
    .delete(`/api/eintrag/${idEintrag}`)
    expect(response.statusCode).toBe(403);
});
test("/api/eintrag/:id delete, 1 private Eintrag, mit valider Token, und ersteller darf gelöscht werden, sollte erfolgreich sein", async () => {

    const privateP = await createProtokoll({ patient: "Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: false });
    const privateE = await createEintrag({ protokoll: privateP.id!, ersteller: idBehrens,getraenk: "Kaffee",menge: 100});
    await performAuthentication("Hofrat Behrens", "geheim");

    const testee = supertestWithAuth(app);
    const response = await testee
    .delete(`/api/eintrag/${privateE.id}`)
    expect(response.statusCode).toBe(204);
});

test("/api/eintrag/:id delete, 1 Eintrag, ohne Token sollte scheitern", async () => {

    const testee = supertest(app);
    const response = await testee.delete(`/api/eintrag/${idEintrag}`);
    expect(response.statusCode).toBe(401);
});