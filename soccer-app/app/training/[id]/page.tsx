"use client";
import { useParams } from "next/navigation";
import { TrainingSessionEditor } from "../../../components/training-session-editor";
export default function TrainingDetailPage() { const {id}=useParams<{id:string}>(); return <TrainingSessionEditor sessionId={id}/>; }
