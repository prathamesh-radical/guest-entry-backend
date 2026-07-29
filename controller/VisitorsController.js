import db from "../db/db.js";
import bcrypt from "bcryptjs";
import { promisify } from "util";

export const AddVisitor = async (req, res) => {
  const {
    first_name,
    last_name,
    phone_no,
    address,
    isActive,
    purpose,
    visitor_count,
    vehicle_type,
    vehicle_no,
    apartment_name,
    floor_no,
    flat_no,
    person_to_meet,
  } = req.body;

  const user_id = req?.query?.user_id;

  if (
    !user_id ||
    !first_name ||
    !last_name ||
    !phone_no ||
    !address ||
    !purpose ||
    !vehicle_type ||
    !apartment_name ||
    !floor_no ||
    !flat_no ||
    !person_to_meet
  ) {
    return res
      .status(400)
      .json({ message: "All fields are required", success: false });
  }

  try {
    db.query(
      "SELECT * FROM visitor WHERE phone_no=? AND user_id=?",
      [phone_no, user_id],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: "DB error", success: false });
        }

        if (result.length > 0) {
          const visitorId = result[0].id;

          db.query(
            "INSERT INTO visits (visitor_id, apartment_name, floor_no, flat_no, visit_date) VALUES (?, ?, ?, ?, ?)",
            [visitorId, apartment_name, floor_no, flat_no, new Date()],
            (err2) => {
              if (err2) {
                console.error("Visit insert error (existing visitor):", err2);
                return res.status(500).json({
                  message: "Visit log error",
                  success: false,
                  error:
                    process.env.NODE_ENV === "development"
                      ? err2?.message
                      : undefined,
                });
              }

              return res.status(200).json({
                message: "Existing visitor visit registered",
                autoFilled: true,
                visitor: result[0],
                success: true,
              });
            },
          );
        } else {
          db.query(
            `INSERT INTO visitor
              (user_id, first_name, last_name, phone_no, address, is_active, purpose, visitor_count, vehicle_type, vehicle_no, person_to_meet, apartment_name, floor_no, flat_no)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              user_id,
              first_name,
              last_name,
              phone_no,
              address,
              isActive,
              purpose,
              visitor_count || 1,
              vehicle_type,
              vehicle_no || null,
              person_to_meet,
              apartment_name,
              floor_no,
              flat_no,
            ],
            (err3, newVisitor) => {
              if (err3) {
                return res.status(500).json({
                  message: "Insert error",
                  success: false,
                  error:
                    process.env.NODE_ENV === "development"
                      ? err3?.message
                      : undefined,
                });
              }

              const visitorId = newVisitor.insertId;

              db.query(
                "INSERT INTO visits (visitor_id, apartment_name, floor_no, flat_no, visit_date) VALUES (?, ?, ?, ?, ?)",
                [visitorId, apartment_name, floor_no, flat_no, new Date()],
                (err4) => {
                  if (err4) {
                    console.error("Visit insert error (new visitor):", err4);
                    return res.status(500).json({
                      message: "Visit log error",
                      success: false,
                      error:
                        process.env.NODE_ENV === "development"
                          ? err4?.message
                          : undefined,
                    });
                  }

                  return res.status(200).json({
                    message: "New visitor registered",
                    success: true,
                  });
                },
              );
            },
          );
        }
      },
    );
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

export const GetVisitorByPhone = (req, res) => {
  const { phone_no } = req.query;
  const user_id = req.query.user_id;

  db.query(
    "SELECT * FROM visitor WHERE phone_no=? AND user_id=?",
    [phone_no, user_id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ success: false });
      }

      if (result.length > 0) {
        return res.json({
          exists: true,
          visitor: result[0],
        });
      }

      return res.json({
        exists: false,
      });
    },
  );
};

export const UpdateVisitor = async (req, res) => {
  const {
    first_name,
    last_name,
    phone_no,
    address,
    isActive,
    vehicle_type,
    vehicle_no,
    apartment_name,
    floor_no,
    flat_no,
    person_to_meet,
    id,
  } = req.body;
  const { user_id } = req.query;

  if (
    !user_id ||
    !id ||
    !first_name ||
    !last_name ||
    !phone_no ||
    !address ||
    !vehicle_type ||
    !apartment_name ||
    !floor_no ||
    !flat_no ||
    !person_to_meet
  ) {
    return res
      .status(400)
      .json({ message: "All fields are required", success: false });
  }

  if ((vehicle_type === "car" || vehicle_type === "bike") && !vehicle_no) {
    return res.status(400).json({
      message: "Vehicle number is required when vehicle type is car or bike.",
      success: false,
    });
  }

  try {
    db.query(
      "SELECT * FROM visitor WHERE id = ? AND user_id = ?",
      [id, user_id],
      (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error checking visitor", success: false });
        }

        if (!result || result.length === 0) {
          return res.status(404).json({
            message: "No visitor found with the provided id",
            success: false,
          });
        }

        db.query(
          "UPDATE visitor SET first_name = ?, last_name = ?, phone_no = ?, address = ?, is_active = ?, vehicle_type = ?, vehicle_no = ?, apartment_name = ?, floor_no = ?, flat_no = ?, person_to_meet = ? WHERE id = ? AND user_id = ?",
          [
            first_name,
            last_name,
            phone_no,
            address,
            isActive,
            vehicle_type,
            vehicle_no,
            apartment_name,
            floor_no,
            flat_no,
            person_to_meet,
            id,
            user_id,
          ],
          (err, updateResult) => {
            if (err) {
              if (err.code === "ETIMEDOUT") {
                return res.status(503).json({
                  message: "Database connection timeout. Please try again.",
                  success: false,
                });
              }

              return res.status(500).json({
                message: "Error while updating the visitor.",
                success: false,
                error:
                  process.env.NODE_ENV === "development"
                    ? err.message
                    : undefined,
              });
            }

            if (updateResult.affectedRows > 0) {
              return res.status(200).json({
                message: "Visitor updated successfully.",
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

export const DeleteVisitor = async (req, res) => {
  const { id } = req.body;

  if (!req?.query?.user_id || !id) {
    return res
      .status(400)
      .json({ message: "All fields are required", success: false });
  }

  try {
    db.query(
      "SELECT * FROM visitor WHERE id = ? AND user_id = ?",
      [id, req?.query?.user_id],
      (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error checking visitor", success: false });
        }

        if (!result || result.length === 0) {
          return res.status(404).json({
            message: "No visitor found with the provided id",
            success: false,
          });
        }

        db.query(
          "DELETE FROM visitor WHERE id = ? AND user_id = ?",
          [id, req?.query?.user_id],
          (err, deleteResult) => {
            if (err) {
              return res
                .status(500)
                .json({ message: "Error deleting visitor", success: false });
            }

            if (deleteResult.affectedRows > 0) {
              return res.status(200).json({
                message: "Visitor deleted successfully.",
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

export const BulkDeleteVisitor = async (req, res) => {
  const { ids } = req.body;
  const { user_id } = req.query;

  if (!user_id || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "Visitor ids are required", success: false });
  }

  try {
    const placeholders = ids.map(() => "?").join(",");

    db.query(
      `SELECT * FROM visitor WHERE id IN (${placeholders}) AND user_id = ?`,
      [...ids, user_id],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Error checking visitors", success: false });
        }
        if (!result || result.length === 0) {
          return res.status(404).json({ message: "No visitors found with the provided ids", success: false });
        }

        db.query(
          `DELETE FROM visitor WHERE id IN (${placeholders}) AND user_id = ?`,
          [...ids, user_id],
          (err, deleteResult) => {
            if (err) {
              return res.status(500).json({ message: "Error deleting visitors", success: false });
            }
            return res.status(200).json({
              message: `${deleteResult.affectedRows} visitor(s) deleted successfully.`,
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