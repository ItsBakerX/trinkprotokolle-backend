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

beforeEach(async () => {
    pomfrey = await createPfleger({
        name: "Poppy Pomfrey", password: "12345bcdABCD..;,.", admin: false
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

describe("GET Tests", () => {
    test("GET, Id is not valid", async () => {
        const testee = supertest(app);
        const response = await testee.get(`/api/eintrag/notValid`);
        expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id" });
    })
})

describe("POST Tests", () => {
    test("POST, invalid protokoll value", async () => {
        const eintrag = {
            protokoll: 123,
            ersteller: pomfrey.id,
            getraenk: "Kaffee",
            menge: 100
        }
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.post("/api/eintrag/").send(eintrag);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "protokoll" });
    })
    test("POST, invalid protokoll is closed", async () => {
        const pClosed = await createProtokoll({
            patient: "maxi", datum: "01.10.2023",
            public: true,
            closed: true,
            ersteller: pomfrey.id!
        })
        const eintrag = {
            protokoll: pClosed.id,
            ersteller: pomfrey.id,
            getraenk: "Kaffee",
            menge: 100,
        }
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.post("/api/eintrag/").send(eintrag);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "protokoll" });
        expect(response.body.errors).toContainEqual(expect.objectContaining({
            msg: "Protokoll is already closed"
        }));
    })
    test("POST, invalid ersteller value", async () => {
        const eintrag = {
            protokoll: fredsProtokoll.id,
            ersteller: 123,
            getraenk: "Kaffee",
            menge: 100
        }
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.post("/api/eintrag/").send(eintrag);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "ersteller" });
    })
    test("POST, invalid getraenk value", async () => {
        const eintrag = {
            protokoll: fredsProtokoll.id,
            ersteller: pomfrey.id,
            getraenk: 123,
            menge: 100
        }
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.post("/api/eintrag/").send(eintrag);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "getraenk" });
    })
    test("POST, invalid menge value", async () => {
        const eintrag = {
            protokoll: fredsProtokoll.id,
            ersteller: pomfrey.id,
            getraenk: "Kaffee",
            menge: true
        }
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.post("/api/eintrag/").send(eintrag);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "menge" });
    })
})

describe("PUT Tests", () => {
    test("PUT, Id is not valid", async () => {
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const invalidEintragID = pomfrey.id;
        const update: EintragResource = {
            ...fredsEintrag, // Hint: Kopie von fredsEintrag
            id: invalidEintragID, // wir "überschreiben" die ID
            getraenk: "Wasser"
        }
        const response = await testee.put(`/api/eintrag/${fredsEintrag.id}`).send(update);

        expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id", body: "id" })
    })

    test("PUT, protokoll id is not valid", async () => {
        const eintrag = {
            id: fredsEintrag.id,
            protokoll: "fredsProtokoll.id",
            ersteller: pomfrey.id,
            getraenk: "Kaffee",
            menge: 100
        }
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.put(`/api/eintrag/${fredsEintrag.id}`).send(eintrag);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "protokoll" });
    })

    test("PUT, ersteller id is not valid", async () => {
        const eintrag = {
            id: fredsEintrag.id,
            protokoll: fredsProtokoll.id,
            ersteller: "pomfrey.id",
            getraenk: "Kaffee",
            menge: 100
        }
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.put(`/api/eintrag/${fredsEintrag.id}`).send(eintrag);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "ersteller" });
    })

    test("PUT, getraenk is not valid, length above 100 error", async () => {
        const eintrag = {
            id: fredsEintrag.id,
            protokoll: fredsProtokoll.id,
            ersteller: pomfrey.id,
            getraenk: "gdezneqhuthvispiteyatesvkevtvaiheywngssytbsyijoxwzfzfsujlingcwycryugjntijilkadhqrycmgrtkfqbchduzznrjesepxnopyjaguibhmiwwmvhjkxozjkstjiquzfhgdlqhrvawlpnefcuabmcwwzexdirwweuljdulfvqsgcpepzckfozubgmhcxetkeojgxswicocatzadvvrmkdvykkghpo",
            menge: 100
        }
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.put(`/api/eintrag/${fredsEintrag.id}`).send(eintrag);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "getraenk" });
    })

    test("PUT, menge is not valid", async () => {
        const eintrag = {
            id: fredsEintrag.id,
            protokoll: fredsProtokoll.id,
            ersteller: pomfrey.id,
            getraenk: "Kaffee",
            menge: true
        }
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.put(`/api/eintrag/${fredsEintrag.id}`).send(eintrag);
        expect(response).toHaveValidationErrorsExactly({ status: "400", body: "menge" });
    })
    // test("PUT, invalid protokoll is closed", async () => {
    //     const pClosed = await createProtokoll({
    //         patient: "maxi", datum: "01.10.2023",
    //         public: true,
    //         closed: true,
    //         ersteller: pomfrey.id!
    //     })
    //     const eClosed = await createEintrag({
    //         protokoll: pClosed.id!,
    //         ersteller: pomfrey.id!,
    //         getraenk: "Kaffee",
    //         menge: 100
    //     });
    //     const eintrag = {
    //         id: eClosed.id,
    //         protokoll: pClosed.id,
    //         ersteller: pomfrey.id,
    //         getraenk: "Kaffee",
    //         menge: 100,
    //     }

    //     const testee = supertest(app);
    //     const response = await testee.put(`/api/eintrag/${eClosed.id}`).send(eintrag);
    //     expect(response).toHaveValidationErrorsExactly({ status: "400", body: "protokoll" });
    //     expect(response.body.errors).toContainEqual(expect.objectContaining({
    //         msg: "Protokoll is already closed"
    //     }));
    // })
})

describe("DELETE Tests", () => {
    test("DELETE", async () => {
        await performAuthentication("Poppy Pomfrey", "12345bcdABCD..;,.");
        const testee = supertestWithAuth(app);
        const response = await testee.delete(`/api/eintrag/notValid`);
        expect(response).toHaveValidationErrorsExactly({ status: "400", params: "id" });
    })
})