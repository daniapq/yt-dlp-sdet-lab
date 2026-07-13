# yt-dlp-sdet-lab

[![Test](https://github.com/daniapq/yt-dlp-sdet-lab/actions/workflows/test.yml/badge.svg)](https://github.com/daniapq/yt-dlp-sdet-lab/actions/workflows/test.yml)

A TypeScript testing project for validating yt-dlp CLI behavior, synthetic media generation, media outputs, recovery policies, and HLS failure scenarios.
## Purpose

This repository is an educational SDET project for testing the public
command-line behavior of `yt-dlp`.

It focuses on:

- CLI arguments, configuration, and exit codes
- stdout and stderr validation
- synthetic media generation with `ffmpeg`
- media output verification with `ffprobe`
- interrupted-download recovery
- strict and tolerant failure policies
- controlled HLS failure scenarios
- automated testing with TypeScript and Vitest

This project is not intended to test every internal feature of `yt-dlp`.
It validates only the behaviors and integration contracts used by this
test suite.

## Responsible use

Use this project only with media that you own, have permission to access,
or are otherwise legally authorized to download and process.

Users are responsible for complying with:

- applicable copyright laws
- the terms of service of the relevant platforms
- access controls and content licenses
- the licenses of `yt-dlp`, FFmpeg, and other dependencies

This project does not provide, promote, or test mechanisms intended to:

- bypass DRM or access controls
- access private content without authorization
- distribute copyrighted media
- publish authentication cookies, tokens, or credentials

Synthetic media and HLS failure fixtures are generated locally with FFmpeg and
validated with ffprobe. Public media should not be committed to this repository.

## Privacy and test data

Do not commit:

- browser cookies or session files
- authentication tokens or credentials
- private or signed media URLs
- downloaded videos or audio
- personal or confidential metadata
- execution logs containing sensitive information

Generated media, logs, metadata, and partial downloads are excluded through
`.gitignore`.

## Dependencies

This repository does not bundle or redistribute `yt-dlp`, FFmpeg, or
`ffprobe`. They must be installed separately by the user. FFmpeg is used to
generate controlled synthetic media fixtures, and ffprobe is used to inspect
the generated media artifacts.

Each dependency is distributed under its own license. Refer to the official
projects for their current licensing and redistribution requirements:

- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [FFmpeg](https://ffmpeg.org/legal.html)

## Environment variables

The test runners read executable paths from environment variables. Integration
tests also use environment variables for local test inputs. Do not commit real
tokens, cookies, signed URLs, private media paths, or machine-specific secrets.

| Variable | Required | Used by | Description |
| --- | --- | --- | --- |
| `YT_DLP_PATH` | Yes for yt-dlp tests | `src/ytDlpRunner.ts` | Path or command name for the `yt-dlp` executable. |
| `FFMPEG_PATH` | Yes for synthetic media generation tests | `src/ffmpegRunner.ts` | Path or command name for the `ffmpeg` executable. |
| `FFPROBE_PATH` | Yes for media probe tests | `src/ffprobeRunner.ts` | Path or command name for the `ffprobe` executable. |
| `YT_DLP_TEST_URL` | Optional | profile and partial-success integration tests | Authorized test URL used by yt-dlp integration tests. Tests that require it are skipped when unset. |
| `MEDIA_TEST_FILE` | Optional | media probe integration tests | Local media file path used to validate ffprobe parsing. Tests that require it are skipped when unset. |

Example PowerShell setup:

```powershell
$env:YT_DLP_PATH = "yt-dlp"
$env:FFMPEG_PATH = "ffmpeg"
$env:FFPROBE_PATH = "ffprobe"
$env:YT_DLP_TEST_URL = "https://example.test/authorized-test-video"
$env:MEDIA_TEST_FILE = "D:\path\to\authorized-test-media.mp4"

npm.cmd test
```

Use `YT_DLP_TEST_URL` only with media you own, have permission to access, or are
otherwise legally authorized to test. Use `MEDIA_TEST_FILE` for synthetic,
owned, authorized, or public-domain media.

## Disclaimer

This project is independent and is not affiliated with, endorsed by, or
sponsored by `yt-dlp`, FFmpeg, YouTube, Twitch, or any supported media
platform.

The software is provided for educational and testing purposes, without
warranty. The authors are not responsible for misuse of the project or for
content downloaded or processed by its users.
