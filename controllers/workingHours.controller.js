const asyncHandler = require("express-async-handler");
const prisma = require("../startup/db");
const ApiError = require("../utils/ApiError");
const ApiFeatures = require("../utils/ApiFeatures");

const dayNames = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday"
}

class WorkingHoursController {

    //@desc add working hours for doctor
    //@route POST /doctors/:id/working-hours
    //@access private
    addWorkingHours = asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        const doctor = await prisma.$transaction(async (tx) => {
            const existingDoctor = await tx.doctor.findUnique({ where: { id } });
            if (!existingDoctor) throw new ApiError("Doctor not found", 404);

            await tx.workingHours.createMany({
                data: req.body.workingHours.map((item) => ({
                    ...item,
                    doctorId: id
                }))
            });

            return tx.doctor.findUnique({
                where: { id },
                include: { workingHours: true }
            });
        });

        res.status(201).json({
            success: true,
            message: "Working hours added successfully",
            data: doctor
        });
    });

    //@desc update working hours for doctor
    //@route PATCH /doctors/:id/working-hours/:whId
    //@access private
    updateWorkingHours = asyncHandler(async (req, res, next) => {
        const { id, whId } = req.params;

        // check working hours exists for this doctor
        const existingWorkingHours = await prisma.workingHours.findFirst({
            where: { id: whId, doctorId: id }
        });

        if (!existingWorkingHours) {
            return next(new ApiError("Working hours not found", 404));
        }

        // update working hours
        const updatedWorkingHours = await prisma.workingHours.update({
            where: { id: whId, doctorId: id },
            data: req.body
        });

        res.status(200).json({
            success: true,
            message: "Working hours updated successfully",
            data: updatedWorkingHours
        });
    });

    //@desc delete working hours for doctor
    //@route DELETE /doctors/:id/working-hours/:whId
    //@access private
    deleteWorkingHours = asyncHandler(async (req, res, next) => {
        const { id, whId } = req.params;

        // check working hours exists for this doctor
        const existingWorkingHours = await prisma.workingHours.findFirst({
            where: { id: whId, doctorId: id }
        });

        if (!existingWorkingHours) {
            return next(new ApiError("Working hours not found", 404));
        }

        // delete working hours
        await prisma.workingHours.delete({
            where: { id: whId, doctorId: id }
        });

        res.status(200).json({
            success: true,
            message: "Working hours deleted successfully"
        });
    });

    //@desc add doctor leave
    //@route PATCH /doctors/:id/leaves
    //@access private
    addDoctorLeave = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const days = req.body;

        await prisma.$transaction(async (tx) => {
            const doctor = await tx.doctor.findUnique({ where: { id } });
            if (!doctor) throw new ApiError("Doctor not found", 404);

            const today = new Date().getDay();

            for (const { day, weeksOfLeave } of days) {
                if (day < today) throw new ApiError(`${dayNames[day]} has already passed`, 400);

                const workingHours = await tx.workingHours.findUnique({
                    where: { doctorId_dayOfWeek: { doctorId: id, dayOfWeek: day } }
                });

                if (!workingHours) throw new ApiError(`Doctor doesn't work on ${dayNames[day]}`, 400);
                if (!workingHours.isAvailable) throw new ApiError(`${dayNames[day]} already has a leave`, 400);

                await tx.workingHours.update({
                    where: { doctorId_dayOfWeek: { doctorId: id, dayOfWeek: day } },
                    data: { isAvailable: false, weeksOfLeave }
                });
            }
        });

        res.status(200).json({
            success: true,
            message: "Doctor leave added successfully"
        });
    });

    //@desc cancel doctor leave
    //@route PATCH /doctors/:id/leaves-cancel
    //@access private
    editDoctorLeave = asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const days = req.body;

        await prisma.$transaction(async (tx) => {
            const doctor = await tx.doctor.findUnique({ where: { id } });
            if (!doctor) throw new ApiError("Doctor not found", 404);

            for (const { day, weeksOfLeave } of days) {
                const workingHours = await tx.workingHours.findUnique({
                    where: { doctorId_dayOfWeek: { doctorId: id, dayOfWeek: day } }
                });

                if (!workingHours) throw new ApiError(`Doctor doesn't work on ${dayNames[day]}`, 400);
                if (workingHours.isAvailable) throw new ApiError(`${dayNames[day]} has no leave`, 400);

                await tx.workingHours.update({
                    where: { doctorId_dayOfWeek: { doctorId: id, dayOfWeek: day } },
                    data: {
                        weeksOfLeave,
                        isAvailable: weeksOfLeave === 0
                    }
                });
            }
        });

        res.status(200).json({
            success: true,
            message: "Doctor leave updated successfully"
        });
    });

}

module.exports = new WorkingHoursController();