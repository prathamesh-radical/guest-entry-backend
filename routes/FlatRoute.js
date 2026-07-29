import express from "express";
import authenticateToken from "../middlewares/verifyToken.js";
import { AddFlat, DeleteFlat, UpdateFlat, BulkDeleteFlat } from "../controller/FlatController.js";

const FlatRoute = express.Router();

FlatRoute.post("/addFlat", authenticateToken, AddFlat);
FlatRoute.put("/updateFlat", authenticateToken, UpdateFlat);
FlatRoute.delete("/deleteFlat", authenticateToken, DeleteFlat);
FlatRoute.delete("/bulkDeleteFlat", authenticateToken, BulkDeleteFlat);

export default FlatRoute;