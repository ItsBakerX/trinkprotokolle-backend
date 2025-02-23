import express from "express";
import { createEintrag, deleteEintrag, getAlleEintraege, getEintrag, updateEintrag } from "../services/EintragService";
import { createProtokoll, deleteProtokoll, getAlleProtokolle, getProtokoll, updateProtokoll } from "../services/ProtokollService";
import { createPfleger, deletePfleger, getAllePfleger, updatePfleger } from "../services/PflegerService";
import { param, body, validationResult, matchedData } from "express-validator";
import { EintragResource } from "../Resources";
import { optionalAuthentication, requiresAuthentication } from "./authentication";


export const eintragRouter = express.Router();


eintragRouter.get("/:id", optionalAuthentication,
    param("id").isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const id = req.params!.id;
            const eintrag = await getEintrag(id);
            const protokoll = await getProtokoll(eintrag.protokoll);
            if (!eintrag) {
                return res.status(404).send({ message: "Eintrag not found" });
            }
            if (!protokoll) {
                return res.status(404).send({ message: "Protokoll not found" });
            }
            // check Eintrag read access
            if (protokoll.public || protokoll.ersteller === req.pflegerId || eintrag.ersteller === req.pflegerId) {
                next;
            } else {
                return res.status(403).json({ message: "Access is prohibited" });
            }
            res.send(eintrag);
        } catch (err) {
            res.status(404);
            next(err);
        }
    });


eintragRouter.post("", requiresAuthentication,
    body("protokoll").isMongoId(),
    body("ersteller").isMongoId(),
    body("getraenk").isString().isLength({ min: 1, max: 100 }),
    body("menge").isNumeric(),
    body("kommentar").optional().isLength({ min: 1, max: 1000 }),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const eintragData = matchedData(req) as EintragResource;
            const protokoll = await getProtokoll(eintragData.protokoll);
            // check protokoll if public or ownership
            if (protokoll.public || protokoll.ersteller === req.pflegerId) {
                next;
            } else {
                return res.status(403).json({ message: "cannot add Eintrag to this protokoll if you are not the creator of this protokoll" });
            }
            const eintrag = await createEintrag(eintragData);
            res.send(eintrag);
        } catch (err) {
            if (String(err).includes("Protokoll is already closed")) {
                return res.status(400).send({
                    errors: [
                        { type: "field", path: "protokoll", location: "body", msg: "Protokoll is already closed", value: req.body.protokoll }
                    ]
                })
            }
            res.status(404);
            next(err);
        }
    });

eintragRouter.put("/:id", requiresAuthentication,
    param("id").isMongoId(),
    body("id").isMongoId(),
    body("protokoll").isMongoId(),
    body("ersteller").isMongoId(),
    body("getraenk").isString().isLength({ min: 1, max: 100 }),
    body("menge").isNumeric(),
    body("kommentar").optional().isLength({ min: 1, max: 1000 }),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (req.params!.id !== req.body.id) {
            res.status(400).send({
                errors: [
                    { type: "field", path: "id", location: "params", msg: "the IDs of param and body do not match", value: req.params!.id },
                    { type: "field", path: "id", location: "body", msg: "the IDs of param and body do not match", value: req.body.id }
                ]
            });
        }
        try {
            const eintragData = matchedData(req) as EintragResource;
            const protokoll = await getProtokoll(eintragData.protokoll);
            // check Eintrag write access
            if (protokoll.ersteller === req.pflegerId || eintragData.ersteller === req.pflegerId) {
                next;
            } else {
                return res.status(403).json({ message: "Access is prohibited" });
            }
            const eintrag = await updateEintrag(eintragData);
            res.send(eintrag);
        } catch (err) {
            if (String(err).includes("Protokoll is already closed")) {
                return res.status(400).send({
                    errors: [
                        { type: "field", path: "protokoll", location: "body", msg: "Protokoll is already closed", value: req.body.protokoll }
                    ]
                })
            }
            res.status(404);
            next(err);
        }
    });

eintragRouter.delete("/:id", requiresAuthentication,
    param("id").isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const id = req.params!.id;
            const eintrag = await getEintrag(id);
            const protokoll = await getProtokoll(eintrag.protokoll);
            // check Eintrag write access
            if (protokoll.ersteller === req.pflegerId || eintrag.ersteller === req.pflegerId) {
                next;
            } else {
                return res.status(403).json({ message: "Access is prohibited" });
            }
            await deleteEintrag(id);
            res.status(204).send(); // 204 No Content for successful deletion
        } catch (err) {
            res.status(404);
            next(err);
        }
    });