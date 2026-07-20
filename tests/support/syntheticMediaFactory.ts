import {
    runFfmpeg
} from "../../src/ffmpegRunner.js";

export interface SyntheticVideoOptions {
    source: "color" | "testsrc2";
    color?: string;
    width: number;
    height: number;
    frameRate: number;
    duration: number;
    codec: string;
}

export interface SyntheticAudioOptions {
    frequency: number;
    sampleRate: number;
    duration: number;
    codec: string;
}

export interface SyntheticMediaOptions {
    outputPath: string;
    video?: SyntheticVideoOptions;
    audio?: SyntheticAudioOptions;
    shortest?: boolean;
}

export async function generateSyntheticMedia(
    options: SyntheticMediaOptions
) {
    return runFfmpeg(
        buildSyntheticMediaArgs(options)
    );
}

export function buildSyntheticMediaArgs(
    options: SyntheticMediaOptions
): string[] {
    if (!options.video && !options.audio) {
        throw new Error(
            "Synthetic media requires a video or audio stream."
        );
    }

    if (
        options.shortest &&
        (!options.video || !options.audio)
    ) {
        throw new Error(
            "Shortest requires both video and audio streams."
        );
    }

    if (
        options.video?.source === "color" &&
        !options.video.color
    ) {
        throw new Error(
            "Color source requires a color."
        );
    }

    const args: string[] = ["-y"];

    if (options.video) {
        const video = options.video;

        const source =
            video.source === "color"
                ? `color=c=${video.color}:s=${video.width}x${video.height}:r=${video.frameRate}:d=${video.duration}`
                : `testsrc2=size=${video.width}x${video.height}:rate=${video.frameRate}:duration=${video.duration}`;

        args.push(
            "-f",
            "lavfi",
            "-i",
            source
        );
    }

    if (options.audio) {
        const audio = options.audio;

        args.push(
            "-f",
            "lavfi",
            "-i",
            `sine=frequency=${audio.frequency}:sample_rate=${audio.sampleRate}:duration=${audio.duration}`
        );
    }

    if (options.video) {
        args.push("-c:v", options.video.codec);
    }

    if (options.audio) {
        args.push("-c:a", options.audio.codec);
    }

    if (!options.video) {
        args.push("-vn");
    }

    if (!options.audio) {
        args.push("-an");
    }

    if (options.shortest) {
        args.push("-shortest");
    }

    args.push(options.outputPath);

    return args;
}