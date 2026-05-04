import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../db/db.js";

export const AdminRegister = async (req, res) => {
    const { first_name, last_name, country, phone_no, email, password, confirm_password } = req.body;

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address.", success: false });
    }

    if (!first_name || !last_name || !country || !phone_no || !email || !password || !confirm_password) {
        return res.status(400).json({ message: "All fields are required", success: false });
    }

    if (password !== confirm_password) {
        return res.status(400).json({ message: "Passwords do not match", success: false });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query("SELECT * FROM registration WHERE email = ?", [email], (err, result) => {
            console.log("err", err);
            if (result.length > 0) {
                return res.status(400).json({ message: "User already exists", success: false });
            } else {
                db.query(
                    "INSERT INTO registration (first_name, last_name, country, phone_no, email, password) VALUES (?, ?, ?, ?, ?, ?)",
                    [first_name, last_name, country, phone_no, email, hashedPassword],
                    (err, result) => {
                        if (err) {
                            console.log("err", err);
                            return res.status(500).json({ message: "Error while registering you", success: false });
                        }
                        return res.status(200).json({ message: "User Registered Successfully", success: true });
                    }
                );
            }
        });
    } catch (error) {
        console.log("error", error);
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
                    return res.status(200).json({ message: "Login successfull.", success: true, token: token, userId: result[0].id });
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

export const UpdateUserData = async (req, res) => {
    const { first_name, last_name, email, phone_no } = req.body;
    const { user_id } = req.query;

    if (!user_id) {
        return res
            .status(400)
            .json({ message: "User ID is required", success: false });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
        return res
            .status(400)
            .json({ message: "Invalid email format", success: false });
    }

    try {
        db.query(
            "SELECT * FROM registration WHERE id = ?",
            [user_id],
            (err, currentResults) => {
                if (err) {
                    return res.status(500).json({ message: "Error fetching current user data", success: false });
                }

                if (currentResults.length === 0) {
                    return res.status(404).json({ message: "No record found with the provided ID", success: false });
                }

                db.query(
                    "UPDATE registration SET first_name = ?, last_name = ?, email = ?, phone_no = ? WHERE id = ?",
                    [first_name, last_name, email, phone_no, user_id],
                    (err, updateResult) => {
                        if (err) {
                            return res.status(500).json({ message: "Error updating user data", success: false });
                        }
                        return res.status(200).json({ message: "User data updated successfully", success: true });
                    }
                );
            }
        );
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

export const UpdateUserPassword = async (req, res) => {
    const { new_password, confirm_password } = req.body;
    const { user_id } = req.query;

    // Basic Validation
    if (!user_id) {
        return res
            .status(400)
            .json({ message: "User ID is required", success: false });
    }

    if (!new_password || !confirm_password) {
        return res
            .status(400)
            .json({ message: "New password and confirmation are required", success: false });
    }

    if (new_password !== confirm_password) {
        return res.status(400).json({
            message: "New password and confirm password do not match",
            success: false,
        });
    }

    try {
        // Direct hash and update
        const hashedPassword = bcrypt.hashSync(new_password, 10);

        db.query(
            "UPDATE registration SET password = ? WHERE id = ?",
            [hashedPassword, user_id],
            (err, result) => {
                if (err) {
                    return res
                        .status(500)
                        .json({ message: "Error updating password", success: false });
                }

                // Check if any row was actually updated (ID exist karta hai ya nahi)
                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        message: "No user found with the provided ID",
                        success: false,
                    });
                }

                return res.status(200).json({
                    message: "Password updated successfully",
                    success: true,
                });
            }
        );
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Internal Server Error", success: false });
    }
};

export const VerifyUserPassword = async (req, res) => {
    const { password, confirmPassword } = req.body;
    const { user_id } = req.query;

    // 1. Validation
    if (!user_id) {
        return res.status(400).json({ message: "User ID is required", success: false });
    }

    if (!password || !confirmPassword) {
        return res.status(400).json({ message: "Password and confirm password are required for verification.", success: false });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: "Password and confirm password do not match.", success: false });
    }

    try {
        // 2. Database se hashed password nikalna
        db.query("SELECT password FROM registration WHERE id = ?", [user_id], (err, results) => {
            if (err) {
                return res.status(500).json({ message: "Database error during verification", success: false });
            }

            if (results.length === 0) {
                return res.status(404).json({ message: "User not found", success: false });
            }

            const user = results[0];

            // 3. Password compare karna
            const isPasswordValid = bcrypt.compareSync(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ message: "Invalid password. Please try again.", success: false });
            }

            // 4. Verification Success
            return res.status(200).json({ message: "Identity verified successfully", success: true });
        }
        );
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

export const DeleteUserAccount = async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ message: "User ID is required", success: false });
    }

    // Pool se connection mangiye
    db.getConnection((err, connection) => {
        if (err) {
            return res.status(500).json({ message: "Error acquiring database connection", success: false });
        }

        // Ab acquired connection par transaction shuru karein
        connection.beginTransaction(async (transactionErr) => {
            if (transactionErr) {
                connection.release(); // Error aane par connection wapas pool mein bhejein
                return res.status(500).json({ message: "Error starting transaction", success: false });
            }

            try {
                // 1. Delete Visits
                const deleteVisitsQuery = `
                    DELETE FROM visits 
                    WHERE visitor_id IN (SELECT id FROM visitor WHERE user_id = ?)
                `;

                connection.query(deleteVisitsQuery, [user_id], (err) => {
                    if (err) return rollbackAndRelease(connection, res, "Error deleting visits");

                    // 2. Delete Visitor
                    connection.query("DELETE FROM visitor WHERE user_id = ?", [user_id], (err) => {
                        if (err) return rollbackAndRelease(connection, res, "Error deleting visitor");

                        // 3. Delete Flat
                        connection.query("DELETE FROM flat WHERE user_id = ?", [user_id], (err) => {
                            if (err) return rollbackAndRelease(connection, res, "Error deleting flat");

                            // 4. Delete Apartment
                            connection.query("DELETE FROM apartment WHERE user_id = ?", [user_id], (err) => {
                                if (err) return rollbackAndRelease(connection, res, "Error deleting apartment");

                                // 5. Delete Registration (Main User)
                                connection.query("DELETE FROM registration WHERE id = ?", [user_id], (err, result) => {
                                    if (err) return rollbackAndRelease(connection, res, "Error deleting registration");

                                    // Commit the transaction
                                    connection.commit((commitErr) => {
                                        if (commitErr) return rollbackAndRelease(connection, res, "Commit failed");

                                        connection.release(); // Success ke baad release
                                        return res.status(200).json({
                                            message: "Account and data deleted successfully.",
                                            success: true
                                        });
                                    });
                                });
                            });
                        });
                    });
                });

            } catch (error) {
                rollbackAndRelease(connection, res, "Internal Server Error");
            }
        });
    });
};

// Helper function to rollback and release
const rollbackAndRelease = (connection, res, message) => {
    connection.rollback(() => {
        connection.release(); // Har haal mein connection release karna zaroori hai
        return res.status(500).json({ message, success: false });
    });
};