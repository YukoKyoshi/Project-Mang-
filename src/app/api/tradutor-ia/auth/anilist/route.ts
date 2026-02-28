import { NextResponse } from 'next/server';

export async function GET() {
  const clientID = process.env.ANILIST_CLIENT_ID;
  
  // O link oficial para onde o usuário vai
  const authUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientID}&response_type=code`;
  
  return NextResponse.redirect(authUrl);
}