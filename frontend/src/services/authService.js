import axios from "axios";

const API = "http://localhost:5000/api/auth";

export const register = (userData) => {
  return axios.post(`${API}/register`, userData);
};

export const login = (userData) => {
  return axios.post(`${API}/login`, userData);
};