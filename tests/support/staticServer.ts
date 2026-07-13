import { readFile } from "node:fs/promises";
import {
  createServer,
  type Server
} from "node:http";
import { join } from "node:path";

export interface StaticServer {
  baseUrl: string;
  requestCounts: Map<string, number>;
  close: () => Promise<void>;
}

export async function startStaticServer(
  rootDirectory: string
): Promise<StaticServer> {
  const requestCounts = new Map<string, number>();

  const server = createServer(async (request, response) => {
    const requestUrl = new URL(
      request.url ?? "/",
      "http://127.0.0.1"
    );

    const relativePath = decodeURIComponent(
      requestUrl.pathname
    ).replace(/^\/+/, "");

    requestCounts.set(
      relativePath,
      (requestCounts.get(relativePath) ?? 0) + 1
    );

    if (
      !relativePath ||
      relativePath.includes("..")
    ) {
      response.writeHead(400);
      response.end("Invalid path");
      return;
    }

    try {
      const contents = await readFile(
        join(rootDirectory, relativePath)
      );

      response.writeHead(200, {
        "Content-Type": getContentType(relativePath)
      });

      response.end(contents);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });

  await listen(server);

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error(
      "Unable to determine local server address."
    );
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    requestCounts,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close(error => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      })
  };
}

function listen(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);

    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
}

function getContentType(fileName: string): string {
  if (fileName.endsWith(".m3u8")) {
    return "application/vnd.apple.mpegurl";
  }

  if (fileName.endsWith(".ts")) {
    return "video/mp2t";
  }

  return "application/octet-stream";
}