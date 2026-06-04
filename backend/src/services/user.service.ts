import { UserModel } from "../models/user.model.js";

export const getTrainees = async () => {
  return UserModel.find({ role: "user" })
    .select("_id name email role createdAt")
    .sort({ createdAt: -1 })
    .lean();
};
