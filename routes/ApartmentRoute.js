import express from "express";
import authenticateToken from "../middlewares/verifyToken.js";
import { AddApartment, DeleteApartment, UpdateApartment, BulkDeleteApartment } from "../controller/ApartmentController.js";

const ApartmentRoute = express.Router();

ApartmentRoute.post("/addApartment", authenticateToken, AddApartment);
ApartmentRoute.put("/updateApartment", authenticateToken, UpdateApartment);
ApartmentRoute.delete("/deleteApartment", authenticateToken, DeleteApartment);
ApartmentRoute.delete("/bulkDeleteApartment", authenticateToken, BulkDeleteApartment);

export default ApartmentRoute;