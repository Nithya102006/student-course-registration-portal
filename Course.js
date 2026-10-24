import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  seatsTotal: { type: Number, required: true, min: 1 },
  seatsAvailable: { type: Number, required: true, min: 0 }
}, { timestamps: true });

export default mongoose.model("Course", courseSchema);
