/** What a Google geocoding result tells us about a place: its address, pincode and the most likely city name. */
export interface GeocodeResult { formatted_address?: string; address_components: { long_name: string; types: string[] }[] }
export interface PickedPlace { address: string; pincode: string; cityName: string }

export function readPlace(results: GeocodeResult[]): PickedPlace {
  const find = (type: string) => {
    for (const r of results) {
      const c = r.address_components.find((a) => a.types.includes(type));
      if (c) return c.long_name;
    }
    return "";
  };
  return {
    address: results[0]?.formatted_address ?? "",
    pincode: find("postal_code").replace(/\s/g, ""),
    cityName: find("locality") || find("administrative_area_level_2") || find("administrative_area_level_3") || find("sublocality_level_1"),
  };
}
