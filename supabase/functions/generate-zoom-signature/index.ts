import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode as base64UrlEncode } from "https://deno.land/std@0.168.0/encoding/base64url.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { meetingNumber, role } = await req.json();

    if (!meetingNumber) {
      throw new Error("Не указан номер конференции (meetingNumber)");
    }

    const sdkKey = Deno.env.get("ZOOM_SDK_KEY");
    const sdkSecret = Deno.env.get("ZOOM_SDK_SECRET");

    if (!sdkKey || !sdkSecret) {
      throw new Error("Ключи Zoom SDK не настроены в Supabase Secrets.");
    }

    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2; // Токен живет 2 часа

    const oPayload = {
      sdkKey: sdkKey,
      mn: meetingNumber,
      role: role !== undefined ? role : 0,
      iat: iat,
      exp: exp,
      appKey: sdkKey,
      tokenExp: exp
    };

    const header = { alg: "HS256", typ: "JWT" };
    const stringifiedHeader = JSON.stringify(header);
    const stringifiedPayload = JSON.stringify(oPayload);

    const encodedHeader = base64UrlEncode(new TextEncoder().encode(stringifiedHeader));
    const encodedPayload = base64UrlEncode(new TextEncoder().encode(stringifiedPayload));

    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    
    const keyData = new TextEncoder().encode(sdkSecret);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      new TextEncoder().encode(signatureInput)
    );

    const encodedSignature = base64UrlEncode(new Uint8Array(signatureBuffer));
    const jwtToken = `${signatureInput}.${encodedSignature}`;

    return new Response(
      JSON.stringify({ signature: jwtToken, sdkKey }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});