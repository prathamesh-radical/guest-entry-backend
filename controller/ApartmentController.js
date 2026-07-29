import db from "../db/db.js";
import bcrypt from "bcryptjs";
import { promisify } from "util";

export const AddApartment = async (req, res) => {
    const { apartment_name, total_floors } = req.body;

    if (!req?.query?.user_id || !apartment_name || !total_floors) {
        return res
            .status(400)
            .json({ message: "All fields are required", success: false });
    }

    try {
        db.query(
            "SELECT * FROM apartment WHERE apartment_name = ? AND user_id = ?",
            [apartment_name, req?.query?.user_id],
            (err, result) => {
                if (err) {
                    return res
                        .status(500)
                        .json({ message: "Error checking existing user", success: false });
                }
                if (result.length > 0) {
                    return res.status(400).json({
                        message: "This apartment is already registered.",
                        success: false,
                    });
                }
                db.query(
                    "INSERT INTO apartment (user_id, apartment_name, total_floors) VALUES (?, ?, ?)",
                    [req?.query?.user_id, apartment_name, total_floors],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({
                                message: "Error while registering the apartment.",
                                success: false,
                            });
                        }
                        if (result.affectedRows > 0) {
                            return res.status(200).json({
                                message: "Apartment added successfully.",
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
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Internal Server Error", success: false });
    }
};

export const UpdateApartment = async (req, res) => {
    const { apartment_name, total_floors, id } = req.body;
    const { user_id } = req.query;

    if (!user_id || !id || !apartment_name || !total_floors) {
        return res
            .status(400)
            .json({ message: "All fields are required", success: false });
    }

    try {
        db.query(
            "SELECT * FROM apartment WHERE id = ? AND user_id = ?",
            [id, user_id],
            (err, selectResults) => {
                if (err) {
                    return res
                        .status(500)
                        .json({ message: "Error checking apartment", success: false });
                }

                if (!selectResults || selectResults.length === 0) {
                    return res.status(404).json({
                        message: "No apartment found with the provided id",
                        success: false,
                    });
                }

                const currentApartment = selectResults[0];
                const oldName = currentApartment.apartment_name;
                const oldFloors = currentApartment.total_floors;

                if (
                    oldName === apartment_name &&
                    Number(oldFloors) === Number(total_floors)
                ) {
                    return res.status(200).json({
                        message: "Apartment updated successfully (no changes)",
                        success: true,
                    });
                }

                const performUpdate = () => {
                    db.query(
                        "UPDATE apartment SET apartment_name = ?, total_floors = ? WHERE id = ? AND user_id = ?",
                        [apartment_name, total_floors, id, user_id],
                        (err, updateResult) => {
                            if (err) {
                                return res.status(500).json({
                                    message: "Error while updating the apartment.",
                                    success: false,
                                });
                            }

                            if (updateResult.affectedRows === 0) {
                                return res.status(404).json({
                                    message: "No record found with the provided id",
                                    success: false,
                                });
                            }

                            if (oldName !== apartment_name) {
                                db.query(
                                    "UPDATE flat SET apartment_name = ? WHERE apartment_name = ? AND user_id = ?",
                                    [apartment_name, oldName, user_id],
                                    (err) => {
                                        if (err) {
                                            return res.status(200).json({
                                                message:
                                                    "Apartment updated successfully, but failed to update related flats.",
                                                success: true,
                                            });
                                        }

                                        return res.status(200).json({
                                            message: "Apartment updated successfully.",
                                            success: true,
                                        });
                                    },
                                );
                            } else {
                                return res.status(200).json({
                                    message: "Apartment updated successfully.",
                                    success: true,
                                });
                            }
                        },
                    );
                };

                if (oldName !== apartment_name) {
                    db.query(
                        "SELECT * FROM apartment WHERE apartment_name = ? AND user_id = ? AND id != ?",
                        [apartment_name, user_id, id],
                        (err, nameResults) => {
                            if (err) {
                                return res.status(500).json({
                                    message: "Error checking existing apartment name",
                                    success: false,
                                });
                            }

                            if (nameResults && nameResults.length > 0) {
                                return res.status(400).json({
                                    message:
                                        "This apartment name is already registered by another record.",
                                    success: false,
                                });
                            }

                            performUpdate();
                        },
                    );
                } else {
                    performUpdate();
                }
            },
        );
    } catch (error) {
        return res
            .status(500)
            .json({ message: "Internal Server Error", success: false });
    }
};

export const DeleteApartment = async (req, res) => {
    const { id } = req.body;

    if (!req?.query?.user_id || !id) {
        return res
            .status(400)
            .json({ message: "All fields are required", success: false });
    }

    try {
        db.query(
            "SELECT * FROM apartment WHERE id = ? AND user_id = ?",
            [id, req?.query?.user_id],
            (err, result) => {
                if (err) {
                    return res
                        .status(500)
                        .json({ message: "Error checking apartment", success: false });
                }

                if (!result || result.length === 0) {
                    return res.status(404).json({
                        message: "No apartment found with the provided id",
                        success: false,
                    });
                }

                const apartment = result[0];

                db.query(
                    "DELETE FROM flat WHERE apartment_name = ? AND user_id = ?",
                    [apartment.apartment_name, req?.query?.user_id],
                    (err) => {
                        if (err) {
                            return res.status(500).json({
                                message: "Error deleting related flats",
                                success: false,
                            });
                        }

                        db.query(
                            "DELETE FROM apartment WHERE id = ? AND user_id = ?",
                            [id, req?.query?.user_id],
                            (err, deleteResult) => {
                                if (err) {
                                    return res.status(500).json({
                                        message: "Error deleting apartment",
                                        success: false,
                                    });
                                }

                                if (deleteResult.affectedRows > 0) {
                                    return res.status(200).json({
                                        message: "Apartment deleted successfully.",
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

export const BulkDeleteApartment = async (req, res) => {
    const { ids } = req.body;
    const { user_id } = req.query;

    if (!user_id || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Apartment ids are required", success: false });
    }

    try {
        const placeholders = ids.map(() => "?").join(",");

        db.query(
            `SELECT * FROM apartment WHERE id IN (${placeholders}) AND user_id = ?`,
            [...ids, user_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ message: "Error checking apartments", success: false });
                }
                if (!result || result.length === 0) {
                    return res.status(404).json({ message: "No apartments found with the provided ids", success: false });
                }

                const apartmentNames = result.map((a) => a.apartment_name);
                const namePlaceholders = apartmentNames.map(() => "?").join(",");

                db.query(
                    `DELETE FROM flat WHERE apartment_name IN (${namePlaceholders}) AND user_id = ?`,
                    [...apartmentNames, user_id],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ message: "Error deleting related flats", success: false });
                        }
                        db.query(
                            `DELETE FROM apartment WHERE id IN (${placeholders}) AND user_id = ?`,
                            [...ids, user_id],
                            (err, deleteResult) => {
                                if (err) {
                                    return res.status(500).json({ message: "Error deleting apartments", success: false });
                                }
                                return res.status(200).json({
                                    message: `${deleteResult.affectedRows} apartment(s) deleted successfully.`,
                                    success: true,
                                    deletedCount: deleteResult.affectedRows,
                                });
                            },
                        );
                    },
                );
            },
        );
    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};