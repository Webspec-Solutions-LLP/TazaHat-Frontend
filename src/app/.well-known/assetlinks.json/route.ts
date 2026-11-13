/** Android App Links: tells Android that this site's product links belong to the Machranga app (so they open in the app when it is installed). */
export const dynamic = "force-static";

export function GET() {
  return Response.json([
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: "in.machranga.app",
        // the release key of the app, and the debug key (builds installed from a computer)
        sha256_cert_fingerprints: [
          "B1:66:B3:C3:BC:19:F8:4E:80:DE:65:9B:FF:B0:09:F6:71:7B:7B:0A:14:8C:F4:D2:D3:D2:94:CB:D8:7D:79:9C",
          "F8:41:FE:5F:C4:8D:9A:6E:6C:3A:A3:19:4C:60:61:88:95:3C:2D:40:A2:C6:00:13:77:48:8B:01:DC:EE:F1:F1",
        ],
      },
    },
  ]);
}
