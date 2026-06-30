import API from "./api";

export const register = (userData) => {
  return API.post("/auth/register", userData);
};

export const login = (userData) => {
  return API.post("/auth/login", userData);
};

export const verifyEmail = (token) => {
  return API.get(`/auth/verify/${token}`);
};

export const forgotPassword = (email) => {
  return API.post("/auth/forgot-password", { email });
};

export const resetPassword = (token, password) => {
  return API.post(`/auth/reset-password/${token}`, { password });
};

export const getMe = () => {
  return API.get("/auth/me");
};

export const updateProfile = (profileData) => {
  return API.put("/auth/profile", profileData);
};

export const changePassword = (passwordData) => {
  return API.put("/auth/change-password", passwordData);
};

export const deleteAccount = () => {
  return API.delete("/auth/account");
};
