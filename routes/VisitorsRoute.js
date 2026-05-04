import express from "express";
import {
  AddApartment,
  AddFlat,
  AddVisitor,
  GetVisitorByPhone,
  DeleteApartment,
  DeleteFlat,
  DeleteVisitor,
  UpdateApartment,
  UpdateFlat,
  UpdateVisitor,
} from "../controller/VisitorsController.js";
import authenticateToken from "../middlewares/verifyToken.js";

const VisitorsRoute = express.Router();

VisitorsRoute.get("/getVisitorByPhone", authenticateToken, GetVisitorByPhone);

VisitorsRoute.post("/addApartment", authenticateToken, AddApartment);
VisitorsRoute.post("/addFlat", authenticateToken, AddFlat);
VisitorsRoute.post("/addVisitor", authenticateToken, AddVisitor);
VisitorsRoute.put("/updateApartment", authenticateToken, UpdateApartment);
VisitorsRoute.put("/updateFlat", authenticateToken, UpdateFlat);
VisitorsRoute.put("/updateVisitor", authenticateToken, UpdateVisitor);
VisitorsRoute.delete("/deleteApartment", authenticateToken, DeleteApartment);
VisitorsRoute.delete("/deleteFlat", authenticateToken, DeleteFlat);
VisitorsRoute.delete("/deleteVisitor", authenticateToken, DeleteVisitor);

export default VisitorsRoute;
