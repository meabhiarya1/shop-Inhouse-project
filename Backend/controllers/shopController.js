const Shop = require('../models/Shop');

class ShopController {
  // Get all shops
  static async getAllShops(req, res) {
    try {
      const shops = await Shop.findAll();

      res.status(200).json({
        success: true,
        data: shops
      });
    } catch (error) {
      console.error('Error fetching shops:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching shops'
      });
    }
  }

  // Get shop by ID
  static async getShopById(req, res) {
    try {
      const shop = await Shop.findByPk(req.params.id);

      if (!shop) {
        return res.status(404).json({
          success: false,
          message: 'Shop not found'
        });
      }

      res.status(200).json({
        success: true,
        data: shop
      });
    } catch (error) {
      console.error('Error fetching shop:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching shop details'
      });
    }
  }
}

module.exports = ShopController;
