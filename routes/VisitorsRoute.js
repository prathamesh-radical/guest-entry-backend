import express from "express";
import {
  AddVisitor,
  GetVisitorByPhone,
  DeleteVisitor,
  UpdateVisitor,
  BulkDeleteVisitor,
} from "../controller/VisitorsController.js";
import authenticateToken from "../middlewares/verifyToken.js";

const VisitorsRoute = express.Router();

VisitorsRoute.get("/getVisitorByPhone", authenticateToken, GetVisitorByPhone);
VisitorsRoute.post("/addVisitor", authenticateToken, AddVisitor);
VisitorsRoute.put("/updateVisitor", authenticateToken, UpdateVisitor);
VisitorsRoute.delete("/deleteVisitor", authenticateToken, DeleteVisitor);
VisitorsRoute.delete("/bulkDeleteVisitor", authenticateToken, BulkDeleteVisitor);

export default VisitorsRoute;