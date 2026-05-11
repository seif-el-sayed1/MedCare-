const Joi = require("joi");
const asyncHandler = require("express-async-handler");
const joiErrorHandler = require("./joiErrorHandler");

class AdminValidator {
  static validateAddAdmin = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      email: Joi.string().email().required(),
    });
    joiErrorHandler(schema, req);
    next();
  });
}

module.exports = AdminValidator;
