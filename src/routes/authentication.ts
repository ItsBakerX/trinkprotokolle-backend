import { NextFunction, Request, Response } from "express";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { verifyJWT } from "../services/JWTService";
import { getProtokoll } from "../services/ProtokollService";
dotenv.config();

declare global {
    namespace Express {
        export interface Request {
            /**
             * Mongo-ID of currently logged in pfleger; or undefined, if pfleger is a guest.
             */
            pflegerId?: string;
            /**
             * Role of currently logged in pfleger; or undefined, if pfleger is a guest.
             */
            role?: "u" | "a";
        }
    }
}

export function requiresAuthentication(req: Request, res: Response, next: NextFunction) {

    const jwtString = req.cookies.access_token;
    if (!jwtString) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const userId = verifyJWT(jwtString);
        if (userId) {
            req.pflegerId = userId.id;
            req.role = userId.role;
        }
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
        next(err);
    }
}

export function optionalAuthentication(req: Request, res: Response, next: NextFunction) {

    const jwtString = req.cookies.access_token;
    if (!jwtString) {
        return next();
    }

    try {
        const userId = verifyJWT(jwtString);
        if (userId) {
            req.pflegerId = userId.id;
            req.role = userId.role;
        }
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
        next(err);
    }
}