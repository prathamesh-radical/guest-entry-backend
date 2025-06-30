import express from 'express';
import { AdminLogin, AdminRegister } from '../controller/AdminAuthController.js';

const AuthAdminRoute = express.Router();

AuthAdminRoute.post("/register", AdminRegister);
AuthAdminRoute.post("/login", AdminLogin);

export default AuthAdminRoute;