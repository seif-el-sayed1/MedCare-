const asyncHandler = require("express-async-handler");
const EmailController = require("./email.controller");
const ApiError = require("../utils/ApiError.js");
const { translate} = require("../utils/translation.js");
const prisma = require("../startup/db.js")
const Auth = require("../utils/auth.js")
const { ADMIN } = require("../utils/constants.js")

class AdminController {

  // @desc    Add new admin
  // @route   POST /admin
  // @access  Private
  addAdmin = asyncHandler(async(req, res, next) => {
    const { firstName, lastName, email } = req.body;
    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
      return next(new ApiError(translate("Admin already exists", req.user.lang), 400));
    }
    const admin = await prisma.admin.create({ data: { firstName, lastName, email, password: "PENDING" } });

    // Generate token for verification email
    const tokenData = await Auth.generateToken(admin.id, ADMIN, "admin")
    // Send verification mail
    await EmailController.adminVerificationEmail(tokenData.token, email);

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        _id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        fullName: admin.fullName,
        email: admin.email,
        isVerified: admin.isVerified
      }
    });
  })  


    
}

module.exports = new AdminController();