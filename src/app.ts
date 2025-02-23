import express from 'express';
import "express-async-errors"; // needs to be imported before routers and other stuff!

import { loginRouter } from './routes/login';
import { eintragRouter } from './routes/eintrag';
import { pflegerRouter } from './routes/pfleger';
import { protokollRouter } from './routes/protokoll';
import cookieParser from 'cookie-parser';
import { configureCORS } from './configCORS';


const app = express();
configureCORS(app) 

// Middleware:
app.use('*', express.json()) // vgl. Folie 138
app.use(cookieParser()); 

// Routes

app.use("/api/login", loginRouter)   // wird erst später implementiert, hier nur Dummy; hat aber bereits einen Präfix
app.use("/api/protokoll", protokollRouter)   // wird erst später implementiert, hier nur Dummy; hat aber bereits einen Präfix
app.use("/api/pfleger", pflegerRouter)   // wird erst später implementiert, hier nur Dummy; hat aber bereits einen Präfix
app.use("/api/eintrag", eintragRouter)   // wird erst später implementiert, hier nur Dummy; hat aber bereits einen Präfix
// TODO: Registrieren Sie hier die weiteren Router:


export default app;