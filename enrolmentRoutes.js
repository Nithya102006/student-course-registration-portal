import { Router } from "express";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import Enrolment from "../models/Enrolment.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { courseId } = req.body;
    if (!mongoose.isValidObjectId(courseId)) return res.status(400).json({ message: "Choose a valid course." });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found." });
    const existing = await Enrolment.findOne({ student: req.userId, course: courseId });
    if (existing) return res.status(409).json({ message: "You are already enrolled in this course." });
    if (course.seatsAvailable < 1) return res.status(409).json({ message: "Sorry, no seats are available for this course." });

    // Conditional update helps avoid assigning a seat if the count has reached zero.
    const updatedCourse = await Course.findOneAndUpdate(
      { _id: courseId, seatsAvailable: { $gt: 0 } },
      { $inc: { seatsAvailable: -1 } },
      { new: true }
    );
    if (!updatedCourse) return res.status(409).json({ message: "Sorry, no seats are available for this course." });

    try {
      const enrolment = await Enrolment.create({ student: req.userId, course: courseId });
      res.status(201).json({ message: "Enrolment successful!", enrolment });
    } catch (error) {
      await Course.updateOne({ _id: courseId }, { $inc: { seatsAvailable: 1 } });
      if (error.code === 11000) return res.status(409).json({ message: "You are already enrolled in this course." });
      throw error;
    }
  } catch (error) { next(error); }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const enrolments = await Enrolment.find({ student: req.userId })
      .populate("course")
      .sort({ createdAt: -1 });
    res.json(enrolments);
  } catch (error) { next(error); }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid enrolment ID." });
    const enrolment = await Enrolment.findOne({ _id: req.params.id, student: req.userId });
    if (!enrolment) return res.status(404).json({ message: "Enrolment not found." });

    await Enrolment.deleteOne({ _id: enrolment._id });
    await Course.updateOne(
      { _id: enrolment.course },
      { $inc: { seatsAvailable: 1 } }
    );
    res.json({ message: "Enrolment cancelled successfully." });
  } catch (error) { next(error); }
});

export default router;
