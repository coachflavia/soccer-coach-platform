import { LibraryDrillEditor } from "../../../../components/library-drill-editor";
import { libraryAreas, type LibraryArea } from "../../../../lib/drill-library-data";

export default async function NewLibraryDrillPage({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  const requested = (await searchParams).area;
  const area: LibraryArea = libraryAreas.includes(requested as LibraryArea) ? requested as LibraryArea : "personal";
  return <LibraryDrillEditor initialArea={area}/>;
}
