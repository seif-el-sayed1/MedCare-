const asycnHandler = require("express-async-handler");
const prisma = require("../startup/db");
const ApiFeatures = require("../utils/apiFeatures");

class UserController {
    // @desc    Get my profile
    // @route   GET /api/v1/users/me
    // @access  Private (User)
    getMyProfile = asycnHandler(async (req, res) => {
        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                profilePicture: true,
                age: true,
                lang: true
            }
        });
        res.status(200).json({
            success: true,
            data: user,
        });
    });

    // @desc    Update my profile
    // @route   PATCH /api/v1/users/me
    // @access  Private (User)
    updateMyProfile = asycnHandler(async (req, res) => {
        const { firstName, lastName, phone, age } = req.body;
        const user = await prisma.user.update({
            where: {
                id: req.user.id,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                profilePicture: true,
                age: true,
                lang: true
            },
            data: {
                firstName,
                lastName,
                phone,
                age
            }
        });
        res.status(200).json({
            success: true,
            data: user,
        });
    });

    // @desc    Update my language
    // @route   PATCH /api/v1/users/lang
    // @access  Private (User)
    updateLang = asycnHandler(async (req, res) => {
        const { lang } = req.body;
        const user = await prisma.user.update({
            where: {
                id: req.user.id,
            },
            select: {
                id: true,
                lang: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                profilePicture: true,
                age: true,
            },
            data: {
                lang
            }
        });
        res.status(200).json({
            success: true,
            data: user,
        });
    });

}

module.exports = new UserController();