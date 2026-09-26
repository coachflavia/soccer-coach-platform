"use client";
import { useParams } from "next/navigation";
import { LibraryDrillEditor } from "../../../../components/library-drill-editor";
export default function LibraryDrillPage() { const { id } = useParams<{id:string}>(); return <LibraryDrillEditor drillId={id}/>; }
