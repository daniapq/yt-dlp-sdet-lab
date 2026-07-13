# yt-dlp-sdet-lab
A TypeScript testing project for validating yt-dlp CLI behavior, media outputs, recovery policies, and HLS failure scenarios.
## Purpose

This repository is an educational SDET project for testing the public
command-line behavior of `yt-dlp`.

It focuses on:

- CLI arguments, configuration, and exit codes
- stdout and stderr validation
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

The HLS failure tests use locally generated synthetic media and controlled
test fixtures. Public media should not be committed to this repository.

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
`ffprobe`. They must be installed separately by the user.

Each dependency is distributed under its own license. Refer to the official
projects for their current licensing and redistribution requirements:

- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [FFmpeg](https://ffmpeg.org/legal.html)

## Disclaimer

This project is independent and is not affiliated with, endorsed by, or
sponsored by `yt-dlp`, FFmpeg, YouTube, Twitch, or any supported media
platform.

The software is provided for educational and testing purposes, without
warranty. The authors are not responsible for misuse of the project or for
content downloaded or processed by its users.
