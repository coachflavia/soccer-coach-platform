"use client";

import { useId, type PointerEvent as ReactPointerEvent } from "react";
import type { DiagramLine, DiagramObject, SoccerDiagram } from "../lib/diagram-data";

type Props = {
  diagram: SoccerDiagram; selectedId?: string | null; interactive?: boolean;
  onPointerDown?: (event: ReactPointerEvent<SVGElement>, id?: string) => void;
  onPointerMove?: (event: ReactPointerEvent<SVGElement>) => void;
  onPointerUp?: (event: ReactPointerEvent<SVGElement>) => void;
};

export function DiagramCanvas({ diagram, selectedId, interactive, onPointerDown, onPointerMove, onPointerUp }: Props) {
  const rawId = useId(); const markerId = `arrow-${rawId.replace(/:/g, "")}`;
  const horizontal = diagram.orientation === "horizontal";
  return <svg viewBox={horizontal ? "0 0 1000 650" : "0 0 650 1000"} role="img" aria-label="Soccer drill diagram"
    className={`block h-auto w-full rounded-xl bg-emerald-800 ${interactive ? "touch-none select-none" : ""}`}
    onPointerDown={e=>onPointerDown?.(e)} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
    <defs><marker id={markerId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/></marker><pattern id={`${markerId}-grid`} width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" stroke="#fff" strokeOpacity=".14" strokeWidth="2"/></pattern></defs>
    <Field template={diagram.field} horizontal={horizontal} gridId={`${markerId}-grid`}/>
    {diagram.lines.map(line=><Line key={line.id} line={line} width={horizontal?1000:650} height={horizontal?650:1000} markerId={markerId} selected={selectedId===line.id} onDown={e=>{e.stopPropagation();onPointerDown?.(e,line.id)}}/>)}
    {diagram.objects.map(object=><ObjectMark key={object.id} object={object} width={horizontal?1000:650} height={horizontal?650:1000} selected={selectedId===object.id} onDown={e=>{e.stopPropagation();onPointerDown?.(e,object.id)}}/>)}
  </svg>;
}

function Field({template,horizontal,gridId}:{template:SoccerDiagram["field"];horizontal:boolean;gridId:string}) {
  const w=horizontal?1000:650,h=horizontal?650:1000, line="#d1fae5";
  if(template==="grid") return <><rect width={w} height={h} fill="#14532d"/><rect x="10" y="10" width={w-20} height={h-20} rx="8" fill={`url(#${gridId})`} stroke={line} strokeWidth="5"/></>;
  return <g fill="none" stroke={line} strokeWidth="5" opacity=".9"><rect x="10" y="10" width={w-20} height={h-20} rx="8"/>
    {template==="full" && (horizontal ? <><path d={`M500 10V${h-10}`}/><circle cx="500" cy={h/2} r="90"/><circle cx="500" cy={h/2} r="5" fill={line}/><path d={`M10 175H150V475H10M990 175H850V475H990M10 245H65V405H10M990 245H935V405H990`}/><circle cx="110" cy="325" r="5" fill={line}/><circle cx="890" cy="325" r="5" fill={line}/></> : <><path d="M10 500H640"/><circle cx="325" cy="500" r="90"/><circle cx="325" cy="500" r="5" fill={line}/><path d="M175 10V150H475V10M175 990V850H475V990M245 10V65H405V10M245 990V935H405V990"/><circle cx="325" cy="110" r="5" fill={line}/><circle cx="325" cy="890" r="5" fill={line}/></>)}
    {template==="half" && (horizontal ? <><path d={`M${w-10} 100H650V550H${w-10}M${w-10} 205H850V445H${w-10}`}/><path d="M650 225a130 130 0 0 0 0 200"/><circle cx="780" cy="325" r="5" fill={line}/></> : <><path d={`M100 10V350H550V10M205 10V150H445V10`}/><path d="M225 350a130 130 0 0 0 200 0"/><circle cx="325" cy="220" r="5" fill={line}/></>)}
    {template==="final-third" && (horizontal ? <><path d="M990 90H570V560H990M990 210H835V440H990"/><path d="M570 210a145 145 0 0 0 0 230"/><circle cx="735" cy="325" r="5" fill={line}/></> : <><path d="M90 10V430H560V10M210 10V165H440V10"/><path d="M210 430a145 145 0 0 0 230 0"/><circle cx="325" cy="265" r="5" fill={line}/></>)}
  </g>;
}

function Line({line,width,height,markerId,selected,onDown}:{line:DiagramLine;width:number;height:number;markerId:string;selected:boolean;onDown:(e:ReactPointerEvent<SVGElement>)=>void}) {
  const x1=line.x1*width,y1=line.y1*height,x2=line.x2*width,y2=line.y2*height;
  const arrow=line.kind==="movement"||line.kind==="passing"; const dash=line.kind==="dashed"||line.kind==="passing";
  const common={stroke:line.color,strokeWidth:Math.max(4,line.width*650),strokeDasharray:dash?"16 12":undefined,markerEnd:arrow?`url(#${markerId})`:undefined,fill:"none",strokeLinecap:"round" as const};
  const d=line.kind==="dribbling"?`M${x1} ${y1} Q${(x1+x2)/2-35} ${(y1+y2)/2-35} ${(x1+x2)/2} ${(y1+y2)/2} T${x2} ${y2}`:undefined;
  return <g onPointerDown={onDown} transform="scale(1 1)"><path d={d||`M${x1} ${y1}L${x2} ${y2}`} {...common}/><path d={d||`M${x1} ${y1}L${x2} ${y2}`} stroke="transparent" strokeWidth="28" fill="none"/>{selected&&<path d={d||`M${x1} ${y1}L${x2} ${y2}`} stroke="#34d399" strokeWidth="12" strokeDasharray="4 10" fill="none" opacity=".8"/>}</g>;
}

function ObjectMark({object,width,height,selected,onDown}:{object:DiagramObject;width:number;height:number;selected:boolean;onDown:(e:ReactPointerEvent<SVGElement>)=>void}) {
  const x=object.x*width,y=object.y*height,s=Math.max(22,object.size*Math.min(width,height)); const stroke=selected?"#34d399":"#0f172a";
  let mark;
  if(object.kind==="player") mark=object.playerShape==="x"?<g stroke={object.color} strokeWidth={s*.28} strokeLinecap="round"><path d={`M${-s/2} ${-s/2}L${s/2} ${s/2}M${s/2} ${-s/2}L${-s/2} ${s/2}`}/></g>:object.playerShape==="triangle"?<path d={`M0 ${-s*.65}L${s*.65} ${s*.55}H${-s*.65}Z`} fill={object.color} stroke={stroke} strokeWidth="5"/>:<circle r={s*.58} fill={object.color} stroke={stroke} strokeWidth="5"/>;
  else if(object.kind==="ball") mark=<g><circle r={s*.55} fill="#fff" stroke="#0f172a" strokeWidth="4"/><path d={`M0 ${-s*.2}l${s*.2} ${s*.14}-.08 ${s*.24}h${-s*.24}l-.08-${s*.24}z`} fill="#0f172a"/></g>;
  else if(object.kind==="cone") mark=<path d={`M0 ${-s*.65}L${s*.6} ${s*.55}H${-s*.6}Z`} fill={object.color} stroke={stroke} strokeWidth="4"/>;
  else if(object.kind==="pole") mark=<g><path d={`M0 ${-s}V${s*.7}`} stroke={object.color} strokeWidth="10"/><path d={`M${-s*.35} ${s*.7}H${s*.35}`} stroke={stroke} strokeWidth="7"/></g>;
  else if(object.kind==="flag") mark=<g><path d={`M${-s*.25} ${s*.7}V${-s*.75}`} stroke={object.color} strokeWidth="8"/><path d={`M${-s*.2} ${-s*.7}H${s*.65}L${-s*.2} ${-s*.15}Z`} fill={object.color}/></g>;
  else if(object.kind==="goal"||object.kind==="mini-goal") {const gw=object.kind==="goal"?s*1.8:s*1.3;mark=<g fill="none" stroke={object.color} strokeWidth="6"><path d={`M${-gw/2} ${s*.45}V${-s*.45}H${gw/2}V${s*.45}`}/><path d={`M${-gw/2} ${-s*.45}l${s*.3} ${-s*.25}H${gw/2+s*.3}L${gw/2} ${-s*.45}`}/></g>}
  else mark=<text textAnchor="middle" dominantBaseline="central" fill={object.color} fontSize={s} fontWeight="700">{object.label||"Label"}</text>;
  return <g transform={`translate(${x} ${y}) rotate(${object.rotation})`} onPointerDown={onDown} className="cursor-grab">{selected&&<circle r={Math.max(s*.9,34)} fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="8 6"/>}{mark}{object.kind==="player"&&object.label&&<text textAnchor="middle" dominantBaseline="central" fill={object.color==="#ffffff"?"#0f172a":"#fff"} fontSize={s*.55} fontWeight="800">{object.label.slice(0,3)}</text>}</g>;
}
