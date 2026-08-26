import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "../../../actions";

// Data-export half of the Privacy Policy's promised "Right to Access and
// Portability" - maintainer-mediated (see docs/legal content), not
// self-serve. Explicit auth checks here regardless of proxy.ts, since
// this route lives outside /api and proxy.ts's own matcher excludes /api
// from its blanket auth check anyway - never rely on that alone.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      progress: true,
      weightRecords: { orderBy: { recordedAt: "asc" } },
      wagers: { orderBy: { createdAt: "asc" } },
      wagersChallenged: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
    },
    progress: user.progress,
    weightRecords: user.weightRecords,
    wagersCreated: user.wagers,
    wagersChallenged: user.wagersChallenged,
  };

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="droppdd-export-${user.username ?? user.id}.json"`,
    },
  });
}
