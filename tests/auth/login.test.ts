// must be imported before any other imports
import dotenv from "dotenv";
dotenv.config();

import { parseCookies } from "restmatcher";
import supertest from "supertest";
import app from "../../src/app";
import { createPfleger } from "../../src/services/PflegerService";
import { performAuthentication, supertestWithAuth } from "../supertestWithAuth";


/**
 * Eigentlich sind das hier sogar 5 Tests!
 */
test(`/api/login POST, Positivtest`, async () => {
    await createPfleger({ name: "John", password: "1234abcdABCD..;,.", admin: false })

    await performAuthentication("John", "1234abcdABCD..;,.");
    const testee = supertestWithAuth(app);
    const loginData = { name: "John", password: "1234abcdABCD..;,." };
    const response = parseCookies(await testee.post(`/api/login`).send(loginData));
    expect(response).statusCode("2*")

    // added by parseCookies, similar to express middleware cookieParser
    expect(response).toHaveProperty("cookies"); // added by parseCookies
    expect(response.cookies).toHaveProperty("access_token"); // the cookie with the JWT
    const token = response.cookies.access_token;
    expect(token).toBeDefined();

    // added by parseCookies, array with raw cookies, i.e. with all options and value
    expect(response).toHaveProperty("cookiesRaw");
    const rawCookie = response.cookiesRaw.find(c => c.name === "access_token");
    expect(rawCookie?.httpOnly).toBe(true);
    expect(rawCookie?.sameSite).toBe("None");
    expect(rawCookie?.secure).toBe(true);
});

test("/api/login GET, Positivtest", async () => {
    const john = await createPfleger({ name: "John", password: "1234abcdABCD..;,.", admin: false });

    await performAuthentication("John", "1234abcdABCD..;,.");
    const testee = supertestWithAuth(app);
    const loginData = { name: "John", password: "1234abcdABCD..;,." };
    const loginResponse = parseCookies(await testee.post(`/api/login`).send(loginData));
    expect(loginResponse).toHaveProperty("cookies");
    expect(loginResponse.cookies).toHaveProperty("access_token");
    const token = loginResponse.cookies.access_token;
    expect(token).toBeDefined();

    const getResponse = await testee.get(`/api/login`).set('Cookie', `access_token=${token}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toHaveProperty("id");
    expect(getResponse.body).toHaveProperty("role");
    expect(getResponse.body).toHaveProperty("exp");

    expect(getResponse.body.id).toBe(john.id);
    expect(getResponse.body.role).toBe("u");

});

test("/api/login GET, Negativtest (invalid token)", async () => {

    const testee = supertest(app);
    const invalidToken = 'invalidToken';

    const getResponse = await testee.get(`/api/login`).set('Cookie', `access_token=${invalidToken}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toBe(false);
});

test("/api/login DELETE, Positivtest", async () => {
    await createPfleger({ name: "John", password: "1234abcdABCD..;,.", admin: false });

    await performAuthentication("John", "1234abcdABCD..;,.");
    const testee = supertestWithAuth(app);
    const loginData = { name: "John", password: "1234abcdABCD..;,." };
    const loginResponse = parseCookies(await testee.post(`/api/login`).send(loginData));
    const token = loginResponse.cookies.access_token;

    const deleteResponse = await testee.delete(`/api/login`).set('Cookie', `access_token=${token}`);
    expect(deleteResponse.status).toBe(200);
});

test("/api/login DELETE, Positivtest (there is no cookie)", async () => {

    const testee = supertest(app);
    const deleteResponse = await testee.delete(`/api/login`);
    expect(deleteResponse.status).toBe(200);
});

