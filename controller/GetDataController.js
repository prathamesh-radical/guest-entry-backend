import db from "../db/db.js";

export const GetApartment = async (req, res) => {
    try {
        db.query("SELECT * FROM apartment WHERE user_id = ?", [req?.query?.user_id], async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error fetching values", success: false });
            }
            res.status(200).json({ message: "Apartments fetched successfully", success: true, apartment: result });
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", success: false });
    }
};

export const GetFlat = async (req, res) => {
    try {
        db.query("SELECT * FROM flat WHERE user_id = ?", [req?.query?.user_id], async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error fetching values", success: false });
            }
            res.status(200).json({ message: "Flats fetched successfully", success: true, flat: result });
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", success: false });
    }
};

export const GetVisitor = async (req, res) => {
    try {
        db.query("SELECT * FROM visitor WHERE user_id = ?", [req?.query?.user_id], async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error fetching values", success: false });
            }
            res.status(200).json({ message: "Visitors fetched successfully", success: true, visitor: result });
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", success: false });
    }
};

export const GetUser = async (req, res) => {
    try {
        db.query("SELECT * FROM registration WHERE id = ?", [req?.query?.user_id], async (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Error fetching values", success: false });
            }
            res.status(200).json({ message: "User fetched successfully", success: true, user: result });
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", success: false });
    }
};