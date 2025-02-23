import express from "express";
import { body, param, validationResult } from "express-validator";
import jwt from 'jsonwebtoken';
import { verifyJWT, verifyPasswordAndCreateJWT } from "../../src/services/JWTService";
import dotenv from 'dotenv';
dotenv.config();


export const loginRouter = express.Router();

loginRouter.post("/",
    body('name').isString(),
    body('password').isString(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, password } = req.body;

        try {
            const token = await verifyPasswordAndCreateJWT(name, password);
            if (!token) {
                return res.status(401).json({ message: "invalid token" });
            }

            const decodedToken = verifyJWT(token);

            res.cookie("access_token", token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                expires: new Date(decodedToken.exp! * 1000)
            });

            res.json(decodedToken);
        } catch (err) {
            res.status(500);
            next(err);
        }
    }
);

loginRouter.get("/",
    async (req, res) => {
        const token = req.cookies.access_token;

        if (!token) {
            return res.json(false);
        }

        try {
            const decodedToken = verifyJWT(token);
            res.json(decodedToken);
        } catch (err) {
            res.clearCookie("access_token");
            res.json(false);
        }
    });

loginRouter.delete("/",
    async (req, res) => {
        res.clearCookie("access_token");
        res.sendStatus(200);
    });