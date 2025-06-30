import express from "express";
import { GetApartment, GetFlat, GetUser, GetVisitor} from "../controller/GetDataController.js";
import authenticateToken from "../middlewares/verifyToken.js";

const GetRoutes = express.Router();

GetRoutes.get("/apartment", authenticateToken, GetApartment);
GetRoutes.get("/flat", authenticateToken, GetFlat);
GetRoutes.get("/visitor", authenticateToken, GetVisitor);
GetRoutes.get("/user", authenticateToken, GetUser);
export default GetRoutes;