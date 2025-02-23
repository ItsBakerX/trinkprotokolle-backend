import express from "express";
import { getAlleEintraege } from "../services/EintragService";
import { createProtokoll, deleteProtokoll, getAlleProtokolle, getProtokoll, updateProtokoll } from "../services/ProtokollService";
import { body, matchedData, param, validationResult } from 'express-validator';
import { ProtokollResource } from "../Resources";
import { stringToDate } from "../services/ServiceHelper";
import { optionalAuthentication, requiresAuthentication } from "./authentication";

export const protokollRouter = express.Router();

protokollRouter.get("/:id/eintraege",
    optionalAuthentication,
    param("id").isMongoId(), // Ensure the id parameter is a valid MongoDB ObjectId
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const id = req.params!.id;
            const eintraege = await getAlleEintraege(id);
            if (!eintraege) {
                return res.status(404).json({ message: "Einträge not found" });
            }
            res.send(eintraege);
        } catch (err) {
            res.status(404);
            next(err);
        }
    });

protokollRouter.get("/alle",
    optionalAuthentication,
    async (req, res, next) => {
        try {
            const id= req.pflegerId;
            if (id) {
                const protokolle = await getAlleProtokolle(id);
                res.send(protokolle);
            }else{
                const protokolle = await getAlleProtokolle();
                res.send(protokolle);
            }

        } catch (err) {
            res.status(404);
            next(err);
        }
    });

protokollRouter.get("/:id",
    optionalAuthentication,
    param("id").isMongoId(), // Ensure the id parameter is a valid MongoDB ObjectId
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const id = req.params!.id;
            const protokoll = await getProtokoll(id);
            if (!protokoll) {
                return res.status(404).json({ message: "Protokoll not found" });
            }
            // requiresOwnership
            if (!protokoll.public && (protokoll.ersteller !== req.pflegerId)) {
                return res.status(403).json({ message: "STOP, not owner of this Protokoll are not allowed to read" });
            }
            res.send(protokoll);
        } catch (err) {
            res.status(404);
            next(err);
        }
    });

protokollRouter.post("",
    requiresAuthentication,
    body("patient").isString().isLength({ min: 1, max: 100 }),
    body("datum").isDate({ format: "DD.MM.YYYY", delimiters: ["."] }), // Ensure the date is in a valid format
    body("public").optional().isBoolean(),
    body("closed").optional().isBoolean(),
    body("ersteller").isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const protokollData = matchedData(req) as ProtokollResource;
            const protokoll = await createProtokoll(protokollData);
            res.send(protokoll);
        } catch (err) {
            if (String(err).includes("Unique constraint of Patient Datum combination violated")) {
                return res.status(400).send({
                    errors: [
                        { type: "field", path: "patient", location: "body", msg: "Unique constraint of Patient Datum combination violated", value: req.body.patient },
                        { type: "field", path: "datum", location: "body", msg: "Unique constraint of Patient Datum combination violated", value: req.body.datum }
                    ]
                })
            }
            res.status(400);
            next(err);
        }
    });

protokollRouter.put("/:id",
    requiresAuthentication,
    param("id").isMongoId(), // Ensure the id parameter is a valid MongoDB ObjectId
    body("id").isMongoId(),
    body("patient").isString().isLength({ min: 1, max: 100 }),
    body("datum").isDate({ format: "DD.MM.YYYY", delimiters: ["."] }),
    body("public").optional().isBoolean(),
    body("closed").optional().isBoolean(),
    body("ersteller").isMongoId(),
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
        const id = req.params!.id;
        const protokoll = await getProtokoll(id);
        // requiresOwnership
        if (protokoll.ersteller !== req.pflegerId) {
            return res.status(403).json({ message: "STOP, not owner of this Protokoll are not allowed to make changes" });
        }
        try {
            const protokollData = matchedData(req) as ProtokollResource;
            const protokoll = await updateProtokoll(protokollData);
            res.send(protokoll);
        } catch (err) {
            if (String(err).includes("Unique constraint of Patient Datum combination violated")) {
                res.status(400).send({
                    errors: [
                        { type: "field", path: "patient", location: "body", msg: "Unique constraint of Patient Datum combination violated", value: req.body.patient },
                        { type: "field", path: "datum", location: "body", msg: "Unique constraint of Patient Datum combination violated", value: req.body.datum }
                    ]
                })
            }
            res.status(404);
            next(err);
        }
    });

protokollRouter.delete("/:id",
    requiresAuthentication,
    param("id").isMongoId(), // Ensure the id parameter is a valid MongoDB ObjectId
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const id = req.params!.id;
        const protokoll = await getProtokoll(id);
        // requiresOwnership
        if (protokoll.ersteller !== req.pflegerId) {
            return res.status(403).json({ message: "STOP, not owner of this Protokoll are not allowed to make changes" });
        }
        try {
            await deleteProtokoll(id);
            res.status(204).send(); // 204 No Content for successful deletion
        } catch (err) {
            res.status(404);
            next(err);
        }
    });