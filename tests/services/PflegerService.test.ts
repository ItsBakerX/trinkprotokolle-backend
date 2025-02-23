import { HydratedDocument } from "mongoose";
import { IPfleger, Pfleger } from "../../src/model/PflegerModel";
import bcrypt from "bcryptjs";
import { getAllePfleger, createPfleger, updatePfleger, deletePfleger } from "../../src/services/PflegerService";
import { PflegerResource, ProtokollResource } from "../../src/Resources";
import exp from "constants";
import { login } from "../../src/services/AuthenticationService";
import { dateToString } from "../../src/services/ServiceHelper";
import { createProtokoll } from "../../src/services/ProtokollService";
import { Protokoll } from "../../src/model/ProtokollModel";




test("getAllePfleger", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: false
    };
    const max: PflegerResource = {
        name: "max",
        password: "1234",
        admin: false
    };

    const johCreated = await createPfleger(john);
    const maxCreated = await createPfleger(max);
    if (!johCreated && !maxCreated) {
        throw Error("User has not been created");
    }
    let johnAndMax = await getAllePfleger();
    expect(johnAndMax[0].name).toBe(john.name);
    expect(johnAndMax[1].name).toBe(max.name);
    expect(johnAndMax[0].password).not.toBeDefined();
    expect(johnAndMax[1].password).not.toBeDefined();
})

test("Create Pfleger", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: false
    };

    const pflegerCreated = await createPfleger(john);
    if (!pflegerCreated) {
        throw Error("User has not been created");
    }
    expect(pflegerCreated.name).toBe(john.name);
    expect(pflegerCreated.id).toBeDefined();
    // weil createPfleger das Passwort nicht zurückgibt
    expect((pflegerCreated as any).password).not.toBeDefined();
})

test("updatePfleger", async () => {
    const pflegerjohn: PflegerResource = {
        
        name: 'John',
        password: 'oldPassword',
        admin: false
    };
    const pflegerjohnCreated = await createPfleger(pflegerjohn);
    const updatedJohn: PflegerResource = {
        id: pflegerjohnCreated.id,
        name: 'John Doe',
        password: 'newPassword',
        admin: true
    };
    const updatedJohnCreated = await updatePfleger(updatedJohn);

    // const result = await updatePfleger(updatedJohnCreated);

        // Überprüfung der Rückgabewerte
        expect(updatedJohnCreated).toEqual({
            id: pflegerjohnCreated.id,
            name: 'John Doe',
            admin: true
        });
        // Überprüfung, ob der Pfleger in der Datenbank aktualisiert wurde
        expect(updatedJohnCreated.name).toBe('John Doe');
        // expect(updatedJohnCreated.password).toBe('newPassword');
        expect(updatedJohnCreated.admin).toBe(true);
})

test("updatePfleger Fehler no pfleger found", async () => {
    const pflegerjohn: PflegerResource = {
        
        name: 'John',
        password: 'oldPassword',
        admin: false
    };
    const pflegerjohnCreated = await createPfleger(pflegerjohn);
    const updatedJohn: PflegerResource = {
        id: pflegerjohnCreated.id,
        name: 'John Doe',
        password: 'newPassword',
        admin: true
    };
    deletePfleger(updatedJohn.id!);
    await expect(async () =>  await updatePfleger(updatedJohn)).rejects.toThrow();
})

test("delete Pfleger", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: false
    };
    
    const pflegerCreated = await createPfleger(john);
    expect(pflegerCreated).toBeDefined();
    await deletePfleger(pflegerCreated.id!);
    const deletedPfleger = await Pfleger.findById(pflegerCreated.id).exec();
    expect(deletedPfleger).toBeNull();

})

test("delete Pfleger mit seinem Protokoll", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: false
    };
    const pflegerCreated = await createPfleger(john);
    expect(pflegerCreated).toBeDefined();

    const protokoll: ProtokollResource = {
        patient: "john",
        datum: dateToString(new Date("2021-08-03Z")),
        ersteller: pflegerCreated.id!,
        public: false
    };
    const johnProtokoll = await createProtokoll(protokoll);
    expect(johnProtokoll).toBeDefined();

    await deletePfleger(pflegerCreated.id!);
    const deletedPfleger = await Pfleger.findById(pflegerCreated.id).exec();
    const deletedProtokoll = await Protokoll.findById(johnProtokoll.id).exec();
    expect(deletedPfleger).toBeNull();
    expect(deletedProtokoll).toBeNull();

})

test("login Pfleger", async () => {
    const john: PflegerResource = {
        name: "john",
        password: "1234",
        admin: true
    };

    const pflegerCreated = await createPfleger(john);
    if (!pflegerCreated) {
        throw Error("User has not been created");
    }
    const validation = await login(pflegerCreated.name, "1234");
    const notValidation = await login(pflegerCreated.name, "123");
    const obj = {
        id:pflegerCreated.id,
        role: "a"
    };
    expect(validation).toEqual(obj);
    expect(notValidation).not.toEqual(obj);
    expect(notValidation).toBeFalsy();
})