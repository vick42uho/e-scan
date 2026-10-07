export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      status: "healthy",
      service: "yanhee-dms-frontend",
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}
