import { readFile } from "node:fs/promises";
import {
  createServer,
  type Server
} from "node:http";

export interface RangeServer {
  url: string;
  rangeRequests: string[];
  close: () => Promise<void>;
}

export async function startRangeServer(
  filePath: string
): Promise<RangeServer> {
  const contents = await readFile(filePath);
  const rangeRequests: string[] = [];

  const server = createServer((request, response) => {
    if (request.url !== "/source.mp4") {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    const range = request.headers.range;

    if (range) {
      rangeRequests.push(range);
    }

    const commonHeaders = {
      "Accept-Ranges": "bytes",
      "Content-Type": "video/mp4"
    };

    if (request.method === "HEAD") {
      response.writeHead(200, {
        ...commonHeaders,
        "Content-Length": contents.length
      });
      response.end();
      return;
    }

    const match = range?.match(/^bytes=(\d+)-(\d*)$/);

    if (!match) {
      response.writeHead(200, {
        ...commonHeaders,
        "Content-Length": contents.length
      });
      response.end(contents);
      return;
    }

    const start = Number(match[1]);
    const requestedEnd = match[2]
      ? Number(match[2])
      : contents.length - 1;

    const end = Math.min(
      requestedEnd,
      contents.length - 1
    );

    if (
      !Number.isInteger(start) ||
      start < 0 ||
      start >= contents.length ||
      end < start
    ) {
      response.writeHead(416, {
        ...commonHeaders,
        "Content-Range": `bytes */${contents.length}`
      });
      response.end();
      return;
    }

    const partialContents = contents.subarray(
      start,
      end + 1
    );

    response.writeHead(206, {
      ...commonHeaders,
      "Content-Length": partialContents.length,
      "Content-Range":
        `bytes ${start}-${end}/${contents.length}`
    });

    response.end(partialContents);
  });

  await listen(server);

  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error(
      "Unable to determine range server address."
    );
  }

  return {
    url: `http://127.0.0.1:${address.port}/source.mp4`,
    rangeRequests,
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