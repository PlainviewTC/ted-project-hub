"use client";
import { useEffect, useMemo, useState } from "react";
import "./globals.css";

const blank = { name:"", category:"", status:"Active", label:"", description:"", siteUrl:"", tinyUrl:"" };

function normUrl(u){ if(!u) return ""; return /^https?:\/\//i.test(u)?u:`https://${u}`; }

export default function Page(){
  const [projects,setProjects]=useState([]);
  const [query,setQuery]=useState("");
  const [category,setCategory]=useState("");
  const [editing,setEditing]=useState(null);
  const [form,setForm]=useState(blank);
  const [sync,setSync]=useState("Loading cloud data…");
  const [error,setError]=useState("");

  useEffect(()=>{ load(); },[]);

  async function load(){
    try{
      const r=await fetch("/api/projects",{cache:"no-store"});
      const data=await r.json();
      setProjects(data.projects||[]);
      setSync(data.warning ? data.warning : "Cloud data loaded.");
    }catch{
      setError("Could not load cloud data.");
      setSync("");
    }
  }

  async function save(next){
    setProjects(next);
    setSync("Saving…");
    setError("");
    try{
      const r=await fetch("/api/projects",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({projects:next})});
      if(!r.ok) throw new Error();
      const data=await r.json();
      setSync(`Saved to cloud · ${new Date(data.savedAt).toLocaleString()}`);
    }catch{
      setError("Save failed. Your on-screen edits have not been confirmed in cloud storage.");
      setSync("");
    }
  }

  const cats=useMemo(()=>[...new Set(projects.map(p=>p.category).filter(Boolean))].sort(),[projects]);
  const filtered=projects.filter(p=>{
    const hay=[p.name,p.category,p.label,p.description,p.status].join(" ").toLowerCase();
    return (!query||hay.includes(query.toLowerCase()))&&(!category||p.category===category);
  });
  const active=projects.filter(p=>p.status==="Active").length;
  const planned=projects.filter(p=>p.status==="Planned").length;

  function openEditor(p=null){
    setEditing(p?.id||null);
    setForm(p ? {...p} : {...blank});
  }
  function closeEditor(){ setEditing(null); setForm(blank); }
  function submit(e){
    e.preventDefault();
    const item={...form,id:editing||`project-${Date.now()}`};
    const next=editing?projects.map(p=>p.id===editing?item:p):[item,...projects];
    closeEditor(); save(next);
  }
  function remove(id){
    const p=projects.find(x=>x.id===id);
    if(!p||!confirm(`Remove "${p.name}" from the hub?`)) return;
    save(projects.filter(x=>x.id!==id));
  }

  return <main className="shell">
    <div className="top">
      <div>
        <div className="eyebrow">Private project directory</div>
        <h1>Project Hub</h1>
        <p className="sub">A cloud-saved directory for websites, simulators, concept sites, and public-facing projects. Add TinyURLs beside the underlying site and open the same list from any authenticated device.</p>
      </div>
      <div className="privacy">🔒 Vercel protected</div>
    </div>

    <div className="toolbar">
      <input className="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search projects…" />
      <select className="select" value={category} onChange={e=>setCategory(e.target.value)}>
        <option value="">All categories</option>
        {cats.map(c=><option key={c}>{c}</option>)}
      </select>
      <button className="btn primary" onClick={()=>openEditor()}>+ Add project</button>
    </div>

    <div className="stats">
      <span className="stat">{projects.length} projects</span>
      <span className="stat">{active} active</span>
      <span className="stat">{planned} planned</span>
      <span className="stat">{projects.filter(p=>p.tinyUrl).length} TinyURLs saved</span>
    </div>

    <div className="grid">
      {filtered.map(p=>{
        const site=normUrl(p.siteUrl),tiny=normUrl(p.tinyUrl);
        return <article className="card" key={p.id}>
          <div className="row"><div className="tag">{p.category}</div><div className={`status ${p.status==="Planned"?"planned":""}`}>{p.status}</div></div>
          <h2>{p.name}</h2>
          <div className="small">{p.label||"Project"}</div>
          <p className="desc">{p.description}</p>
          <div className="links">
            <a className={`linkbtn ${site?"":"disabled"}`} href={site||undefined} target="_blank" rel="noreferrer"><span>Launch site</span><span>{site?"↗":"—"}</span></a>
            <a className={`linkbtn ${tiny?"":"disabled"}`} href={tiny||undefined} target="_blank" rel="noreferrer"><span>{tiny?"Open TinyURL":"TinyURL not added"}</span><span>{tiny?"↗":"—"}</span></a>
          </div>
          <div className="actions">
            <button className="mini" onClick={()=>openEditor(p)}>Edit</button>
            <button className="mini danger" onClick={()=>remove(p.id)}>Remove</button>
          </div>
        </article>
      })}
      {!filtered.length && <div className="empty">No projects match that search.</div>}
    </div>

    <div className={`sync ${error?"error":""}`}>{error||sync}</div>

    {(editing!==null || form.name!=="" || form.description!=="") && (
      <div className="modalBack" onMouseDown={e=>{if(e.target===e.currentTarget) closeEditor();}}>
        <form className="modal" onSubmit={submit}>
          <h3>{editing?"Edit project":"Add project"}</h3>
          <p>The site and TinyURL are both optional, so planned projects can live here before they launch.</p>
          <div className="form">
            <div className="field"><label>Project name</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div>
            <div className="field"><label>Category</label><input required value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/></div>
            <div className="field"><label>Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Active</option><option>Planned</option><option>Draft</option><option>Archived</option></select></div>
            <div className="field"><label>Short label</label><input value={form.label} onChange={e=>setForm({...form,label:e.target.value})}/></div>
            <div className="field full"><label>Description</label><textarea required value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
            <div className="field full"><label>Underlying site URL</label><input type="url" value={form.siteUrl} onChange={e=>setForm({...form,siteUrl:e.target.value})} placeholder="https://…"/></div>
            <div className="field full"><label>TinyURL</label><input type="url" value={form.tinyUrl} onChange={e=>setForm({...form,tinyUrl:e.target.value})} placeholder="https://tinyurl.com/…"/></div>
          </div>
          <div className="notice">Saving writes the entire project list to private cloud storage, so the same data is available from every authenticated computer.</div>
          <div className="modal-actions"><button type="button" className="btn" onClick={closeEditor}>Cancel</button><button className="btn primary">Save project</button></div>
        </form>
      </div>
    )}
  </main>;
}
