import express from "express";
import { getAlleEintraege } from "../services/EintragService";
import { createProtokoll, deleteProtokoll, getAlleProtokolle, getProtokoll, updateProtokoll } from "../services/ProtokollService";
import { createPfleger, deletePfleger, getAllePfleger, updatePfleger } from "../services/PflegerService";
import { body, matchedData, param, validationResult } from "express-validator";
import { PflegerResource } from "../Resources";
import { optionalAuthentication, requiresAuthentication } from "./authentication";


export const pflegerRouter = express.Router();


pflegerRouter.get("/alle", optionalAuthentication, async (req, res, next) => {
    try {
        // check admin
        if(req.role!=="a"){
            return res.status(403).json({ message: "Access is prohibited, only admin has access" });
        }
        const pfleger = await getAllePfleger();
        res.send(pfleger);
    } catch (err) {
        res.status(404);
    }
});

pflegerRouter.post("",
    requiresAuthentication,
    body("name").isString().isLength({ min: 1, max: 100 }),
    body("password").isString().isStrongPassword().isLength({ min: 1, max: 100 }),
    body("admin").isBoolean(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const pflegerData = matchedData(req) as PflegerResource;
            // check admin
            if(req.role!=="a"){
                return res.status(403).json({ message: "Access is prohibited, only admin has access" });
            }
            const pfleger = await createPfleger(pflegerData);
            res.status(201).send(pfleger);
        } catch (err) {
            if (String(err).includes("Duplicate, name pfleger already exists")) {
                res.status(400).send({
                    errors: [
                        { type: "field", path: "name", location: "body", msg: "Duplicate, name pfleger already exists", value: req.body.name }
                    ]
                })
            }
            res.status(400);
            next(err);
        }
    });

pflegerRouter.put("/:id",
    requiresAuthentication,
    param("id").isMongoId(),
    body("id").isMongoId(),
    body("name").isString().isLength({ min: 1, max: 100 }),
    body("password").optional().isString().isStrongPassword().isLength({ min: 1, max: 100 }),
    body("admin").isBoolean(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        if (req.params!.id !== req.body.id) {
            res.status(400).send({
                errors: [
                    { type: "field", path: "id", location: "params", msg: "IDs od param and body do not match", value: req.params!.id },
                    { type: "field", path: "id", location: "body", msg: "IDs od param and body do not match", value: req.body.id }
                ]
            });
        }

        try {
            const pflegerData = matchedData(req) as PflegerResource;
            // check admin
            if(req.role!=="a"){
                return res.status(403).json({ message: "Access is prohibited, only admin has access" });
            }
            const pfleger = await updatePfleger(pflegerData);
            res.send(pfleger);
        } catch (err) {
            if (String(err).includes("Duplicate, name pfleger already exists")) {
                res.status(400).send(
                    {
                        errors: [
                            { type: "field", path: "name", location: "body", msg: "Duplicate, name pfleger already exists", value: req.body.name }
                        ]
                    }
                )
            }
            res.status(404);
            next(err);
        }
    });

pflegerRouter.delete("/:id",
    requiresAuthentication,
    param("id").isMongoId(),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const id = req.params!.id;
            // check admin
            if(req.role!=="a"){
                return res.status(403).json({ message: "Access is prohibited, only admin has access" });
            }
            // cannot delete self
            if(req.params.id===req.pflegerId){
                res.status(403).json({message: "cannot delete own account"});
            }
            await deletePfleger(id);
            res.status(204).send(); // 204 No Content for successful deletion
        } catch (err) {
            res.status(404);
            next(err);
        }
    });