import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nama: { type: String, required: true },
  jenisUsaha: { type: String, required: true },
  userID: { type: String, unique: true },
  isApproved: { type: Boolean, default: false },
});

export const User = mongoose.model("User", userSchema);
