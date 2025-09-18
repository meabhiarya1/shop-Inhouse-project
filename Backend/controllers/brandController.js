const { validationResult } = require("express-validator");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const Brand = require("../models/Brand");

class BrandController {
  // Get all brands
  static async getAllBrands(req, res) {
    try {
      // Get all brands without pagination
      const brands = await Brand.findAll({
        order: [["brand_name", "ASC"]],
      });

      res.status(200).json({
        success: true,
        data: brands,
        total: brands.length,
      });
    } catch (error) {
      console.error("Error fetching brands:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching brands",
      });
    }
  }

  // Update brand
  static async updateBrand(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { brand_name } = req.body;

      const brand = await Brand.findByPk(id, { transaction });
      if (!brand) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: "Brand not found",
        });
      }

      // Check if another brand with the same name exists
      const existingBrand = await Brand.findOne({
        where: {
          brand_name: brand_name.trim().toLowerCase(),
          id: { [Op.ne]: id },
        },
        transaction,
      });

      if (existingBrand) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: "Another brand with this name already exists",
        });
      }

      await brand.update(
        {
          brand_name: brand_name.trim().toLowerCase(),
        },
        { transaction }
      );

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: "Brand updated successfully",
        data: brand,
      });
    } catch (error) {
      await transaction.rollback();
      console.error("Error updating brand:", error);
      res.status(500).json({
        success: false,
        message: "Error updating brand",
      });
    }
  }
}

module.exports = BrandController;
