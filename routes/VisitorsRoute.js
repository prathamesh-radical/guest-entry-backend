import express from 'express';
import { AddApartment, AddFlat, AddVisitor, UpdateUserEmail, UpdateUserName, UpdateUserPassword } from '../controller/VisitorsController.js';
import authenticateToken from '../middlewares/verifyToken.js';

const VisitorsRoute = express.Router();

VisitorsRoute.post("/addApartment", authenticateToken, AddApartment);
VisitorsRoute.post("/addFlat", authenticateToken, AddFlat);
VisitorsRoute.post("/addVisitor", authenticateToken, AddVisitor);
VisitorsRoute.put("/updateUserName", authenticateToken, UpdateUserName);
VisitorsRoute.put("/updateUserEmail", authenticateToken, UpdateUserEmail);
VisitorsRoute.put("/updateUserPassword", authenticateToken, UpdateUserPassword);

export default VisitorsRoute;