import { LoginResource } from "../Resources";

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config() // read ".env"

import jwt from 'jsonwebtoken';
import { login } from "./AuthenticationService";


export async function verifyPasswordAndCreateJWT(name: string, password: string): Promise<string | undefined> {

    const secret = process.env.JWT_SECRET;
    const ttl = process.env.JWT_TTL;

    if (!secret) {
        throw new Error('env variable JWT_SECRET is not set');
    }
    if (!ttl) {
        throw new Error('env variable JWT_TTL is not set');
    }

    const user = await login(name, password);
    if (!user) {
        return undefined;
    }

    const payload = {
        sub: user.id,
        role: user.role
    };

    const token = jwt.sign(payload, secret, {
        algorithm: 'HS256',
        expiresIn: ttl
    });

    return token;
}

export function verifyJWT(jwtString: string | undefined): LoginResource {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('env variable JWT_SECRET is not set');
    }

    if (!jwtString) {
        throw new jwt.JsonWebTokenError('jwtString is undefined');
    }

    try {
        const decoded = jwt.verify(jwtString, secret) as jwt.JwtPayload;
        return {
            id: decoded.sub!,
            role: decoded.role,
            exp: decoded.exp || 0,
        };
    } catch (error) {
        throw new jwt.JsonWebTokenError('Invalid token');
    }
}
