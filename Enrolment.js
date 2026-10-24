import mongoose from "mongoose";

const enrolmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true }
}, { timestamps: true });

// One student can enrol in a course only once.
enrolmentSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model("Enrolment", enrolmentSchema);
