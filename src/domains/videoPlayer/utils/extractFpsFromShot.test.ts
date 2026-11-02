import { Shot } from "@schemas/shot";
import { describe, it, expect } from "vitest";

import { extractFpsFromShot } from "./extractFpsFromShot";

describe("extractFpsFromShot", () => {
  it("should return fps value from valid shot", () => {
    const shot = {
      id: "shot1",
      name: "Test Shot",
      project_id: "project1",
      settings: "",
      user_id: "user1",
      layers: [
        {
          id: "layer1",
          clips: [
            {
              id: "clip1",
              asset: {
                id: "asset1",
                data: {
                  fps: 30,
                  duration: 100,
                  processed: true
                }
              }
            }
          ]
        }
      ]
    } as unknown as Shot;

    expect(extractFpsFromShot(shot)).toBe(30);
  });

  it("should return null for null shot", () => {
    expect(extractFpsFromShot(null)).toBe(null);
  });

  it("should return null for shot without layers", () => {
    const shot: Shot = {
      id: "shot1",
      name: "Test Shot",
      project_id: "project1",
      settings: {},
      user_id: "user1",
      layers: []
    };

    expect(extractFpsFromShot(shot)).toBe(null);
  });

  it("should return null for shot with invalid fps", () => {
    const shot = {
      id: "shot1",
      name: "Test Shot",
      project_id: "project1",
      settings: "",
      user_id: "user1",
      layers: [
        {
          id: "layer1",
          clips: [
            {
              id: "clip1",
              asset: {
                id: "asset1",
                data: {
                  fps: 0,
                  duration: 100,
                  processed: true
                }
              }
            }
          ]
        }
      ]
    } as unknown as Shot;

    expect(extractFpsFromShot(shot)).toBe(null);
  });

  it("should return null for shot with negative fps", () => {
    const shot = {
      id: "shot1",
      name: "Test Shot",
      project_id: "project1",
      settings: "",
      user_id: "user1",
      layers: [
        {
          id: "layer1",
          clips: [
            {
              id: "clip1",
              asset: {
                id: "asset1",
                data: {
                  fps: -30,
                  duration: 100,
                  processed: true
                }
              }
            }
          ]
        }
      ]
    } as unknown as Shot;

    expect(extractFpsFromShot(shot)).toBe(null);
  });
});
