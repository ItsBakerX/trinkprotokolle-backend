import jwt from 'jsonwebtoken';
import { verifyJWT, verifyPasswordAndCreateJWT } from "../../src/services/JWTService";
import { createPfleger } from '../../src/services/PflegerService';


let idHoffman: string
let nameHoffman: string;
let pass = "k1yoO4Yy!HW3P."

beforeEach(async () => {
    const hoffman = await createPfleger({ name: "Hoffman", password: pass, admin: true })
    idHoffman = hoffman.id!;
    nameHoffman = hoffman.name;
})
describe("verifyPasswordAndCreateJWT Tests", () => {
    test("return a valid JWT for valid data", async () => {
        const token = await verifyPasswordAndCreateJWT(nameHoffman, pass);

        if (!token) {
            throw new Error("Token is undefined");
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);

        expect(decoded).toHaveProperty('sub', idHoffman);
        expect(decoded).toHaveProperty('role', 'a');
        expect(decoded).toHaveProperty('exp');
    });

    test("throw an error for invalid name", async () => {
        const name = 'invaliduser';

        const user = await verifyPasswordAndCreateJWT(name, pass);
        expect(user).toBe(undefined);
    });

    test("throw an error for invalid password", async () => {
        const password = 'invalidpassword';

        const user = await verifyPasswordAndCreateJWT(nameHoffman, password);
        expect(user).toBe(undefined);
    });

    test("throw an error if JWT_SECRET is not set", async () => {

        delete process.env.JWT_SECRET;
        await expect(async () => await verifyPasswordAndCreateJWT(nameHoffman, pass)).rejects.toThrow('env variable JWT_SECRET is not set');
        // Restore the JWT_SECRET environment variable for other tests
        process.env.JWT_SECRET = '75rIJp1R1rWUIfCg1oTl2SUzvKwie6Q0';
    });

    test("throw an error if JWT_TTL is not set", async () => {
        delete process.env.JWT_TTL;
        await expect(async () => await verifyPasswordAndCreateJWT(nameHoffman, pass)).rejects.toThrow('env variable JWT_TTL is not set');
        // Restore the JWT_TTL environment variable for other tests
        process.env.JWT_TTL = '1h';
    });
})
describe("verifyJWT Tests", () => {
    test("return payload for a valid token", async () => {

        const token = await verifyPasswordAndCreateJWT(nameHoffman, pass);
        const result = verifyJWT(token);

        expect(result).toEqual({
            id: idHoffman,
            role: 'a',
            exp: expect.any(Number),
        });
    });

    test("throw an error for an invalid token", async () => {
        const invalidToken = 'invalidToken';

         expect( () =>  verifyJWT(invalidToken)).toThrow(jwt.JsonWebTokenError);
         expect( () =>  verifyJWT(invalidToken)).toThrow('Invalid token');
    });

    test("throw an error for an expired token", async () => {

        // let the token expires in one second
        process.env.JWT_TTL = "1";
        const token = await verifyPasswordAndCreateJWT(nameHoffman, pass);

        // Wait for token to expire
        return new Promise((resolve) => setTimeout(resolve, 2000)).then(() => {
            expect( () =>  verifyJWT(token)).toThrow(jwt.JsonWebTokenError);
            expect( () =>  verifyJWT(token)).toThrow('Invalid token');
        });
        // Restore the JWT_TTL environment variable for other tests
        process.env.JWT_TTL = '1h';
    });

    test("throw an error if JWT_SECRET is not set", async () => {

        const token = await verifyPasswordAndCreateJWT(nameHoffman, pass);
        delete process.env.JWT_SECRET;

        expect(() => verifyJWT(token)).toThrow('env variable JWT_SECRET is not set');

        // Restore the JWT_SECRET environment variable for other tests
        process.env.JWT_SECRET = '75rIJp1R1rWUIfCg1oTl2SUzvKwie6Q0';
    });

    test("throw an error if JWT string is undefined", async () => {
         expect( () => verifyJWT(undefined)).toThrow(jwt.JsonWebTokenError);
         expect( () =>  verifyJWT(undefined)).toThrow('jwtString is undefined');
    });
})
