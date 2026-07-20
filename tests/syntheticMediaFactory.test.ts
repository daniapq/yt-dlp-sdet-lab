import { describe, expect, test } from "vitest";
import {
    buildSyntheticMediaArgs,
    generateSyntheticMedia
} from "./support/syntheticMediaFactory.js";

describe("synthetic media factory", () => {
    test("rejects configurations without video or audio", async () => {
        await expect(
            generateSyntheticMedia({
                outputPath: "unused.mp4"
            })
        ).rejects.toThrow(
            "Synthetic media requires a video or audio stream."
        );
    });

    test("rejects shortest with only one stream", async () => {
        await expect(
            generateSyntheticMedia({
                outputPath: "unused.mp4",
                shortest: true,
                video: {
                    source: "color",
                    color: "blue",
                    width: 320,
                    height: 240,
                    frameRate: 25,
                    duration: 1,
                    codec: "mpeg4"
                }
            })
        ).rejects.toThrow(
            "Shortest requires both video and audio streams."
        );
    });

    test("builds arguments for a video-only fixture", () => {
        const args = buildSyntheticMediaArgs({
            outputPath: "video-only.mp4",
            video: {
                source: "testsrc2",
                width: 640,
                height: 360,
                frameRate: 30,
                duration: 2,
                codec: "mpeg4"
            }
        });

        expect(args).toEqual([
            "-y",
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=640x360:rate=30:duration=2",
            "-c:v",
            "mpeg4",
            "-an",
            "video-only.mp4"
        ]);
    });

    test("builds arguments for an audio-only fixture", () => {
        const args = buildSyntheticMediaArgs({
            outputPath: "audio-only.m4a",
            audio: {
                frequency: 440,
                sampleRate: 48000,
                duration: 2,
                codec: "aac"
            }
        });

        expect(args).toEqual([
            "-y",
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=440:sample_rate=48000:duration=2",
            "-c:a",
            "aac",
            "-vn",
            "audio-only.m4a"
        ]);
    });

    test("builds arguments for an audiovisual fixture with shortest", () => {
        const args = buildSyntheticMediaArgs({
            outputPath: "audiovisual.mp4",
            shortest: true,
            video: {
                source: "color",
                color: "blue",
                width: 320,
                height: 240,
                frameRate: 25,
                duration: 3,
                codec: "mpeg4"
            },
            audio: {
                frequency: 1000,
                sampleRate: 48000,
                duration: 1,
                codec: "aac"
            }
        });

        expect(args).toEqual([
            "-y",
            "-f",
            "lavfi",
            "-i",
            "color=c=blue:s=320x240:r=25:d=3",
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=1000:sample_rate=48000:duration=1",
            "-c:v",
            "mpeg4",
            "-c:a",
            "aac",
            "-shortest",
            "audiovisual.mp4",
        ]);
    });

    test("rejects a color source without a color", () => {
        expect(() =>
            buildSyntheticMediaArgs({
                outputPath: "invalid.mp4",
                video: {
                    source: "color",
                    width: 320,
                    height: 240,
                    frameRate: 25,
                    duration: 1,
                    codec: "mpeg4"
                }
            })
        ).toThrow(
            "Color source requires a color."
        );
    });
});