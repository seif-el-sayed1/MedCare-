const asyncHandler = require("express-async-handler")
const prisma = require("../startup/db")
const ApiFeatures = require("../utils/ApiFeatures")
const ApiError = require("../utils/ApiError")
const { translate } = require("../utils/translation")
const {getAvailableSlots} = require("../utils/getAvaliabeSlots")

const dayNames = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday"
}
class DoctorController {

    // @desc add doctor
    // @route POST /doctors
    // @access private
    addDoctor = asyncHandler(async (req, res, next) => {
        const { email, workingHours, ...doctorData } = req.body
        
        const existDoctor = await prisma.doctor.findUnique({
            where: { email }
        })
        if (existDoctor) return next(new ApiError("Doctor already exist", 400))

        const doctor = await prisma.doctor.create({
            data: {
                ...doctorData,
                email,
                workingHours: {
                    create: workingHours
                }
            },
            include: {
                workingHours: true
            }
        })

        res.status(201).json({
            success: true,
            message: "Doctor created successfully",
            data: doctor
        })
    })

    //@desc get all doctors
    //@route GET /doctors
    //@access public
    getAllDoctors = asyncHandler(async (req, res, next) => {

        const apiFeatures = new ApiFeatures(prisma.doctor, req.query, "Doctor")
            .search()
            .filter()
            .sort()
            .paginate()
            .cleanResponse();

        const data = await apiFeatures.execute();

        await apiFeatures.calculatePagination();

        res.status(200).json({
            success: true,
            results: data.length,
            pagination: apiFeatures.paginationResult,
            data
        });
    });


}

module.exports = new DoctorController()