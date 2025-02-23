// istanbul ignore file

import { PflegerResource, ProtokollResource } from "./Resources";
import { logger } from "./logger";
import { Eintrag } from "./model/EintragModel";
import { Pfleger } from "./model/PflegerModel";
import { Protokoll } from "./model/ProtokollModel";
import { createEintrag } from "./services/EintragService";
import { createPfleger } from "./services/PflegerService";
import { createProtokoll } from "./services/ProtokollService";

/**
 * Erzeugt einen Benutzer "Behrens" und ein paar vom ihm angelegte Protokolle mit Einträgen.
 * Diese Funktion benötigen wir später zu Testzwecken im Frontend.
*/
export async function prefillDB(): Promise<{ behrens: PflegerResource; protokolle: ProtokollResource[]; }> {
    
    await Pfleger.syncIndexes();
    await Protokoll.syncIndexes();
    await Eintrag.syncIndexes();
    
    const behrens = await createPfleger({ name: "Behrens", password: "123_abc_ABC", admin: true });
    logger.info(`Prefill DB with test data, pfleger: ${behrens.name}, password 123_abc_ABC`);
    
    const protokolle: ProtokollResource[] = [];
    
    const itemsPerList = [[1, 4, 2, 0], [3, 5, 7]];
    const patienten = ["Hans", "Clawdia"];
    const datumPostfix = [".10.1907", ".11.1907"];
    const publicValue = [true, false];
    const getraenke = ["Kaffee", "Tee", "Sekt", "Limo"];
    const mengen = [150, 180, 200, 300];
    
    for (let k = 0; k < 2; k++) {
        for (let i = 0; i < itemsPerList[k].length; i++) {
            const protokoll = await createProtokoll({ patient: patienten[k], datum: (i + 1) + datumPostfix[k], public: publicValue[k], ersteller: behrens.id!, closed: false })
            let gesamtMenge = 0;
            for (let m = 0; m < itemsPerList[k][i]; m++) {
                const eintrag = await createEintrag({
                    getraenk: getraenke[m % getraenke.length], menge: mengen[m % mengen.length],
                    protokoll: protokoll.id!, ersteller: behrens.id!
                })
                gesamtMenge += eintrag.menge;
            }
            protokolle.push({ ...protokoll, gesamtMenge: gesamtMenge });
        }
    }
    return { behrens, protokolle };
}
