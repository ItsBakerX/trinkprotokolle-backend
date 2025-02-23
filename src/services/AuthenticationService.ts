import { PflegerResource } from "../Resources";
import mongoose from "mongoose";
import { Pfleger } from "../model/PflegerModel";


/**
 * Prüft Name und Passwort, bei Erfolg ist `success` true 
 * und es wird die `id` und `role` ("u" oder "a") des Pflegers zurückgegeben
 * 
 * Falls kein Pfleger mit gegebener Name existiert oder das Passwort falsch ist, wird nur 
 * `false` zurückgegeben. Aus Sicherheitsgründen wird kein weiterer Hinweis gegeben.
 */
export async function login(name: string, password: string): Promise<{ id: string, role: "a" | "u" } | false> {
    const pfleger = await Pfleger.findOne({ name }).exec();
    if (!pfleger) {
        return false;
    }
    const isPasswordCorrect = await pfleger.isCorrectPassword(password);
    if (!isPasswordCorrect) {
        // Wenn das Passwort falsch ist
        return false;
    }
    // wenn pfleger.admin true ist dann "a" wenn false dann "u" wird zurückgegeben
    return { id: pfleger.id, role: pfleger.admin ? "a" : "u" };
}