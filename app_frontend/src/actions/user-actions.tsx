import { get } from "./fetch-wrapper";
import { API_ENDPOINT } from "../constants";

// Define the User type
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get the current user's information
 * @returns The current user's data or null if not authenticated
 */
export const getMe = async (): Promise<User | null> => {
  try {
    // Use the fetch wrapper to get the user data
    // The middleware will handle token refresh if needed
    const { data, error } = await get<User>(`${API_ENDPOINT}/api/v1/user/me`);
    
    if (error) {
      console.error("Error fetching user:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("Unexpected error fetching user:", error);
    return null;
  }
};



