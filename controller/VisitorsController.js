import db from "../db/db.js";
import bcrypt from "bcrypt";

export const AddApartment = async (req, res) => {
    const { apartment_name } = req.body;

    if (!req?.query?.user_id || !apartment_name) {
        return res.status(400).json({ message: "All fields are required", success: false });
    }

    try {
        db.query(
            "SELECT * FROM apartment WHERE apartment_name = ? AND user_id = ?", [apartment_name, req?.query?.user_id], 
            (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "Error checking existing user", success: false });
                }
                if (result.length > 0) {
                    return res.status(400).json({ message: "This apartment is already registered.", success: false });
                }
                db.query(
                    "INSERT INTO apartment (user_id, apartment_name) VALUES (?, ?)", [req?.query?.user_id,apartment_name],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({ message: "Error while registering the apartment.", success: false });
                        }
                        if (result.affectedRows > 0) {
                            return res.status(200).json({ message: "Apartment added successfully.", success: true });
                        } else {
                            return res.status(404).json({ message: "No record found with the provided id", success: false });
                        }
                    }
                );
            }
        );
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

export const AddFlat = async (req, res) => {
    const { first_name, last_name, phone_no, apartment_name, floor_no, flat_no } = req.body;

    if (!req?.query?.user_id || !first_name || !last_name || !phone_no || !apartment_name || !floor_no || !flat_no) {
        return res.status(400).json({ message: "All fields are required", success: false });
    }

    try {
        db.query(
            "SELECT * FROM flat WHERE apartment_name = ? AND floor_no = ? AND flat_no = ? AND user_id = ?", [apartment_name, floor_no, flat_no, req?.query?.user_id], 
            (err, result) => {
                if (err) {
                    console.log("err", err)
                    return res.status(500).json({ message: "Error checking existing user", success: false });
                }
                if (result.length > 0) {
                    return res.status(400).json({ message: "This flat is already registered for the entered floor no of selected apartment.", success: false });
                }
                db.query(
                    "INSERT INTO flat (user_id, first_name, last_name, phone_no, apartment_name, floor_no, flat_no) VALUES (?, ?, ?, ?, ?, ?, ?)", [req?.query?.user_id, first_name, last_name, phone_no, apartment_name, floor_no, flat_no],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({ message: "Error while registering the flat.", success: false });
                        }
                        if (result.affectedRows > 0) {
                            return res.status(200).json({ message: "Flat added successfully.", success: true });
                        } else {
                            return res.status(404).json({ message: "No record found with the provided id", success: false });
                        }
                    }
                );
            }
        );
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

export const AddVisitor = async (req, res) => {
    const { first_name, last_name, phone_no, address, vehicle_type, vehicle_no, apartment_name, floor_no, flat_no, person_to_meet } = req.body;

    if (!req?.query?.user_id || !first_name || !last_name || !apartment_name || !floor_no || !flat_no || !person_to_meet || (
        (vehicle_type === "bike" || vehicle_type === "car") && !vehicle_no)
    ) {
        return res.status(400).json({ message: "All fields are required", success: false });
    }

    try {
        db.query(
            "INSERT INTO visitor (user_id, first_name, last_name, phone_no, address, vehicle_type, vehicle_no, apartment_name, floor_no, flat_no, person_to_meet) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [req?.query?.user_id, first_name, last_name, phone_no, address, vehicle_type, vehicle_no, apartment_name, floor_no, flat_no, person_to_meet],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "Error while registering the visitor.", success: false });
                }
                if (result.affectedRows > 0) {
                    return res.status(200).json({ message: "Visitor added successfully.", success: true });
                } else {
                    return res.status(404).json({ message: "No record found with the provided id", success: false });
                }
            }
        );
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

export const UpdateUserName = async (req, res) => {
    const { first_name, last_name } = req.body;

    if (!req?.query?.user_id || !first_name || !last_name) {
        return res.status(400).json({ message: "All fields are required", success: false });
    }

    try {
        db.query(
            "SELECT * FROM registration WHERE first_name = ? AND last_name = ? AND id = ?", [first_name, last_name, req?.query?.user_id], 
            (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "Error checking existing user", success: false });
                }
                if (result.length > 0) {
                    return res.status(400).json({ message: "This name is already registered.", success: false });
                }
                db.query(
                    "UPDATE registration SET first_name = ?, last_name = ? WHERE id = ?", [first_name, last_name, req?.query?.user_id],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({ message: "Error while updating the existing data.", success: false });
                        }
                        if (result.affectedRows > 0) {
                            return res.status(200).json({ message: "User Name updated successfully", success: true });
                        } else {
                            return res.status(404).json({ message: "No record found with the provided id", success: false });
                        }
                    }
                );
            }
        );
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

export const UpdateUserEmail = async (req, res) => {
    const { email } = req.body;
    const { user_id } = req.query;

    if (!user_id || !email) {
        return res.status(400).json({ message: "User ID and email are required", success: false });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format", success: false });
    }

    try {
        db.query("SELECT * FROM registration WHERE email = ? AND id = ?", [email, user_id], (err, result) => {
            if (err) {
                console.error("Error checking existing email:", err);
                return res.status(500).json({ message: "Error checking existing email", success: false });
            }
            if (result.length > 0) {
                return res.status(400).json({ message: "This email is already registered.", success: false });
            }
            db.query("UPDATE registration SET email = ? WHERE id = ?", [email, user_id], (err, result) => {
                if (err) {
                    console.error("Error updating email:", err);
                    return res.status(500).json({ message: "Error while updating email", success: false });
                }
                if (result.affectedRows > 0) {
                    return res.status(200).json({ message: "Email updated successfully", success: true });
                } else {
                    return res.status(404).json({ message: "No record found with the provided ID", success: false });
                }});
            }
        );
    } catch (error) {
        console.error("Internal server error:", error);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

export const UpdateUserPassword = async (req, res) => {
    const { password, confirm_password } = req.body;

    if (!req?.query?.user_id || !password || !confirm_password) {
        return res.status(400).json({ message: "All fields are required", success: false });
    }

    if (password !== confirm_password) {
        return res.status(400).json({ message: "Passwords do not match", success: false });
    }

    try {
        db.query("SELECT * FROM registration WHERE id = ?", [req?.query?.user_id], (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: "An error occurred" });
            }

            if (results.length === 0) {
                return res.status(400).json({ success: false, message: "No record found with the provided id" });
            }

            const currentPassword = results[0].password;

            bcrypt.compare(password, currentPassword, (err, isMatch) => {
                if (err) {
                    return res.status(500).json({ success: false, message: "An error occurred" });
                }

                if (isMatch) {
                    return res.status(400).json({ success: false, message: "Old and new password can't be the same." });
                }

                bcrypt.hash(password, 10, (err, hashedPassword) => {
                    if (err) {
                        return res.status(500).json({ success: false, message: err || "An error occurred" });
                    }

                    const updateQuery = "UPDATE registration SET password = ? WHERE id = ?";
                    db.query(updateQuery, [hashedPassword, req?.query?.user_id], (err, result) => {
                        if (err) {
                            return res.status(500).json({ success: false, message: err || "An error occurred" });
                        }

                        res.status(200).json({ success: true, message: "Password updated successfully" });
                    });
                });
            });
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};