import api from "@/lib/axios";

export const getMe = async () => {
  const response = await api.get("api/v1/user/me");
  return response.data;
};



