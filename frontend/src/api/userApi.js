import api from "./axiosInstance";

export const getProfile = () => {
  return api.get("/pessoa/profile");
};

export const updateProfile = (updateData) => {
  return api.patch("/pessoa/profile", updateData);
};

export const getAllUsers = () => {
  return api.get("/pessoa");
};
