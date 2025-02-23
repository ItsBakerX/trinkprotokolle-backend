import { constants } from 'fs';
import { access } from "fs/promises";

test.each([
    "src/model/PflegerModel.ts",
    "src/model/ProtokollModel.ts",
    "src/model/EintragModel.ts",
    "tests/model/PflegerModel.test.ts",
    "tests/model/ProtokollModel.test.ts",
    "tests/model/EintragModel.test.ts",
])('File "%s" is present', async(filename) => {
    await access(filename, constants.R_OK)
});

test.each([
    "Pfleger", "Protokoll", "Eintrag"
])('Model class "%s" defined and exported', async(domainClassName) => {
    const module = await import(`../src/model/${domainClassName}Model.ts`);
    const modelClass = module[domainClassName];
    expect(modelClass).toBeInstanceOf(Function);
});

