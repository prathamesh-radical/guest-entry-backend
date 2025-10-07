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

export const UpdateUserData = async (req, res) => {
    const { first_name, last_name, email, password, confirm_password } = req.body;
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ message: "User ID is required", success: false });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format", success: false });
    }

    try {
        db.query("SELECT * FROM registration WHERE id = ?", [user_id], (err, currentResults) => {
            if (err) {
                console.error("Error fetching current user:", err);
                return res.status(500).json({ message: "Error fetching current user data", success: false });
            }

            if (currentResults.length === 0) {
                return res.status(404).json({ message: "No record found with the provided ID", success: false });
            }

            const currentUser = currentResults[0];
            const currentPassword = currentUser.password;

            const checkNameAndProceed = () => {
                db.query(
                    "SELECT * FROM registration WHERE (first_name = ? AND last_name = ?) AND id != ?",
                    [first_name, last_name, user_id],
                    (err, nameResults) => {
                        if (err) {
                            console.error("Error checking existing name:", err);
                            return res.status(500).json({ message: "Error checking existing name", success: false });
                        }

                        if (nameResults.length > 0) {
                            return res.status(400).json({ message: "This name is already registered by another user", success: false });
                        }

                        const proceedToUpdate = () => {
                            const updateUser = (hashedPassword) => {
                                let updateQuery = "UPDATE registration SET first_name = ?, last_name = ?";
                                let updateValues = [first_name, last_name];

                                if (email) {
                                    updateQuery += ", email = ?";
                                    updateValues.push(email);
                                }

                                if (hashedPassword) {
                                    updateQuery += ", password = ?";
                                    updateValues.push(hashedPassword);
                                }

                                updateQuery += " WHERE id = ?";
                                updateValues.push(user_id);

                                db.query(updateQuery, updateValues, (err, result) => {
                                    if (err) {
                                        console.error("Error updating user data:", err);
                                        return res.status(500).json({ message: "Error while updating user data", success: false });
                                    }

                                    if (result.affectedRows > 0) {
                                        return res.status(200).json({ message: "User data updated successfully", success: true });
                                    } else {
                                        return res.status(404).json({ message: "No record found with the provided ID", success: false });
                                    }
                                });
                            };

                            if (password) {
                                bcrypt.hash(password, 10, (err, hashedPassword) => {
                                    if (err) {
                                        console.error("Error hashing password:", err);
                                        return res.status(500).json({ message: "An error occurred while hashing password", success: false });
                                    }
                                    updateUser(hashedPassword);
                                });
                            } else {
                                updateUser(null);
                            }
                        };

                        if (email) {
                            db.query(
                                "SELECT * FROM registration WHERE email = ? AND id != ?",
                                [email, user_id],
                                (err, emailResults) => {
                                    if (err) {
                                        console.error("Error checking existing email:", err);
                                        return res.status(500).json({ message: "Error checking existing email", success: false });
                                    }

                                    if (emailResults.length > 0) {
                                        return res.status(400).json({ message: "This email is already registered by another user", success: false });
                                    }

                                    proceedToUpdate();
                                }
                            );
                        } else {
                            proceedToUpdate();
                        }
                    }
                );
            };

            if (password) {
                if (!confirm_password || password !== confirm_password) {
                    return res.status(400).json({ message: "Passwords do not match or confirm password is missing", success: false });
                }

                bcrypt.compare(password, currentPassword, (err, isMatch) => {
                    if (err) {
                        console.error("Error comparing passwords:", err);
                        return res.status(500).json({ message: "An error occurred while comparing passwords", success: false });
                    }

                    if (isMatch) {
                        return res.status(400).json({ message: "New password cannot be the same as the current password", success: false });
                    }

                    checkNameAndProceed();
                });
            } else {
                checkNameAndProceed();
            }
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};