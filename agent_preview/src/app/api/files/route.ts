import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const dirPath = path.join(process.cwd(), "example-project");
  const files = fs.readdirSync(dirPath).map((name) => ({
    name,
    path: `example-project/${name}`,
    type: "file",
  }));
  return NextResponse.json(files);
}
