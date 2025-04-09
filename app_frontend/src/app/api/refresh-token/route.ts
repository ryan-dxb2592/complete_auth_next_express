import { refreshTokenAction } from "@/actions/auth-actions";
import { NextResponse } from "next/server";

export async function POST() {
  const response = await refreshTokenAction();
  console.log("Response from refresh token route:", response);
  return NextResponse.json(response);
}

