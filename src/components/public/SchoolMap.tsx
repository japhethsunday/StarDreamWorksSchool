import { MapPin, Navigation } from "lucide-react";
import { displayAddress } from "@/lib/school-contact";

/**
 * Approximate area map for the school (Ajah, Lagos) using an OpenStreetMap
 * embed — no API key required. The pin marks the general area, not a
 * survey-verified point; visitors should confirm by phone before setting out.
 */
const LAT = 6.4698;
const LON = 3.5852;
const BBOX = `${LON - 0.03},${LAT - 0.02},${LON + 0.03},${LAT + 0.02}`;

const DIRECTIONS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  "No. 2 Sanni Aro Baale Street Moba Off Mobil Road Ilaje Ajah Lagos Nigeria"
)}`;

export default function SchoolMap({ address }: { address?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-line bg-white">
      <iframe
        title="Approximate map of STAR DreamWorks Schools area, Ajah Lagos"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${BBOX}&layer=mapnik&marker=${LAT},${LON}`}
        className="h-72 w-full border-0 sm:h-80"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="flex flex-col gap-3 border-t border-brand-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-brand-body">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-red" />
          <span>
            {address || displayAddress(null)}
            <span className="block text-xs text-brand-muted">
              Approximate area — please call ahead for exact directions.
            </span>
          </span>
        </p>
        <a
          href={DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="sd-btn sd-btn-navy inline-flex shrink-0 px-5 py-2.5 text-sm"
        >
          <Navigation className="h-4 w-4" />
          Get Directions
        </a>
      </div>
    </div>
  );
}
