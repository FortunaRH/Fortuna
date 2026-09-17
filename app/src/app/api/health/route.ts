import { NextResponse } from "next/server";
import { robinhood } from "@/lib/chains";
import { COINFLIP_ADDRESS, ENTROPY_ADDRESS, PROVIDER_ADDRESS } from "@/lib/contracts";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    chainId: robinhood.id,
    entropy: ENTROPY_ADDRESS,
    coinFlip: COINFLIP_ADDRESS,
    provider: PROVIDER_ADDRESS,
  });
}
