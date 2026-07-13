import {
    access,
    mkdtemp,
    readdir,
    rm,
    unlink
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
    afterAll,
    beforeAll,
    describe,
    expect,
    test
} from "vitest";
import { runFfmpeg } from "../src/ffmpegRunner.js";
import { probeMedia } from "../src/ffprobeRunner.js";
import { runYtDlp } from "../src/ytDlpRunner.js";
import {
    startStaticServer,
    type StaticServer
} from "./support/staticServer.js";

let temporaryDirectory: string;
let server: StaticServer;
let missingSegment: string;

describe("HLS missing-fragment policies", () => {
    beforeAll(async () => {
        temporaryDirectory = await mkdtemp(
            join(tmpdir(), "yt-dlp-hls-failure-")
        );

        const manifestPath = join(
            temporaryDirectory,
            "manifest.m3u8"
        );

        const segmentTemplate = join(
            temporaryDirectory,
            "segment%03d.ts"
        );

        const generation = await runFfmpeg([
            "-y",
            "-f",
            "lavfi",
            "-i",
            "color=c=blue:s=320x240:r=25:d=4",
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=1000:duration=4",
            "-c:v",
            "mpeg2video",
            "-g",
            "25",
            "-c:a",
            "aac",
            "-shortest",
            "-f",
            "hls",
            "-hls_time",
            "1",
            "-hls_playlist_type",
            "vod",
            "-hls_segment_filename",
            segmentTemplate,
            manifestPath
        ]);

        if (generation.exitCode !== 0) {
            throw new Error(
                `Unable to generate HLS fixture: ${generation.stderr}`
            );
        }

        const segments = (
            await readdir(temporaryDirectory)
        )
            .filter(file => file.endsWith(".ts"))
            .sort();

        missingSegment = segments[1];

        if (!missingSegment) {
            throw new Error(
                "The HLS fixture did not generate enough segments."
            );
        }

        await unlink(
            join(temporaryDirectory, missingSegment)
        );

        server = await startStaticServer(
            temporaryDirectory
        );
    });

    afterAll(async () => {
        await server?.close();

        await rm(temporaryDirectory, {
            recursive: true,
            force: true
        });
    });

    test(
        "aborts after retrying an unavailable fragment",
        async () => {
            const outputFile = join(
                temporaryDirectory,
                "strict-output.ts"
            );

            const result = await runYtDlp([
                "--ignore-config",
                "--fragment-retries",
                "2",
                "--retry-sleep",
                "fragment:0",
                "--abort-on-unavailable-fragments",
                "--output",
                outputFile,
                `${server.baseUrl}/manifest.m3u8`
            ]);

            const missingSegmentRequests =
                server.requestCounts.get(missingSegment) ?? 0;

            expect(result.exitCode).not.toBe(0);
            expect(result.failed).toBe(true);
            expect(missingSegmentRequests).toBeGreaterThanOrEqual(3);
        },
        60_000
    );

    test(
        "skips an unavailable fragment and produces a partial artifact",
        async () => {
            const outputFile = join(
                temporaryDirectory,
                "tolerant-output.ts"
            );

            const requestsBefore =
                server.requestCounts.get(missingSegment) ?? 0;

            const result = await runYtDlp([
                "--ignore-config",
                "--fragment-retries",
                "2",
                "--retry-sleep",
                "fragment:0",
                "--skip-unavailable-fragments",
                "--output",
                outputFile,
                `${server.baseUrl}/manifest.m3u8`
            ]);

            const requestsAfter =
                server.requestCounts.get(missingSegment) ?? 0;

            const requestsDuringTest =
                requestsAfter - requestsBefore;

            expect(result.exitCode).toBe(0);
            expect(result.failed).toBe(false);
            expect(requestsDuringTest).toBeGreaterThanOrEqual(3);

            await expect(
                access(outputFile)
            ).resolves.toBeUndefined();

            const probe = await probeMedia(outputFile);

            expect(probe.execution.exitCode).toBe(0);
            expect(probe.media).toBeDefined();
            expect(probe.media?.streams.length).toBeGreaterThan(0);
            expect(
                Number(probe.media?.format.size)
            ).toBeGreaterThan(0);
        },
        60_000
    );
});