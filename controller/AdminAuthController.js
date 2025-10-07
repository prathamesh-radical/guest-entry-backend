import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db/db.js";

export const AdminRegister = async (req, res) => {
    const { first_name, last_name, email, password, confirm_password } = req.body;

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(!emailPattern.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address.", success: false });
    }

    if (!first_name || !last_name || !email || !password || !confirm_password) {
        return res.status(400).json({ message: "All fields are required", success: false });
    }

    if (password !== confirm_password) {
        return res.status(400).json({ message: "Passwords do not match", success: false });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query("SELECT * FROM registration WHERE email = ?", [email], (err, result) => {
            if (result.length > 0) {
                return res.status(400).json({ message: "User already exists", success: false });
            } else {
                db.query(
                    "INSERT INTO registration (first_name, last_name, email, password) VALUES (?, ?, ?, ?)",
                    [first_name, last_name, email, hashedPassword],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({ message: "Error while registering you", success: false });
                        }
                        return res.status(200).json({ message: "User Registered Successfully", success: true });
                    }
                );
            }
        });
    } catch (error) {
        console.log("Error", error);
        return res.status(500).json({ message: "Internal Server Error", success: false })
    }
};

export const AdminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {
        db.query("SELECT * FROM registration WHERE email = ?", [email], async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error fetching values", success: false });
            }
            if (result.length > 0) {
                const isPasswordValid = await bcrypt.compare(password, result[0].password);
                if (isPasswordValid) {
                    const token = jwt.sign(
                        { id: result[0].id, email: result[0].email },
                        process.env.JWT_SECRET,
                        { expiresIn: "1d" }
                    );
                    return res.status(200).json({ message: "Login successfull.", success: true, token: token, userId: result[0].id});
                } else {
                    return res.status(401).json({ message: "Invalid Credential", success: false });
                }
            }
            else {
                return res.status(401).json({ message: "Invalid Credential", success: false });
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};