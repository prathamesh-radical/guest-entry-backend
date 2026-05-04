import express from 'express';
import {
    AdminLogin, AdminRegister, DeleteUserAccount, UpdateUserData, UpdateUserPassword, VerifyUserPassword
} from '../controller/AdminAuthController.js';
import authenticateToken from '../middlewares/verifyToken.js';

const AuthAdminRoute = express.Router();

AuthAdminRoute.post("/register", AdminRegister);
AuthAdminRoute.post("/login", AdminLogin);
AuthAdminRoute.put("/updateUserData", authenticateToken, UpdateUserData);
AuthAdminRoute.put("/updateUserPassword", authenticateToken, UpdateUserPassword);
AuthAdminRoute.post("/verifypassword", authenticateToken, VerifyUserPassword);
AuthAdminRoute.delete("/deleteuseraccount", authenticateToken, DeleteUserAccount);

export default AuthAdminRoute;