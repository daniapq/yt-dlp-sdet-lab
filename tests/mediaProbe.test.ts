import { describe, expect, test } from "vitest";
import { parseMediaProbe } from "../src/mediaProbe.js";

describe("parseMediaProbe", () => {
  test("parses valid ffprobe JSON", () => {
    const result = parseMediaProbe(`
      {
        "streams": [
          {
            "index": 0,
            "codec_name": "h264",
            "codec_type": "video",
            "width": 1920,
            "height": 1080
          },
          {
            "index": 1,
            "codec_name": "aac",
            "codec_type": "audio"
          }
        ],
        "format": {
          "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
          "duration": "167.183673",
          "size": "55757622"
        }
      }
    `);

    expect(result.streams).toHaveLength(2);
    expect(result.streams[0]).toMatchObject({
      codec_name: "h264",
      codec_type: "video",
      width: 1920,
      height: 1080
    });
    expect(result.streams[1]).toMatchObject({
      codec_name: "aac",
      codec_type: "audio"
    });
    expect(result.format.format_name).toContain("mp4");
    expect(Number(result.format.duration)).toBeGreaterThan(0);
    expect(Number(result.format.size)).toBeGreaterThan(0);
  });

  test("rejects JSON without a streams array", () => {
    expect(() =>
      parseMediaProbe(`
        {
          "format": {}
        }
      `)
    ).toThrow("streams array");
  });

  test("rejects JSON without a format object", () => {
    expect(() =>
      parseMediaProbe(`
        {
          "streams": []
        }
      `)
    ).toThrow("format object");
  });

  test("rejects invalid JSON", () => {
    expect(() =>
      parseMediaProbe("not valid JSON")
    ).toThrow();
  });
});