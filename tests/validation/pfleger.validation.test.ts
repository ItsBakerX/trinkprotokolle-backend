// must be imported before any other imports
import dotenv from "dotenv";
dotenv.config();

import "restmatcher";
import supertest from "supertest";
import { EintragResource, PflegerResource, ProtokollResource } from "../../src/Resources";
import app from "../../src/app";
import { createPfleger } from "../../src/services/PflegerService";
import { createProtokoll } from "../../src/services/ProtokollService";
import { createEintrag } from "../../src/services/EintragService";
import { performAuthentication, supertestWithAuth } from "../supertestWithAuth";

let pomfrey: PflegerResource
let fredsProtokoll: ProtokollResource
let fredsEintrag: EintragResource
let pass ="k1yoO4Yy!HW3P."

beforeEach(async () => {
    pomfrey = await createPfleger({
        name: "Poppy Pomfrey", password: "12345bcdABCD..;,.", admin: true
    });
    fredsProtokoll = await createProtokoll({
        patient: "Fred Weasly", datum: "01.10.2023",
        public: true, closed: false,
        ersteller: pomfrey.id!
    })
    fredsEintrag = await createEintrag({
        protokoll: fredsProtokoll.id!,
        ersteller: pomfrey.id!,
        getraenk: "Kaffee",
        menge: 100
    });
})

describe("POST Tests", () => {
    test("POST, invalid name value", async () => {
        const pfleger = {
            name: 123,
            password: pass,
            admin: false
        }
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.post("/api/pfleger/").send(pfleger);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "name" });
    })
    test("POST, invalid password value", async () => {
        const pfleger = {
            name: "jason",
            password: 123,
            admin: false
        }
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.post("/api/pfleger/").send(pfleger);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "password" });
    })
    test("POST, invalid admin value", async () => {
        const pfleger = {
            name: "jason",
            password: pass,
            admin: 123
        }
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.post("/api/pfleger/").send(pfleger);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "admin" });
    })
    test("POST, duplicate name error", async () => {
        const pfleger = {
            name: "Poppy Pomfrey",
            password: pass,
            admin: false
        }
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.post("/api/pfleger/").send(pfleger);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "name" });
        expect(response.body.errors).toContainEqual(expect.objectContaining({
            msg: "Duplicate, name pfleger already exists"
        }));
        expect(response.body.errors).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ path: "name" })
            ])
        );
    })
})

describe("PUT Tests", () => {
    // test("PUT, Id is not valid", async () => {
    //     const testee = supertest(app);
    //     const invalidProtokollID = "pomfrey.id";
    //     const update: PflegerResource = {
    //         ...pomfrey, // Hint: Kopie von pomfrey
    //         id: invalidProtokollID, // wir "überschreiben" die ID
    //         password: "abcd" // und den Patienten
    //     }
    //     const response = await testee.put(`/api/protokoll/${pomfrey.id}`).send(update);
    
    //     expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id", body: "id" })
    // })

    test("PUT, name is not valid", async () => {
        const pfleger ={
            id: pomfrey.id,
            password: pass,
            admin: false
        }
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.put(`/api/pfleger/${pomfrey.id}`).send(pfleger);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "name" });
    })
    test("PUT, password is not valid", async () => {
        const pfleger ={
            id: pomfrey.id,
            name: "jason",
            password: 123,
            admin: false
        }
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.put(`/api/pfleger/${pomfrey.id}`).send(pfleger);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "password" });
    })
    test("PUT, admin is not valid", async () => {
        const pfleger ={
            id: pomfrey.id,
            name: "jason",
            password: pass,
            admin: 123
        }
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.put(`/api/pfleger/${pomfrey.id}`).send(pfleger);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "admin" });
    })

    // test("PUT, duplicate name error", async () => {
    //     const pfleger ={
    //         id: pomfrey.id,
    //         name: "Poppy Pomfrey",
    //         password: pass,
    //         admin: false
    //     }
    //     const testee = supertest(app);
    //     const response = await testee.put(`/api/pfleger/${pomfrey.id}`).send(pfleger);
    //     expect(response).toHaveValidationErrorsExactly({ status: "400", body: "name" });
    // })
})

describe("DELETE Tests", () => {
    test("DELETE", async () => {
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
    const response = await testee.delete(`/api/pfleger/pomfrey.id`);
        expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id" });
    })
})