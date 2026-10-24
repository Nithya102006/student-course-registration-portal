import { Router } from "express";
import Course from "../models/Course.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { search = "", category = "" } = req.query;
    const filter = {};
    if (search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { category: { $regex: safeSearch, $options: "i" } }
      ];
    }
    if (category && category !== "All") filter.category = category;
    const courses = await Course.find(filter).sort({ title: 1 });
    res.json(courses);
  } catch (error) { next(error); }
});

export default router;
