import axios from "axios";

const API = "http://localhost:5000/api";

export const getPdfs = () => {
  return axios.get(`${API}/pdf`);
};

export const askQuestion = (data) => {
  return axios.post(`${API}/chat`, data);
};