import 'server-only'

import { cookies } from "next/headers";


export async function getAccessToken() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken')?.value;
    return accessToken;
  }
  
  export async function getRefreshToken() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;
    return refreshToken;
  }
  