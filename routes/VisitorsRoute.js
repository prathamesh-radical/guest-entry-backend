import express from 'express';
import { AddApartment, AddFlat, AddVisitor, UpdateUserData } from '../controller/VisitorsController.js';
import authenticateToken from '../middlewares/verifyToken.js';

const VisitorsRoute = express.Router();

VisitorsRoute.post("/addApartment", authenticateToken, AddApartment);
VisitorsRoute.post("/addFlat", authenticateToken, AddFlat);
VisitorsRoute.post("/addVisitor", authenticateToken, AddVisitor);
VisitorsRoute.put("/updateUserData", authenticateToken, UpdateUserData);

export default VisitorsRoute;