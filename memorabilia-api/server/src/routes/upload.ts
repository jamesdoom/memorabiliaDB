import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file as Express.Multer.File;

      if (!file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const stream = cloudinary.uploader.upload_stream(
        { folder: "memorabilia-cards" },
        (error, result) => {
          if (error || !result) {
            return res.status(500).json({ error: "Upload failed" });
          }

          return res.json({ url: result.secure_url });
        },
      );

      stream.end(file.buffer);
    } catch (err) {
      console.error("UPLOAD ERROR:", err);
      res.status(500).json({ error: "Upload error", details: err });
    }
  },
);

export default router;
