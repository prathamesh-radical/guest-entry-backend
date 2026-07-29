import db from "../db/db.js";
import bcrypt from "bcryptjs";
import { promisify } from "util";

export const AddFlat = async (req, res) => {
    const { first_name, last_name, phone_no, apartment_name, floor_no, flat_no } =
        req.body;

    if (
        !req?.query?.user_id ||
        !first_name ||
        !last_name ||
        !phone_no ||
        !apartment_name ||
        !floor_no ||
        !flat_no
    ) {
        return res
            .status(400)
            .json({ message: "All fields are required", success: false });
    }

    const query = promisify(db.query).bind(db);

    try {
        const existingFlat = await query(
            "SELECT * FROM flat WHERE apartment_name = ? AND floor_no = ? AND flat_no = ? AND user_id = ?",
            [apartment_name, floor_no, flat_no, req?.query?.user_id],
        );

        if (existingFlat.length > 0) {
            return res.status(400).json({
                message:
                    "This flat is already registered for the entered floor no of selected apartment.",
                success: false,
            });
        }

        const result = await query(
            "INSERT INTO flat (user_id, first_name, last_name, phone_no, apartment_name, floor_no, flat_no) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
                req?.query?.user_id,
                first_name,
                last_name,
                phone_no,
                apartment_name,
                floor_no,
                flat_no,
            ],
        );

        if (result.affectedRows > 0) {
            return res.status(200).json({
                message: "Flat added successfully.",
                success: true,
            });
        } else {
            return res.status(404).json({
                message: "No record found with the provided id",
                success: false,
            });
        }
    } catch (error) {
        if (error.code === "ETIMEDOUT") {
            return res.status(503).json({
                message: "Database connection timeout. Please try again.",
                success: false,
            });
        }

        return res.status(500).json({
            message: "Internal Server Error",
            success: false,
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

export const UpdateFlat = async (req, res) => {
    const {
        first_name,
        last_name,
        phone_no,
        apartment_name,
        floor_no,
        flat_no,
        id,
    } = req.body;
    const { user_id } = req.query;

    if (
        !user_id ||
        !id ||
        !first_name ||
        !last_name ||
        !phone_no ||
        !apartment_name ||
        !floor_no ||
        !flat_no
    ) {
        return res
            .status(400)
            .json({ message: "All fields are required", success: false });
    }

    try {
        db.query(
            "SELECT * FROM flat WHERE id = ? AND user_id = ?",
            [id, user_id],
            (err, existingFlat) => {
                if (err) {
                    return res
                        .status(500)
                        .json({ message: "Error checking flat", success: false });
                }

                if (!existingFlat || existingFlat.length === 0) {
                    return res.status(404).json({
                        message: "No flat found with the provided id",
                        success: false,
                    });
                }

                db.query(
                    "SELECT * FROM flat WHERE apartment_name = ? AND floor_no = ? AND flat_no = ? AND user_id = ? AND id != ?",
                    [apartment_name, floor_no, flat_no, user_id, id],
                    (err, duplicateFlat) => {
                        if (err) {
                            return res.status(500).json({
                                message: "Error checking duplicate flat",
                                success: false,
                            });
                        }

                        if (duplicateFlat && duplicateFlat.length > 0) {
                            return res.status(400).json({
                                message:
                                    "This flat number is already registered for the entered floor no of selected apartment.",
                                success: false,
                            });
                        }

                        db.query(
                            "UPDATE flat SET first_name = ?, last_name = ?, phone_no = ?, apartment_name = ?, floor_no = ?, flat_no = ? WHERE id = ? AND user_id = ?",
                            [
                                first_name,
                                last_name,
                                phone_no,
                                apartment_name,
                                floor_no,
                                flat_no,
                                id,
                                user_id,
                            ],
                            (err, result) => {
                                if (err) {
                                    if (err.code === "ETIMEDOUT") {
                                        return res.status(503).json({
                                            message: "Database connection timeout. Please try again.",
                                            success: false,
                                        });
                                    }
                                    return res.status(500).json({
                                        message: "Error while updating the flat.",
                                        success: false,
                                        error:
                                            process.env.NODE_ENV === "development"
                                                ? err.message
                                                : undefined,
                                    });
                                }

                                if (result.affectedRows > 0) {
                                    return res.status(200).json({
                                        message: "Flat updated successfully.",
                                        success: true,
                                    });
                                } else {
                                    return res.status(404).json({
                                        message: "No record found with the provided id",
                                        success: false,
                                    });
                                }
                            },
                        );
                    },
                );
            },
        );
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Internal Server Error", success: false });
    }
};

export const DeleteFlat = async (req, res) => {
    const { id } = req.body;

    if (!req?.query?.user_id || !id) {
        return res
            .status(400)
            .json({ message: "All fields are required", success: false });
    }

    try {
        db.query(
            "SELECT * FROM flat WHERE id = ? AND user_id = ?",
            [id, req?.query?.user_id],
            (err, result) => {
                if (err) {
                    return res
                        .status(500)
                        .json({ message: "Error checking flat", success: false });
                }

                if (!result || result.length === 0) {
                    return res.status(404).json({
                        message: "No flat found with the provided id",
                        success: false,
                    });
                }

                db.query(
                    "DELETE FROM flat WHERE id = ? AND user_id = ?",
                    [id, req?.query?.user_id],
                    (err, deleteResult) => {
                        if (err) {
                            return res
                                .status(500)
                                .json({ message: "Error deleting flat", success: false });
                        }

                        if (deleteResult.affectedRows > 0) {
                            return res
                                .status(200)
                                .json({ message: "Flat deleted successfully.", success: true });
                        } else {
                            return res.status(404).json({
                                message: "No record found with the provided id",
                                success: false,
                            });
                        }
                    },
                );
            },
        );
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Internal Server Error", success: false });
    }
};

export const BulkDeleteFlat = async (req, res) => {
    const { ids } = req.body;
    const { user_id } = req.query;

    if (!user_id || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Flat ids are required", success: false });
    }

    try {
        const placeholders = ids.map(() => "?").join(",");

        db.query(
            `SELECT * FROM flat WHERE id IN (${placeholders}) AND user_id = ?`,
            [...ids, user_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "Error checking flats", success: false });
                }
                if (!result || result.length === 0) {
                    return res.status(404).json({ message: "No flats found with the provided ids", success: false });
                }

                db.query(
                    `DELETE FROM flat WHERE id IN (${placeholders}) AND user_id = ?`,
                    [...ids, user_id],
                    (err, deleteResult) => {
                        if (err) {
                            if (err.code === "ETIMEDOUT") {
                                return res.status(503).json({ message: "Database connection timeout. Please try again.", success: false });
                            }
                            return res.status(500).json({
                                message: "Error deleting flats",
                                success: false,
                                error: process.env.NODE_ENV === "development" ? err.message : undefined,
                            });
                        }
                        return res.status(200).json({
                            message: `${deleteResult.affectedRows} flat(s) deleted successfully.`,
                            success: true,
                            deletedCount: deleteResult.affectedRows,
                        });
                    },
                );
            },
        );
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};