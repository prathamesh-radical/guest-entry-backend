import db from "../db/db.js";
import bcrypt from "bcryptjs";
import { promisify } from "util";

// Add Functions
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
          // Existing visitor — just log the visit
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
          // New visitor
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
                console.error("Visitor insert error:", err3);
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

// Update Functions
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
          return res.status(500).json({
            message: "Error fetching current user data",
            success: false,
          });
        }

        if (currentResults.length === 0) {
          return res.status(404).json({
            message: "No record found with the provided ID",
            success: false,
          });
        }

        const checkNameAndProceed = () => {
          const checkEmailAndPhoneThenUpdate = () => {
            const proceedToUpdate = () => {
              let updateQuery =
                "UPDATE registration SET first_name = ?, last_name = ?";
              const updateValues = [first_name, last_name];

              if (email) {
                updateQuery += ", email = ?";
                updateValues.push(email);
              }

              if (phone_no) {
                updateQuery += ", phone_no = ?";
                updateValues.push(phone_no);
              }

              updateQuery += " WHERE id = ?";
              updateValues.push(user_id);

              db.query(updateQuery, updateValues, (err, result) => {
                if (err) {
                  return res.status(500).json({
                    message: "Error while updating user data",
                    success: false,
                  });
                }

                if (result.affectedRows > 0) {
                  return res.status(200).json({
                    message: "User data updated successfully",
                    success: true,
                  });
                } else {
                  return res.status(404).json({
                    message: "No record found with the provided ID",
                    success: false,
                  });
                }
              });
            };

            if (email) {
              db.query(
                "SELECT * FROM registration WHERE email = ? AND id != ?",
                [email, user_id],
                (err, emailResults) => {
                  if (err) {
                    return res.status(500).json({
                      message: "Error checking existing email",
                      success: false,
                    });
                  }

                  if (emailResults.length > 0) {
                    return res.status(400).json({
                      message:
                        "This email is already registered by another user",
                      success: false,
                    });
                  }

                  if (phone_no) {
                    db.query(
                      "SELECT * FROM registration WHERE phone_no = ? AND id != ?",
                      [phone_no, user_id],
                      (err, phoneResults) => {
                        if (err) {
                          return res.status(500).json({
                            message: "Error checking existing phone number",
                            success: false,
                          });
                        }

                        if (phoneResults.length > 0) {
                          return res.status(400).json({
                            message:
                              "This phone number is already registered by another user",
                            success: false,
                          });
                        }

                        proceedToUpdate();
                      },
                    );
                  } else {
                    proceedToUpdate();
                  }
                },
              );
            } else if (phone_no) {
              db.query(
                "SELECT * FROM registration WHERE phone_no = ? AND id != ?",
                [phone_no, user_id],
                (err, phoneResults) => {
                  if (err) {
                    return res.status(500).json({
                      message: "Error checking existing phone number",
                      success: false,
                    });
                  }

                  if (phoneResults.length > 0) {
                    return res.status(400).json({
                      message:
                        "This phone number is already registered by another user",
                      success: false,
                    });
                  }

                  proceedToUpdate();
                },
              );
            } else {
              proceedToUpdate();
            }
          };

          if (first_name && last_name) {
            db.query(
              "SELECT * FROM registration WHERE (first_name = ? AND last_name = ?) AND id != ?",
              [first_name, last_name, user_id],
              (err, nameResults) => {
                if (err) {
                  return res.status(500).json({
                    message: "Error checking existing name",
                    success: false,
                  });
                }

                if (nameResults.length > 0) {
                  return res.status(400).json({
                    message: "This name is already registered by another user",
                    success: false,
                  });
                }

                checkEmailAndPhoneThenUpdate();
              },
            );
          } else {
            checkEmailAndPhoneThenUpdate();
          }
        };

        checkNameAndProceed();
      },
    );
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false });
  }
};

export const UpdateUserPassword = async (req, res) => {
  const { current_password, new_password, confirm_password } = req.body;
  const { user_id } = req.query;

  if (!user_id) {
    return res
      .status(400)
      .json({ message: "User ID is required", success: false });
  }

  if (!current_password || !new_password || !confirm_password) {
    return res
      .status(400)
      .json({ message: "All fields are required", success: false });
  }

  if (new_password !== confirm_password) {
    return res.status(400).json({
      message: "New password and confirm password do not match",
      success: false,
    });
  }

  try {
    db.query(
      "SELECT * FROM registration WHERE id = ?",
      [user_id],
      (err, results) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Error fetching user data", success: false });
        }

        if (results.length === 0) {
          return res.status(404).json({
            message: "No record found with the provided ID",
            success: false,
          });
        }

        const user = results[0];

        const isPasswordValid = bcrypt.compareSync(
          current_password,
          user.password,
        );

        if (!isPasswordValid) {
          return res
            .status(401)
            .json({ message: "Current password is incorrect", success: false });
        }

        const isNewSameAsCurrent = bcrypt.compareSync(
          new_password,
          user.password,
        );
        if (isNewSameAsCurrent) {
          return res.status(400).json({
            message: "New password must differ from current password.",
            success: false,
          });
        }

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

            return res.status(200).json({
              message: "Password updated successfully",
              success: true,
            });
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

// Delete Functions
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
