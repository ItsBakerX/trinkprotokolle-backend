// @ts-nocxheck

import supertest from "supertest";
import app from "../../src/app";
import { createPfleger, deletePfleger } from "../../src/services/PflegerService";
import { createProtokoll } from "../../src/services/ProtokollService";
import jwt from 'jsonwebtoken';
import { createEintrag } from "../../src/services/EintragService";
import { dateToString } from "../../src/services/ServiceHelper";
import { ProtokollResource } from "../../src/Resources";
import { Protokoll } from "../../src/model/ProtokollModel";
import { performAuthentication, supertestWithAuth } from "../supertestWithAuth";

let idBehrens: string
let idProtokoll: string
let pass ="k1yoO4Yy!HW3P."

beforeEach(async () => {
    // create a pfleger
    const behrens = await createPfleger({ name: "Hofrat Behrens", password: "geheim", admin: true })
    idBehrens = behrens.id!;
    const protokoll = await createProtokoll({ patient: "H. Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: true });
    idProtokoll = protokoll.id!;
})

test("/api/pfleger/alle get, 5 Pflegern, ohne token sollte erfolgreich sein, aber wir wissen nicht ob der pfleger admin ist oder nicht", async () => {

    for (let i = 1; i <= 4; i++) {
        await createPfleger({
            name: "jason"+i,
            password: "1234",
            admin: false
        })
    }
    const testee = supertest(app);
    const response = await testee.get(`/api/pfleger/alle`);
    expect(response.statusCode).toBe(403);
    // expect(response.body).toBeInstanceOf(Array);
    // expect(response.body.length).toBe(5);
});

test("/api/pfleger/alle get, 5 Pflegern, mit valider token sollte erfolgreich sein", async () => {

    await performAuthentication("Hofrat Behrens", "geheim");

    for (let i = 1; i <= 4; i++) {
        await createPfleger({
            name: "jason"+i,
            password: "1234",
            admin: false
        })
    }
    const testee = supertestWithAuth(app);
    const response = await testee
    .get(`/api/pfleger/alle`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBe(5);
});

test("/api/pfleger/ post POSITIV, 1 Pfleger, mit valider token sollte erfolgreich sein", async () => {

    await performAuthentication("Hofrat Behrens", "geheim");

    const pfleger ={
        name: "jason",
        password: pass,
        admin: false
    }
    const testee = supertestWithAuth(app);
    const response = await testee
    .post("/api/pfleger/")
    .send(pfleger);
    expect(response.statusCode).toBe(201);
    expect(response.body.name).toBe("jason");
});
test("/api/pfleger/ post, 1 Pfleger, mit valider token, aber nicht admin", async () => {

    const user = await createPfleger({ name: "user", password: "geheim", admin: false })
    await performAuthentication(user.name, "geheim");

    const pfleger ={
        name: "jason",
        password: pass,
        admin: false
    }
    const testee = supertestWithAuth(app);
    const response = await testee
    .post("/api/pfleger/")
    .send(pfleger);
    expect(response.statusCode).toBe(403);
});
test("/api/pfleger/ post, 1 Pfleger, ohne Token sollte scheitern", async () => {

    const pfleger ={
        name: "jason",
        password: pass,
        admin: false
    }
    const testee = supertest(app);
    const response = await testee.post("/api/pfleger/").send(pfleger);
    expect(response.statusCode).toBe(401);
});

test("/api/pfleger/ post NEGATIV, 1 Pfleger", async () => {

    await performAuthentication("Hofrat Behrens", "geheim");

    const testee = supertestWithAuth(app);
    const response = await testee
    .post("/api/pfleger/")
    .send("pfleger");
    expect(response.statusCode).toBe(400);
});

test("/api/pfleger/:id put POSITIV, 1 Pfleger, mit valider token sollte erfolgrerich sein", async () => {

    await performAuthentication("Hofrat Behrens", "geheim");
    const pfleger ={
        id: idBehrens,
        name: "jason",
        password: pass,
        admin: false
    }
    const testee = supertestWithAuth(app);
    const response = await testee
    .put(`/api/pfleger/${idBehrens}`)
    .send(pfleger);
    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe(pfleger.name);
    expect(response.body.errors).toBeUndefined();
});
test("/api/pfleger/:id put, 1 Pfleger, mit valider token, aber nicht admin", async () => {

    const user = await createPfleger({ name: "user", password: "geheim", admin: false })
    await performAuthentication(user.name, "geheim");
    const pfleger ={
        id: idBehrens,
        name: "jason",
        password: pass,
        admin: false
    }
    const testee = supertestWithAuth(app);
    const response = await testee
    .put(`/api/pfleger/${idBehrens}`)
    .send(pfleger);
    expect(response.statusCode).toBe(403);
    expect(response.body.errors).toBeUndefined();
});
test("/api/pfleger/:id put POSITIV, 1 Pfleger, ohne token sollte scheitern", async () => {

    const pfleger ={
        id: idBehrens,
        name: "jason",
        password: pass,
        admin: false
    }
    const testee = supertest(app);
    const response = await testee
    .put(`/api/pfleger/${idBehrens}`)
    .send(pfleger);
    expect(response.statusCode).toBe(401);
});


test("/api/pfleger/:id put NEGATIV, 1 Pfleger", async () => {

    await performAuthentication("Hofrat Behrens", "geheim");
    const pfleger ={
        name: "jason",
        password: "1234",
        admin: false
    }
    const testee = supertestWithAuth(app);
    const response = await testee
    .put(`/api/pfleger/NOT VALID`)
    .send(pfleger);
    expect(response.statusCode).toBe(400);
});

test("/api/pfleger/:id delete, 1 Pfleger, mit valider token, admin darf sich selbst nicht löschen", async () => {

    await performAuthentication("Hofrat Behrens", "geheim");
    const testee = supertestWithAuth(app);
    const response = await testee
    .delete(`/api/pfleger/${idBehrens}`)
    expect(response.statusCode).toBe(403);
});
test("/api/pfleger/:id delete POSITIV, 1 Pfleger, mit valider token, admin darf andere admins löschen", async () => {

    await performAuthentication("Hofrat Behrens", "geheim");
    const user = await createPfleger({ name: "user", password: "geheim", admin: true })
    const testee = supertestWithAuth(app);
    const response = await testee
    .delete(`/api/pfleger/${user.id}`)
    expect(response.statusCode).toBe(204);
});
test("/api/pfleger/:id delete, 1 Pfleger, ohne token", async () => {

    const testee = supertest(app);
    const response = await testee.delete(`/api/pfleger/${idBehrens}`);
    expect(response.statusCode).toBe(401);
});

test("/api/pfleger/:id delete NEGATIV, 1 Pfleger", async () => {

    await performAuthentication("Hofrat Behrens", "geheim");
    const testee = supertestWithAuth(app);
    const response = await testee
    .delete(`/api/pfleger/idBehrens`);
    expect(response.statusCode).toBe(400);
});