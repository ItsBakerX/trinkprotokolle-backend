import dotenv from "dotenv";
dotenv.config();

import "restmatcher";
import supertest from "supertest";
import app from "../../src/app";
import { createPfleger } from "../../src/services/PflegerService";
import { createProtokoll } from "../../src/services/ProtokollService";
import { performAuthentication, supertestWithAuth } from "../supertestWithAuth";

let idBehrens: string
let idProtokoll: string

beforeEach(async () => {
    const behrens = await createPfleger({ name: "Hofrat Behrens", password: "Geheim1234..!", admin: false })
    idBehrens = behrens.id!;
    const protokoll = await createProtokoll({ patient: "H. Castorp", datum: `01.11.1912`, ersteller: idBehrens, public: true });
    idProtokoll = protokoll.id!;
})

test("/api/protokoll DELETE, Positivtest (mit Authentifizierung)", async () => {
    await performAuthentication("Hofrat Behrens", "Geheim1234..!");
    const testee = supertestWithAuth(app);
    const response = await testee.delete(`/api/protokoll/${idProtokoll}`)
    expect(response).statusCode(204);
})

test("/api/protokoll DELETE, Negativtest (ohne Authentifizierung)", async () => {
    const testee = supertest(app);
    const response = await testee.delete(`/api/protokoll/${idProtokoll}`)
    expect(response).statusCode(401);
})
