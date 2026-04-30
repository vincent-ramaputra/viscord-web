import axios from "axios";

const baseURL =
  process.env.NODE_ENV === "production"
    ? "/api"
    : `${process.env.NEXT_PUBLIC_API_URL}/api`;

export const api = axios.create({
    baseURL,   
    timeout: 10000
});