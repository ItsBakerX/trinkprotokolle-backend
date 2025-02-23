// must be imported before any other imports
import dotenv from "dotenv";
dotenv.config();

import "restmatcher";
import supertest from "supertest";
import { PflegerResource, ProtokollResource } from "../../src/Resources";
import app from "../../src/app";
import { createPfleger } from "../../src/services/PflegerService";
import { createProtokoll } from "../../src/services/ProtokollService";
import { createEintrag } from "../../src/services/EintragService";
import { verifyPasswordAndCreateJWT } from "../../src/services/JWTService";
import { performAuthentication, supertestWithAuth } from "../supertestWithAuth";

let pomfrey: PflegerResource
let fredsProtokoll: ProtokollResource

beforeEach(async () => {
    pomfrey = await createPfleger({
        name: "Poppy Pomfrey", password: "12345bcdABCD..;,.", admin: false
    });
    fredsProtokoll = await createProtokoll({
        patient: "Fred Weasly", datum: "01.10.2023",
        public: true, closed: false,
        ersteller: pomfrey.id!
    })
    const eintrag = await createEintrag({
        protokoll: fredsProtokoll.id!,
        ersteller: pomfrey.id!,
        getraenk: "Kaffee",
        menge: 100
    });
})

test("/api/protokoll GET, ungültige ID", async () => {
    const testee = supertest(app);
    const response = await testee.get(`/api/protokoll/1234`)

    expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id" })
})

test("/api/protokoll PUT, verschiedene ID (params und body)", async () => {

    await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
    const testee = supertestWithAuth(app);
    // Hint: Gültige ID, aber für ein Protokoll ungültig!
    const invalidProtokollID = pomfrey.id;
    // Hint: Gebe hier Typ an, um im Objektliteral Fehler zu vermeiden!
    const update: ProtokollResource = {
        ...fredsProtokoll, // Hint: Kopie von fredsProtokoll
        id: invalidProtokollID, // wir "überschreiben" die ID
        patient: "George Weasly" // und den Patienten
    }
    const response = await testee.put(`/api/protokoll/${fredsProtokoll.id}`).send(update);

    expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id", body: "id" })
});

describe("GET Tests", () => {
    test("GET eintraege, Id is not valid", async () => {
        const testee = supertest(app);
        const response = await testee.get(`/api/protokoll/notValid/eintraege`);
        expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id" });
    })
    test("GET, Id is not valid", async () => {
        const testee = supertest(app);
        const response = await testee.get(`/api/protokoll/notValid`);
        expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id" });
    })
})

describe("POST Tests", () => {
    test("POST, invalid patient value", async () => {
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.post(`/api/protokoll`).send({
            patient: true,
            datum: "23.05.2024",
            ersteller: pomfrey.id
        });
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "patient" });
    })

    test("POST, datum has a wrong format", async () => {
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.post(`/api/protokoll`).send({
            patient: "jason",
            datum: undefined,
            ersteller: pomfrey.id
        });
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "datum" });
    })

    test("POST, ID has a wrong format", async () => {
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.post(`/api/protokoll`).send({
            patient: "jason",
            datum: "23.05.2024",
            ersteller: "NotAvalidID"
        });
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "ersteller" });
    })

    test("POST, testing the properties public and closed ", async () => {
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.post(`/api/protokoll`).send({
            patient: "jason",
            datum: "23.05.2024",
            ersteller: pomfrey.id,
            public: "yes",
            closed: "no"
        });
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: ["public", "closed"] });
    })
    test("POST, testing the properties public and closed -> string to boolean", async () => {
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.post(`/api/protokoll`).send({
            patient: "jason",
            datum: "23.05.2024",
            ersteller: pomfrey.id,
            public: "true",
            closed: "false"
        });
        expect(response.status).toBe(200);
    })
    test("POST, testing the properties public and closed -> number to boolean", async () => {
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.post(`/api/protokoll`).send({
            patient: "jason",
            datum: "23.05.2024",
            ersteller: pomfrey.id,
            public: "1",
            closed: "0"
        });
        expect(response.status).toBe(200);
    })
    test("POST, testing patient-datum constraint error", async () => {
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.post(`/api/protokoll`).send({
            patient: "Fred Weasly",
            datum: "01.10.2023",
            ersteller: pomfrey.id,
        });
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: ["patient", "datum"] });
        expect(response.body.errors).toContainEqual(expect.objectContaining({
            msg: "Unique constraint of Patient Datum combination violated"
        }));
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: "patient" }),
                expect.objectContaining({ path: "datum" })
            ])
        );
    })

    test("POST Fehler Protokoll mit selben Patienten und Datum", async () => {
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const protokoll: ProtokollResource = { patient: "Fred Weasly", datum: "01.10.2023", public: true, closed: false, ersteller: pomfrey.id! };
        const response = await testee.post(`/api/protokoll/`).send(protokoll);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: ["patient", "datum"] });
    });
})

describe("PUT Tests", () => {
    test("PUT, Id is not valid", async () => {
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.put(`/api/protokoll/notAvalidID`).send({
            id: "notAvalidID",
            patient: "jason",
            datum: "23.05.2024",
            ersteller: pomfrey.id,
        });
        expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id", body: "id" });
    })
    test("PUT, Id is valid but does not exist", async () => {
        const notExisteingID = "6651d4ea795ddbfd7f092890";
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.put(`/api/protokoll/${notExisteingID}`).send({
            id: notExisteingID,
            patient: "jason",
            datum: "23.05.2024",
            ersteller: pomfrey.id,
        });
        expect(response).toHaveValidationErrorsExactly({ status: "500" });
    })

    test("PUT, pfleger id is not valid", async () => {
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.put(`/api/protokoll/${fredsProtokoll.id}`).send({
            id: fredsProtokoll.id,
            patient: "jason",
            datum: "23.05.2024",
            ersteller: "notValidID",
        });
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "ersteller" });
    })

    test("PUT, testing patient-datum constraint error", async () => {
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const update: ProtokollResource = {
            ersteller: pomfrey.id!,
            id: fredsProtokoll.id,
            patient: "Fred Weasly",
            datum: "01.10.2023",
            public: true,
            closed: false
        };
        const response = await testee.put(`/api/protokoll/${fredsProtokoll.id}`).send(update);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: ["patient", "datum"] });
        expect(response.body.errors).toContainEqual(expect.objectContaining({
            msg: "Unique constraint of Patient Datum combination violated"
        }));
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: "patient" }),
                expect.objectContaining({ path: "datum" })
            ])
        );
    });
})

describe("DELETE Tests", () => {
    test("DELETE", async () => {
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.delete(`/api/protokoll/notValid`);
        expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id" });
    })
})