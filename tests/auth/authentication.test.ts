// must be imported before any other imports
import dotenv from "dotenv";
dotenv.config();

import supertest from 'supertest';
import express from 'express';
import { parseCookies } from "restmatcher";
import jwt from "jsonwebtoken";
import app from "../../src/app";
import { createPfleger } from "../../src/services/PflegerService";
import { optionalAuthentication, requiresAuthentication } from "../../src/routes/authentication";
import { verifyPasswordAndCreateJWT } from "../../src/services/JWTService";


let idHoffman: string
let nameHoffman: string;
let pass = "k1yoO4Yy!HW3P."

app.get('/requires-auth', requiresAuthentication, (req, res) => {
    res.status(200).json({ pflegerId: req.pflegerId, role: req.role });
});

app.get('/optional-auth', optionalAuthentication, (req, res) => {
    res.status(200).json({ pflegerId: req.pflegerId, role: req.role });
});

beforeEach(async () => {

    const hoffman = await createPfleger({ name: "Hoffman", password: pass, admin: false })
    idHoffman = hoffman.id!;
    nameHoffman = hoffman.name;
})

test("requiresAuthentication allows access with valid token", async () => {

    const token = await verifyPasswordAndCreateJWT(nameHoffman, pass);

    const response = await supertest(app)
        .get('/requires-auth')
        .set('Cookie', `access_token=${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('pflegerId', idHoffman);
    expect(response.body).toHaveProperty('role', 'u');
});

test("requiresAuthentication denys access without token", async () => {
    const response = await supertest(app)
        .get('/requires-auth');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Authentication required');
});

test("requiresAuthentication denys access with invalid token", async () => {
    const response = await supertest(app)
        .get('/requires-auth')
        .set('Cookie', `access_token=invalidtoken`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Invalid token');
});

test("optionalAuthentication allows access with valid token", async () => {

    const token = await verifyPasswordAndCreateJWT(nameHoffman, pass);

    const response = await supertest(app)
        .get('/optional-auth')
        .set('Cookie', `access_token=${token}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('pflegerId', idHoffman);
    expect(response.body).toHaveProperty('role', 'u');
});

test("optionalAuthentication allows access without token", async () => {
    const response = await supertest(app)
        .get('/optional-auth');

    expect(response.status).toBe(200);
    expect(response.body).not.toHaveProperty('pflegerId');
    expect(response.body).not.toHaveProperty('role');
});

test("optionalAuthentication denys access with invalid token", async () => {
    const response = await supertest(app)
        .get('/optional-auth')
        .set('Cookie', `access_token=invalidtoken`);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Invalid token');
});