import { describe, expect, it } from "vitest";

import { parseLinuxVolumes, parseWindowsVolumes } from "./listStorageDrives";
describe("storage drive enumeration", () => {
  it("handles one Windows drive and unnamed volumes", () => {
    expect(parseWindowsVolumes('{"DeviceID":"C:","VolumeName":""}')).toEqual([
      { rootPath: "C:\\", name: "Drive (C:)" }
    ]);
  });
  it("keeps multiple drives and ignores malformed entries", () => {
    expect(
      parseWindowsVolumes(
        JSON.stringify([
          { DeviceID: "C:", VolumeName: "System" },
          { DeviceID: "D:", VolumeName: "Models" },
          { DeviceID: "bad" }
        ])
      )
    ).toEqual([
      { rootPath: "C:\\", name: "System (C:)" },
      { rootPath: "D:\\", name: "Models (D:)" }
    ]);
    expect(parseWindowsVolumes("null")).toEqual([]);
  });
  it("filters virtual, read-only and duplicate Linux mounts and decodes spaces", () => {
    const mounts = [
      "1 0 8:1 / / rw - ext4 /dev/sda1 rw",
      "2 1 0:1 / /proc rw - proc proc rw",
      "3 1 8:1 /home /home rw - ext4 /dev/sda1 rw",
      "4 1 8:2 / /boot rw - ext4 /dev/sda2 rw",
      "5 1 8:3 / /media/My\\040Drive rw - ext4 /dev/sdb1 rw",
      "6 1 8:4 / /media/Readonly ro - ext4 /dev/sdc1 ro"
    ].join("\n");
    expect(parseLinuxVolumes(mounts)).toEqual([
      { rootPath: "/", name: "System drive (/)" },
      { rootPath: "/media/My Drive", name: "/media/My Drive" }
    ]);
  });
});
