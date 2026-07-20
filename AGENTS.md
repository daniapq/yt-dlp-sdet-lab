# AGENTS.md

## Project purpose

This repository is an educational SDET project for testing selected
behaviors of the yt-dlp command-line interface using TypeScript and Vitest.

The system under test is the external yt-dlp CLI.

The framework executes yt-dlp as a child process, captures its observable
outputs, and validates generated media with ffprobe.

This repository does not implement a graphical user interface or a download
manager.

## Learning goals

The project should demonstrate how to test a CLI through:

- command-line arguments
- configuration files
- stdout and stderr
- process exit codes
- filesystem side effects
- generated media
- interruption and recovery
- strict and tolerant error policies
- controlled HLS failure scenarios

## Testing methodology

Follow this sequence when adding a feature or test:

1. Understand the yt-dlp behavior manually.
2. Identify inputs, outputs, states, and failure modes.
3. Define the expected policy and observable result.
4. Automate the behavior with a focused test.
5. Verify the resulting artifact when one is created.
6. Document important findings and limitations.

Do not assume that exit code 0 alone proves that an output is correct.

## Architecture

Keep responsibilities separated:

- `src/cliRunner.ts`
  - execute an external CLI from an executable path and argument array
  - capture stdout, stderr, exit code, and failure state
  - avoid shell command construction

- `src/ytDlpRunner.ts`
  - resolve yt-dlp from `YT_DLP_PATH`
  - delegate process execution to the shared CLI runner

- `src/ffprobeRunner.ts`
  - execute ffprobe
  - parse media metadata
  - return structured stream and format information

- `src/ffmpegRunner.ts`
  - execute FFmpeg through the shared CLI runner
  - preserve stdout, stderr, and exit code

- `src/mediaProbe.ts`
  - define structured media metadata
  - validate and parse FFprobe JSON output

- `src/policies/`
  - classify execution results
  - represent strict and tolerant policies
  - distinguish success, partial success, failure, and cancellation

- `tests/`
  - define behavior and assertions
  - avoid duplicating process-execution logic

- `tests/support/syntheticMediaFactory.ts`
  - build deterministic FFmpeg argument arrays
  - support audiovisual, video-only, and audio-only fixtures
  - reject incoherent fixture configurations before execution

- `configs/`
  - contain explicit yt-dlp profiles used by tests

- `fixtures/`
  - contain controlled synthetic test inputs

- `output/`
  - contain generated and ignored test artifacts

Do not introduce UI, Electron, Tauri, React, or browser automation into this
repository.

## Planned test coverage

- format selection
- video and audio configuration profiles
- stdout and stderr capture
- successful and unsuccessful exit codes
- invalid and unsupported URLs
- partial success in multi-URL execution
- interrupted-download recovery
- `.part` file behavior
- generated filename validation
- metadata JSON validation
- media stream validation with ffprobe
- strict versus tolerant error policies
- local HLS playback with a missing fragment
- fragment retry and failure behavior

## Test design rules

- Prefer deterministic and controlled inputs.
- Use `--simulate` when a real download is unnecessary.
- Use `--ignore-config` to prevent personal configuration leakage.
- Pass arguments as an array instead of constructing shell strings.
- Test observable behavior rather than yt-dlp internal implementation.
- Validate only the yt-dlp behaviors used by this project.
- Keep network-dependent tests separated from deterministic tests.
- Mark integration tests clearly.
- Use unique temporary output directories per test when files are created.
- Clean generated artifacts after tests unless retained for diagnostics.

## Safety and repository rules

Never commit:

- downloaded public media
- copyrighted test content
- cookies or browser sessions
- credentials, tokens, or signed URLs
- private metadata
- yt-dlp, FFmpeg, or ffprobe binaries
- generated output or `.part` files
- unsanitized execution logs

Use synthetic, owned, authorized, or public-domain media fixtures.

Do not implement or test DRM circumvention or unauthorized access.

## Development conventions

- Use TypeScript strict mode.
- Use Vitest as the test runner.
- Use execa for child-process execution.
- Prefer small modules with explicit responsibilities.
- Avoid shell execution unless a test explicitly targets shell behavior.
- Return structured results from runners.
- Preserve stdout and stderr separately.
- Represent exit codes explicitly.
- Avoid assertions based on unstable full log messages when a stable signal exists.
- Add comments only when they explain a non-obvious decision.

## Verification

Before committing, run:

```powershell
npm run typecheck
npm test
git status
```