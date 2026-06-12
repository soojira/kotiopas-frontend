import { useState, useEffect, useRef } from "react";

// Responsiivisuus-hook: tunnistaa onko nakytto leveä (tietokone) vai kapea (puhelin)
function useIsDesktop(breakpoint=900){
  const [isDesktop,setIsDesktop]=useState(
    typeof window!=="undefined" ? window.innerWidth>=breakpoint : false
  );
  useEffect(()=>{
    const check=()=>setIsDesktop(window.innerWidth>=breakpoint);
    check();
    window.addEventListener("resize",check);
    return()=>window.removeEventListener("resize",check);
  },[breakpoint]);
  return isDesktop;
}

const C = {
  paper:"#FBF8F3", cream:"#F4EFE6", warm:"#EDE5D8", linen:"#E2D9C8",
  clay:"#C4956A", clayDim:"#F5EDE0", terra:"#B5693C",
  forest:"#3E5C3F", forestDim:"#EBF0EB",
  ink:"#2A2520", stone:"#7A7068", border:"#DDD4C4",
  gold:"#C9A84C", goldDim:"#FBF3E2",
  blue:"#3B5F8A", blueDim:"#EBF0F8",
};
const H="'Cormorant Garamond','Georgia',serif";
const B="'Jost','Helvetica Neue',sans-serif";

// ─────────────────────────────────────────────────────────────────────────────
// KIELI / LANGUAGE
// Yksinkertainen kaksikielinen järjestelmä (fi/en). Kieli pidetään App-tason
// statessa ja jaetaan komponenteille useLang-hookilla. Oletus: suomi.
// ─────────────────────────────────────────────────────────────────────────────
// Globaali kielitila + tilaajat (jotta myös komponentit ilman propseja päivittyvät).
// Kieli muistetaan localStoragessa (avain ar_lang), jaettu legal-sivujen kanssa,
// jotta esim. tietoja.html avautuu samalla kielellä kuin sovellus.
let _lang = "fi";
try { const tallennettu = localStorage.getItem("ar_lang"); if (tallennettu === "en" || tallennettu === "fi") _lang = tallennettu; } catch (e) {}
const _langKuuntelijat = new Set();
function setGlobalLang(l){
  _lang = l;
  try { localStorage.setItem("ar_lang", l); } catch (e) {}
  _langKuuntelijat.forEach(fn=>fn(l));
}
// Hook: palauttaa nykyisen kielen ja päivittyy kun kieli vaihtuu.
function useLang(){
  const [l,setL]=useState(_lang);
  useEffect(()=>{
    const fn=(uusi)=>setL(uusi);
    _langKuuntelijat.add(fn);
    return ()=>_langKuuntelijat.delete(fn);
  },[]);
  return l;
}
// Käännösapuri: t(lang, "fi-teksti", "en-teksti")
function t(lang,fi,en){ return lang==="en" ? en : fi; }

// Kielivalitsin-nappi (FI / EN)
function LangToggle({dark=false}){
  const lang=useLang();
  const aktiivi=dark?C.gold:C.ink;
  const passiivi=dark?"rgba(251,243,226,0.4)":C.stone;
  return(
    <div style={{display:"inline-flex",alignItems:"center",gap:6,fontFamily:B,fontSize:12,fontWeight:500,letterSpacing:0.5}}>
      <button onClick={()=>setGlobalLang("fi")} style={{background:"none",border:"none",cursor:"pointer",color:lang==="fi"?aktiivi:passiivi,fontWeight:lang==="fi"?600:400,padding:"2px 4px",fontFamily:B,fontSize:12}}>FI</button>
      <span style={{color:passiivi,opacity:0.5}}>|</span>
      <button onClick={()=>setGlobalLang("en")} style={{background:"none",border:"none",cursor:"pointer",color:lang==="en"?aktiivi:passiivi,fontWeight:lang==="en"?600:400,padding:"2px 4px",fontFamily:B,fontSize:12}}>EN</button>
    </div>
  );
}


const GLOBAL=`
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html{background:#FBF8F3;}
  body{width:100%;margin:0;padding:0;overflow-x:hidden;-webkit-overflow-scrolling:touch;background:#FBF8F3;}
  #root{width:100%;margin:0;padding:0;overflow-x:hidden;background:#FBF8F3;}
  input::placeholder{color:transparent;}
  select option{background:#F4EFE6;}
  input[type=number]::-webkit-inner-spin-button{opacity:0;}
  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:#F4EFE6;}
  ::-webkit-scrollbar-thumb{background:#E2D9C8;border-radius:2px;}
`;

function fmt(n){return Math.round(n||0).toLocaleString("fi-FI");}

function GoldLine(){return <div style={{height:1,background:`linear-gradient(90deg,transparent,${C.gold},transparent)`,margin:"4px 0"}}/>;}

function DarkCard({children,style={}}){
  return(
    <div style={{background:"linear-gradient(160deg,#2A1F14,#1E3020)",borderRadius:14,overflow:"hidden",position:"relative",...style}}>
      <div style={{position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",border:"1px solid rgba(201,168,76,0.1)",pointerEvents:"none"}}/>
      {children}
    </div>
  );
}

// Ohuet viivaikonit (korvaavat emojit). Sama tyyli kuin muut sivuston SVG-ikonit:
// stroke, ei täyttöä, strokeWidth 1.5. Väri ja koko peritään propseista.
function Ikoni({nimi,size=16,color="currentColor",style={}}){
  const p={width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:color,strokeWidth:1.5,strokeLinecap:"round",strokeLinejoin:"round",style:{flexShrink:0,...style}};
  switch(nimi){
    case "building":
      return <svg {...p}><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/><path d="M4 21h16"/></svg>;
    case "compass":
      return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/></svg>;
    case "book":
      return <svg {...p}><path d="M12 6v13"/><path d="M12 6 7 4 3 5v12l4-1 5 2"/><path d="m12 6 5-2 4 1v12l-4-1-5 2"/></svg>;
    case "bulb":
      return <svg {...p}><circle cx="12" cy="10" r="4.5"/><path d="M9.5 15h5M10.5 17.5h3"/><path d="M12 2v2M4 10H6M18 10h2M6 4l1.5 1.5M18 4l-1.5 1.5"/></svg>;
    case "home":
      return <svg {...p}><path d="M5 21V10.5"/><path d="M19 10.5V21"/><path d="M3 11.2 12 4l9 7.2"/><path d="M5 21h14"/></svg>;
    case "sparkles":
      return <svg {...p}><path d="M11 3 12.5 9.5 19 11 12.5 12.5 11 19 9.5 12.5 3 11 9.5 9.5 11 3Z"/><path d="M18 16 18.7 18.3 21 19 18.7 19.7 18 22 17.3 19.7 15 19 17.3 18.3 18 16Z"/></svg>;
    case "coins":
      return <svg {...p}><ellipse cx="9" cy="13.5" rx="5" ry="2"/><path d="M4 13.5v4c0 1.1 2.2 2 5 2s5-.9 5-2v-4"/><circle cx="16" cy="9" r="4.5"/><path d="M14.5 7.5h3M14.5 10.5h3"/></svg>;
    case "euro":
      return <svg {...p}><path d="M5 3h8l4 4v14H5z"/><path d="M13 3v4h4"/><text x="11" y="17.5" textAnchor="middle" fontSize="9" fontWeight="600" fill={color} stroke="none" fontFamily="Arial, sans-serif">€</text></svg>;
    case "handshake":
      return <svg {...p}><circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>;
    case "camera":
      return <svg {...p}><path d="M5 8h2l1.5-2h7L17 8h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3"/></svg>;
    case "clipboard":
      return <svg {...p}><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v3h3"/><path d="M9 11h6M9 14h6M9 17h4"/></svg>;
    case "target":
      return <svg {...p}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>;
    case "doc":
      return <svg {...p}><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M10 12h5"/><circle cx="12.5" cy="16.5" r="2.3"/></svg>;
    case "bank":
      return <svg {...p}><path d="M3 9 12 4l9 5"/><path d="M5 9v9M19 9v9M9 9v9M15 9v9"/><path d="M3 21h18"/></svg>;
    case "pen":
      return <svg {...p}><path d="M14 4l6 6L8 22l-5 1 1-5z"/><path d="M13 5l6 6"/></svg>;
    case "key":
      return <svg {...p}><circle cx="8" cy="8" r="4"/><path d="m11 11 8 8"/><path d="m16 16 2-2M19 19l1.5-1.5"/></svg>;
    default:
      return <svg {...p}><circle cx="12" cy="12" r="9"/></svg>;
  }
}

function Pill({children,active,onClick}){
  return(
    <button onClick={onClick} style={{
      background:active?"linear-gradient(135deg,#2A1F14,#1E3020)":"transparent",
      color:active?C.gold:C.stone,
      border:`1px solid ${active?"rgba(201,168,76,0.4)":C.border}`,
      borderRadius:20,padding:"8px 18px",
      fontFamily:B,fontSize:12,letterSpacing:1,fontWeight:500,
      cursor:"pointer",transition:"all 0.2s",whiteSpace:"nowrap",
    }}>{children}</button>
  );
}

function FloatInput({label,type="text",value,onChange}){
  const [f,setF]=useState(false);
  const up=f||value;
  return(
    <div style={{position:"relative"}}>
      <label style={{position:"absolute",left:14,top:up?8:"50%",transform:up?"none":"translateY(-50%)",fontSize:up?10:14,letterSpacing:up?1.5:0,textTransform:up?"uppercase":"none",color:f?C.clay:C.stone,fontFamily:B,transition:"all 0.2s",pointerEvents:"none",zIndex:1}}>{label}</label>
      <input type={type} value={value} onChange={onChange}
        style={{width:"100%",padding:up?"22px 14px 8px":"16px 14px",background:f?C.paper:C.cream,border:`1.5px solid ${f?C.clay:C.border}`,borderRadius:10,fontFamily:B,fontSize:15,color:C.ink,outline:"none",transition:"all 0.2s",boxSizing:"border-box"}}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}/>
    </div>
  );
}

function FloatSelect({label,value,onChange,children}){
  const [f,setF]=useState(false);
  return(
    <div style={{position:"relative"}}>
      <label style={{position:"absolute",left:14,top:8,fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:f?C.clay:C.stone,fontFamily:B,transition:"color 0.2s",pointerEvents:"none",zIndex:1}}>{label}</label>
      <select value={value} onChange={onChange}
        style={{width:"100%",padding:"22px 14px 8px",background:f?C.paper:C.cream,border:`1.5px solid ${f?C.clay:C.border}`,borderRadius:10,fontFamily:B,fontSize:14,color:C.ink,outline:"none",cursor:"pointer",transition:"all 0.2s",boxSizing:"border-box"}}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}>{children}</select>
    </div>
  );
}

function SectionHead({num,title}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14,marginTop:8}}>
      <span style={{fontFamily:H,fontSize:13,color:C.clay,fontStyle:"italic"}}>{num}</span>
      <div style={{height:1,flex:1,background:`linear-gradient(90deg,${C.linen},transparent)`}}/>
      <span style={{fontFamily:B,fontSize:10,letterSpacing:2,textTransform:"uppercase",color:C.stone}}>{title}</span>
    </div>
  );
}

function CheckItem({text,done,onClick}){
  return(
    <div onClick={onClick} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"14px 0",borderBottom:`1px solid ${C.linen}`,cursor:"pointer"}}>
      <div style={{width:20,height:20,borderRadius:6,border:`1.5px solid ${done?C.forest:C.border}`,background:done?C.forest:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all 0.2s"}}>
        {done&&<span style={{color:"white",fontSize:11}}>✓</span>}
      </div>
      <span style={{fontFamily:B,fontSize:13,color:done?C.stone:C.ink,textDecoration:done?"line-through":"none",lineHeight:1.6,fontWeight:300}}>{text}</span>
    </div>
  );
}

function DarkBtn({children,onClick,style={}}){
  return(
    <button onClick={onClick}
      style={{background:"linear-gradient(135deg,#2A1F14,#1E3020)",color:C.gold,border:"none",padding:"17px 0",fontFamily:H,fontSize:18,fontStyle:"italic",cursor:"pointer",borderRadius:12,boxShadow:"0 8px 32px rgba(42,31,20,0.2)",width:"100%",transition:"transform 0.15s,box-shadow 0.15s",...style}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 12px 40px rgba(42,31,20,0.3)"}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 8px 32px rgba(42,31,20,0.2)"}}>
      {children}
    </button>
  );
}

function Modal({onClose,children}){
  return(
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(42,31,20,0.7)",backdropFilter:"blur(6px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.paper,borderRadius:16,maxWidth:400,width:"100%",padding:"32px 28px",position:"relative",boxShadow:"0 24px 80px rgba(42,31,20,0.4)"}}>
        <button onClick={onClose} style={{position:"absolute",top:14,right:18,background:"none",border:"none",fontSize:22,cursor:"pointer",color:C.stone,lineHeight:1}}>×</button>
        {children}
      </div>
    </div>
  );
}

// Hakee Tilastokeskuksen viralliset hinnat. Palauttaa null jos ei onnistu.
async function haeTilastokeskusHinta(postinumero,huoneet,rakennustyyppi){
  if(!postinumero||!/^\d{5}$/.test(postinumero))return null;
  try{
    const res=await fetch("https://kotiopas-backend.onrender.com/api/hinta-tilasto",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({postinumero,huoneet,rakennustyyppi}),
    });
    if(!res.ok)return null;
    const data=await res.json();
    if(!data.ok||!data.loytyi||!data.vuodet?.length)return null;
    return data;
  }catch(e){return null;}
}

// Yhdistää Tilastokeskus-datan paikallisen laskurin kanssa.
// Palauttaa saman muotoisen olion kuin laskeArvio, lisättynä `lahde`.
async function laskeArvioSmart(form){
  // Yritä Tilastokeskus ensin
  const tilasto=await haeTilastokeskusHinta(form.postinumero,form.huoneet,form.tyyppi);
  // Aloita paikallisesta arviosta — käytetään fallbackina ja täydennyksenä
  const paikallinen=laskeArvio(form);
  if(!tilasto){
    return {...paikallinen,lahde:"paikallinen"};
  }
  // Korvataan paikallisen laskurin hinta tilaston tuoreimmalla
  const koko=parseFloat(form.koko)||50;
  const kunto=form.kunto||"";
  const tuorein=tilasto.vuodet[tilasto.vuodet.length-1];
  const m2Tilasto=tuorein.keskiHinta;
  // Kuntokerroin paikalliselta — hyvä kunto = 1.0
  const cf=kunto.includes("Erinomainen")?1.10:kunto.includes("Hyvä")?1.0:kunto.includes("Tyydyttävä")?0.92:0.82;
  const m2=Math.round(m2Tilasto*cf);
  const tod=Math.round(m2*koko/1000)*1000;
  const vai=Math.round(tod*0.06/1000)*1000;
  // Hintakehitys oikeasta datasta
  const hintakehitys=tilasto.vuodet.map(v=>({vuosi:v.vuosi,hinta:v.keskiHinta}));
  return{
    ...paikallinen,
    todennakoisin:tod,
    arvio_min:tod-vai,
    arvio_max:tod+vai,
    hinta_per_m2:m2,
    alueen_keskim_m2:m2Tilasto,
    hintakehitys,
    lahde:"tilastokeskus",
    tilastoTiedot:{
      postinumeroNimi:tilasto.postinumeroNimi,
      kauppoja:tuorein.kauppojaYhteensa,
      vuosi:tuorein.vuosi,
      talotyypit:tilasto.talotyypit,
    },
  };
}

function laskeArvio(form){
  const alue=(form.alue||"").toLowerCase();
  const koko=parseFloat(form.koko)||50;
  const vuosi=parseInt(form.rakVuosi)||1980;
  const kunto=form.kunto||"";
  let b=3000;
  if(alue.includes("eira")||alue.includes("ullanlinna"))b=7500;
  else if(alue.includes("punavuori")||alue.includes("kruununhaka"))b=6800;
  else if(alue.includes("kallio")||alue.includes("alppiharju"))b=5200;
  else if(alue.includes("töölö")||alue.includes("lauttasaari"))b=6000;
  else if(alue.includes("hermanni")||alue.includes("vallila"))b=4800;
  else if(alue.includes("vuosaari")||alue.includes("kontula"))b=3000;
  else if(alue.includes("espoo")||alue.includes("tapiola"))b=4200;
  else if(alue.includes("tampere"))b=3200;
  else if(alue.includes("turku"))b=2800;
  else if(alue.includes("oulu"))b=2400;
  else if(alue.includes("helsinki")||form.postinumero?.startsWith("00"))b=4500;
  else if(alue.includes("vantaa"))b=3200;
  const p=parseInt(form.postinumero||"0");
  if(p>=100&&p<=180)b=Math.max(b,6500);
  else if(p>=200&&p<=260)b=Math.max(b,5800);
  else if(p>=500&&p<=560)b=Math.max(b,4800);
  const af=vuosi>=2010?1.10:vuosi>=2000?1.05:vuosi>=1990?1.00:vuosi>=1980?0.97:vuosi>=1960?0.93:0.90;
  const cf=kunto.includes("Erinomainen")?1.12:kunto.includes("Hyvä")?1.0:kunto.includes("Tyydyttävä")?0.90:0.78;
  const sf=koko<25?1.15:koko<40?1.08:koko<55?1.02:koko>90?0.95:1.0;
  const m2=Math.round(b*af*cf*sf);
  const tod=Math.round(m2*koko/1000)*1000;
  const vai=Math.round(tod*0.06/1000)*1000;
  const vahvuudet=[],riskit=[];
  if(vuosi>=2000)vahvuudet.push("Moderni rakennus, vähemmän kulumaa");
  else riskit.push(`Rakennus ${vuosi} — putkiremontti voi olla edessä`);
  if(kunto.includes("Erinomainen")||kunto.includes("Hyvä"))vahvuudet.push("Hyvä kunto nopeuttaa myyntiä");
  else riskit.push("Kunto laskee arvoa — harkitse pintaremonttia ennen myyntiä");
  if(koko>=50)vahvuudet.push("Toimiva koko laajalle ostajakunnalle");
  else riskit.push("Pieni koko rajaa ostajakuntaa");
  if(form.lisatiedot?.toLowerCase().includes("parveke"))vahvuudet.push("Parveke — houkutteleva myyntiargumentti");
  if(form.lisatiedot?.toLowerCase().includes("hissi"))vahvuudet.push("Hissi — iso plussa ylemmissä kerroksissa");
  return{
    arvio_min:tod-vai,arvio_max:tod+vai,todennakoisin:tod,
    hinta_per_m2:m2,alueen_keskim_m2:b,
    hintakehitys:[
      {vuosi:"2021",hinta:Math.round(b*1.05)},{vuosi:"2022",hinta:Math.round(b*1.08)},
      {vuosi:"2023",hinta:Math.round(b*0.97)},{vuosi:"2024",hinta:Math.round(b*0.95)},
      {vuosi:"2025",hinta:b},
    ],
    vahvuudet:vahvuudet.slice(0,3),riskit:riskit.slice(0,3),
    vinkki:"Pyydä isännöitsijäntodistus ennen tarjousta — se kertoo tulevista remonteista ja yhtiön veloista.",
  };
}

function TabOstopolku(){
  const lang=useLang();
  const steps=[
    {t:t(lang,"Talouden kartoitus","Assess your finances"),d:t(lang,"Selvitä nettotulosi, menosi ja säästöt. Laske kuinka paljon voit lainata.","Work out your net income, expenses and savings. Calculate how much you can borrow.")},
    {t:t(lang,"Lainatarjoukset","Loan offers"),d:t(lang,"Pyydä tarjoukset vähintään 3 pankista. Vertaile marginaaleja. ASP-säästäjä saa edullisemman koron.","Request offers from at least 3 banks. Compare margins. ASP savers get a lower rate.")},
    {t:t(lang,"Asuntojen etsintä","Search for homes"),d:t(lang,"Käy läpi Etuovi ja Oikotie. Listaa kriteerit tärkeysjärjestykseen.","Browse Etuovi and Oikotie. List your criteria in order of importance.")},
    {t:t(lang,"Näytöt ja asiakirjat","Viewings and documents"),d:t(lang,"Tutki isännöitsijäntodistus, tilinpäätös ja remonttisuunnitelmat ennen tarjousta.","Study the property manager's certificate, financial statements and renovation plans before making an offer.")},
    {t:t(lang,"Tarjous ja neuvottelu","Offer and negotiation"),d:t(lang,"Tee kirjallinen tarjous. Hintaa saa usein alennettua 2–5%.","Make a written offer. The price can often be lowered by 2–5%.")},
    {t:t(lang,"Lainapäätös","Loan decision"),d:t(lang,"Vie pankkiin kauppakirjaluonnos. Päätös syntyy muutamassa päivässä.","Take a draft deed of sale to the bank. The decision comes within a few days.")},
    {t:t(lang,"Kaupan allekirjoitus","Signing the deal"),d:t(lang,"Kirjallinen kauppa välittäjällä. Muista varainsiirtovero (1,5% osake, 3% kiinteistö).","A written sale at the agent's. Remember the transfer tax (1.5% shares, 3% real property).")},
    {t:t(lang,"Avainten luovutus","Handover of keys"),d:t(lang,"Tarkista asunto, tee muuttoilmoitus DVV:lle ja hanki kotivakuutus.","Inspect the home, file a notice of move with the DVV, and get home insurance.")},
  ];
  const [cur,setCur]=useState(-1);
  const done=cur+1;
  return(
    <div>
      <div style={{fontFamily:H,fontSize:28,fontStyle:"italic",color:C.ink,marginBottom:6}}>{t(lang,"Ostopolku","Buying path")}</div>
      <div style={{fontFamily:B,fontSize:13,color:C.stone,marginBottom:20,fontWeight:300}}>{t(lang,"Tyypillinen prosessi kestää 2–4 kuukautta","The typical process takes 2–4 months")}</div>
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",justifyContent:"space-between",fontFamily:B,fontSize:11,color:C.stone,marginBottom:6}}>
          <span>{t(lang,"Edistyminen","Progress")}</span><span>{done}/{steps.length}</span>
        </div>
        <div style={{height:4,background:C.linen,borderRadius:2,overflow:"hidden"}}>
          <div style={{width:`${Math.round(done/steps.length*100)}%`,height:"100%",background:`linear-gradient(90deg,${C.forest},${C.clay})`,borderRadius:2,transition:"width 0.4s"}}/>
        </div>
      </div>
      <div style={{position:"relative",paddingLeft:32}}>
        <div style={{position:"absolute",left:8,top:8,bottom:8,width:1,background:C.linen}}/>
        {steps.map((s,i)=>{
          const isDone=i<=cur,isNext=i===cur+1;
          return(
            <div key={i} style={{position:"relative",marginBottom:22}}>
              <div style={{position:"absolute",left:-28,top:5,width:12,height:12,borderRadius:"50%",background:isDone?C.forest:isNext?C.clay:C.paper,border:`2px solid ${isDone?C.forest:isNext?C.clay:C.border}`,boxShadow:isNext?`0 0 0 4px ${C.clayDim}`:undefined,transition:"all 0.3s"}}/>
              <div style={{fontFamily:H,fontSize:16,fontStyle:"italic",color:isDone?C.stone:C.ink,marginBottom:3,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                {s.t}
                <span style={{fontFamily:B,fontSize:10,background:isDone?C.forestDim:isNext?C.clayDim:C.cream,color:isDone?C.forest:isNext?C.terra:C.stone,border:`1px solid ${isDone?C.forest+"30":isNext?C.clay+"40":C.border}`,borderRadius:20,padding:"2px 10px",letterSpacing:1}}>
                  {isDone?t(lang,"✓ Tehty","✓ Done"):isNext?t(lang,"Käynnissä","In progress"):t(lang,`Vaihe ${i+1}`,`Step ${i+1}`)}
                </span>
              </div>
              <div style={{fontFamily:B,fontSize:13,color:C.stone,lineHeight:1.65,fontWeight:300}}>{s.d}</div>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:12,marginTop:8,flexWrap:"wrap"}}>
        <DarkBtn onClick={()=>setCur(c=>Math.min(c+1,steps.length-1))} style={{width:"auto",padding:"13px 24px",fontSize:15}}>{t(lang,"Merkitse tehty →","Mark as done →")}</DarkBtn>
        {cur>=0&&(
          <button onClick={()=>setCur(c=>Math.max(c-1,-1))} style={{background:"transparent",color:C.stone,border:`1px solid ${C.border}`,padding:"13px 20px",fontFamily:B,fontSize:12,cursor:"pointer",borderRadius:10,display:"inline-flex",alignItems:"center",gap:6}}>{t(lang,"← Peru edellinen","← Undo last")}</button>
        )}
        {cur>=0&&(
          <button onClick={()=>setCur(-1)} style={{background:"transparent",color:C.stone,border:`1px solid ${C.border}`,padding:"13px 20px",fontFamily:B,fontSize:12,cursor:"pointer",borderRadius:10}}>{t(lang,"Nollaa","Reset")}</button>
        )}
      </div>
    </div>
  );
}

function TabLainalaskin(){
  const [p,setP]=useState("250000");
  const [d,setD]=useState("50000");
  const [r,setR]=useState("3.5");
  const [y,setY]=useState("25");
  const [v,setV]=useState("200");
  const loan=parseFloat(p)-parseFloat(d)||0;
  const mo=parseFloat(r)/100/12;
  const n=parseFloat(y)*12;
  const monthly=mo>0&&n>0?loan*(mo*Math.pow(1+mo,n))/(Math.pow(1+mo,n)-1):loan/n;
  const pct=parseFloat(p)>0?Math.round(parseFloat(d)/parseFloat(p)*100):0;
  return(
    <div>
      <div style={{fontFamily:H,fontSize:28,fontStyle:"italic",color:C.ink,marginBottom:6}}>Lainalaskin</div>
      <div style={{fontFamily:B,fontSize:13,color:C.stone,marginBottom:24,fontWeight:300}}>Laske kuukausierä ja kokonaiskustannukset</div>
      <div style={{display:"grid",gap:10,marginBottom:20}}>
        <FloatInput label="Asunnon hinta (€)" type="number" value={p} onChange={e=>setP(e.target.value)}/>
        <FloatInput label="Oma pääoma (€)" type="number" value={d} onChange={e=>setD(e.target.value)}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <FloatInput label="Korko / vuosi (%)" type="number" value={r} onChange={e=>setR(e.target.value)}/>
          <FloatInput label="Laina-aika (v.)" type="number" value={y} onChange={e=>setY(e.target.value)}/>
        </div>
        <FloatInput label="Yhtiövastike / kk (€)" type="number" value={v} onChange={e=>setV(e.target.value)}/>
      </div>
      <DarkCard style={{padding:"24px 20px"}}>
        <div style={{fontFamily:B,fontSize:10,color:"rgba(201,168,76,0.6)",letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>Laskelma</div>
        {[{l:"Lainan määrä",v:`${fmt(loan)} €`},{l:"Omarahoitusosuus",v:`${pct} %`}].map(row=>(
          <div key={row.l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <span style={{fontFamily:B,fontSize:13,color:"rgba(251,243,226,0.5)",fontWeight:300}}>{row.l}</span>
            <span style={{fontFamily:H,fontSize:16,color:"#FBF3E2"}}>{row.v}</span>
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"14px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <span style={{fontFamily:B,fontSize:13,color:"rgba(251,243,226,0.5)",fontWeight:300}}>Kuukausierä (laina)</span>
          <span style={{fontFamily:H,fontSize:32,color:C.gold,letterSpacing:-0.5}}>{fmt(monthly)} €</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"14px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <span style={{fontFamily:B,fontSize:13,color:"rgba(251,243,226,0.5)",fontWeight:300}}>Asumiskulut yht. / kk</span>
          <span style={{fontFamily:H,fontSize:26,color:C.gold,letterSpacing:-0.5}}>{fmt(monthly+parseFloat(v))} €</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"9px 0"}}>
          <span style={{fontFamily:B,fontSize:13,color:"rgba(251,243,226,0.5)",fontWeight:300}}>Takaisinmaksu yht.</span>
          <span style={{fontFamily:H,fontSize:16,color:"#FBF3E2"}}>{fmt(monthly*n)} €</span>
        </div>
        <div style={{fontFamily:B,fontSize:11,color:"rgba(251,243,226,0.3)",marginTop:14,lineHeight:1.6,fontWeight:300}}>Suuntaa-antava. Pyydä pankilta virallinen tarjous.</div>
      </DarkCard>
    </div>
  );
}

function TabHintaArvio({mode,isDesktop}){
  const isSeller=mode==="myyjä";
  const [form,setForm]=useState({postinumero:"",alue:"",tyyppi:"Kerrostaloasunto",koko:"",huoneet:"2h+k",rakVuosi:"",kerros:"",kunto:"Hyvä (hyväkuntoinen)",lisatiedot:""});
  const [result,setResult]=useState(null);
  const [error,setError]=useState(null);
  const [loading,setLoading]=useState(false);
  const [used,setUsed]=useState(false);
  const [registered,setRegistered]=useState(false);
  const [regModal,setRegModal]=useState(false);
  const [regForm,setRegForm]=useState({nimi:"",email:"",puhelin:""});
  const [liidiModal,setLiidiModal]=useState(false);
  const [liidi,setLiidi]=useState({nimi:"",puhelin:"",email:""});
  const [gdpr,setGdpr]=useState(false);
  const [sent,setSent]=useState(false);
  const [sending,setSending]=useState(false);
  const [liidiError,setLiidiError]=useState(null);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  async function laske(){
    if(!form.alue&&!form.postinumero){setError("Syötä alue tai postinumero.");return;}
    if(!form.koko){setError("Syötä asunnon koko.");return;}
    setError(null);
    if(used&&!registered){setRegModal(true);return;}
    setLoading(true);
    try{
      const r=await laskeArvioSmart(form);
      setResult(r);
      setUsed(true);
    }finally{
      setLoading(false);
    }
  }
  async function submitReg(){
    if(!regForm.nimi||!regForm.email)return;
    setRegistered(true);setRegModal(false);
    setLoading(true);
    try{
      const r=await laskeArvioSmart(form);
      setResult(r);
    }finally{
      setLoading(false);
    }
  }
  async function sendLiidi(){
    if(!liidi.nimi||!liidi.puhelin){
      setLiidiError("Nimi ja puhelin ovat pakollisia.");
      return;
    }
    if(!gdpr){
      setLiidiError("Hyväksy tietosuojakäytäntö ennen lähetystä.");
      return;
    }
    setLiidiError(null);
    setSending(true);
    try{
      const r=await fetch("https://kotiopas-backend.onrender.com/api/liidi",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          nimi:liidi.nimi,
          puhelin:liidi.puhelin,
          email:liidi.email||"",
          asunto:(form.alue||form.postinumero||"")+(form.koko?` ${form.koko}m²`:""),
          hinta:result?.arvio?.todennakoisin||null,
          tyyppi:isSeller?"myyja-arviopyynto":"ostaja-arviopyynto",
          lisatieto:`${form.huoneet||""} ${form.vuosi?`v.${form.vuosi}`:""}`.trim(),
          gdpr:true
        })
      });
      const data=await r.json();
      if(data.ok){
        setSent(true);
        setTimeout(()=>{
          setLiidiModal(false);
          setSent(false);
          setLiidi({nimi:"",puhelin:"",email:""});
          setGdpr(false);
        },3500);
      }else{
        setLiidiError(data.error||"Lähetys epäonnistui. Yritä uudelleen.");
      }
    }catch(err){
      console.error("Liidi-virhe:",err);
      setLiidiError("Yhteysvirhe. Tarkista verkkoyhteys ja yritä uudelleen.");
    }finally{
      setSending(false);
    }
  }
  const maxH=result?Math.max(...result.hintakehitys.map(d=>d.hinta)):1;
  return(
    <div>
      <div style={{fontFamily:H,fontSize:28,fontStyle:"italic",color:C.ink,marginBottom:6}}>
        {isSeller?"Myyntihinta-arvio":"Hinta-arvio"}
      </div>
      <div style={{fontFamily:B,fontSize:13,color:C.stone,marginBottom:24,fontWeight:300}}>
        {isSeller?"Selvitä asuntosi arvo ennen myyntiä — ilmaiseksi":"Arvioi asunnon arvo ennen ostotarjousta"}
        {" · "}{registered?"Rajattomat arviot ✓":used?"Rekisteröidy jatkaaksesi":"1 ilmainen arvio"}
      </div>
      <div style={{display:isDesktop&&result?"grid":"block",gridTemplateColumns:isDesktop&&result?"minmax(0,420px) minmax(0,1fr)":"none",gap:isDesktop&&result?32:0,alignItems:"start"}}>
      <div>
      <div style={{display:"grid",gap:10,marginBottom:20}}>
        <SectionHead num="I" title="Sijainti"/>
        <div style={{display:"grid",gridTemplateColumns:"130px 1fr",gap:10}}>
          <FloatInput label="Postinumero" value={form.postinumero} onChange={e=>set("postinumero",e.target.value)}/>
          <FloatInput label="Kaupunginosa *" value={form.alue} onChange={e=>set("alue",e.target.value)}/>
        </div>
        <SectionHead num="II" title="Asunto"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <FloatInput label="Koko (m²) *" type="number" value={form.koko} onChange={e=>set("koko",e.target.value)}/>
          <FloatSelect label="Huoneluku" value={form.huoneet} onChange={e=>set("huoneet",e.target.value)}>
            {["1h+k","2h+k","3h+k","4h+k+"].map(v=><option key={v}>{v}</option>)}
          </FloatSelect>
        </div>
        <FloatSelect label="Asuntotyyppi" value={form.tyyppi} onChange={e=>set("tyyppi",e.target.value)}>
          {["Kerrostaloasunto","Rivitaloasunto","Paritaloasunto","Omakotitalo"].map(v=><option key={v}>{v}</option>)}
        </FloatSelect>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <FloatInput label="Rakennusvuosi" type="number" value={form.rakVuosi} onChange={e=>set("rakVuosi",e.target.value)}/>
          <FloatInput label="Kerros" value={form.kerros} onChange={e=>set("kerros",e.target.value)}/>
        </div>
        <FloatSelect label="Kunto" value={form.kunto} onChange={e=>set("kunto",e.target.value)}>
          {["Erinomainen (täysin remontoitu)","Hyvä (hyväkuntoinen)","Tyydyttävä (pintaremontti tarpeen)","Välttävä (perusremontti tarpeen)"].map(v=><option key={v}>{v}</option>)}
        </FloatSelect>
        <SectionHead num="III" title="Lisätiedot"/>
        <FloatInput label="Lisätiedot (parveke, sauna, hissi…)" value={form.lisatiedot} onChange={e=>set("lisatiedot",e.target.value)}/>
      </div>
      {error&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"12px 16px",color:"#B91C1C",fontFamily:B,fontSize:13,marginBottom:16}}>⚠ {error}</div>}
      <DarkBtn onClick={laske} style={{marginBottom:result&&!isDesktop?28:0}} disabled={loading}>
        {loading?"⏳ Lasketaan...":(isSeller?"Selvitä myyntihinta →":"Laske hinta-arvio →")}
      </DarkBtn>
      </div>
      {result&&(
        <div>
          <div style={{height:2,background:`linear-gradient(90deg,transparent,${C.gold},${C.clay},transparent)`,borderRadius:2}}/>
          <DarkCard style={{padding:"24px 20px",marginBottom:16,marginTop:0}}>
            <div style={{fontFamily:B,fontSize:10,color:"rgba(201,168,76,0.6)",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>
              {isSeller?"Suositeltava myyntihinta":"Todennäköisin arvo"}
            </div>
            <div style={{fontFamily:H,fontSize:48,fontWeight:500,color:"#FBF3E2",letterSpacing:-1,lineHeight:1}}>{fmt(result.todennakoisin)} <span style={{fontSize:26,color:C.gold}}>€</span></div>
            <div style={{fontFamily:B,fontSize:13,color:"rgba(201,168,76,0.6)",marginTop:6,marginBottom:20}}>{fmt(result.arvio_min)} – {fmt(result.arvio_max)} €</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,paddingTop:16,borderTop:"1px solid rgba(255,255,255,0.07)"}}>
              {[{l:"Tämä / m²",v:`${fmt(result.hinta_per_m2)} €`,hi:true},{l:"Alue keskim.",v:`${fmt(result.alueen_keskim_m2)} €`,hi:false}].map(s=>(
                <div key={s.l}><div style={{fontFamily:B,fontSize:10,color:"rgba(251,243,226,0.3)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>{s.l}</div><div style={{fontFamily:H,fontSize:20,color:s.hi?C.gold:"#FBF3E2"}}>{s.v}</div></div>
              ))}
            </div>
          </DarkCard>
          {result.lahde==="tilastokeskus"?(
            <div style={{background:C.cream,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",gap:8,alignItems:"flex-start"}}>
              <span style={{fontSize:13,flexShrink:0,marginTop:1}}>📊</span>
              <div style={{fontFamily:B,fontSize:11,color:C.stone,lineHeight:1.55,fontWeight:300}}>
                <span style={{color:C.ink,fontWeight:500}}>Tilastokeskus</span> — Vanhojen osakeasuntojen neliöhinnat postinumeroittain {result.tilastoTiedot?.postinumeroNimi?`(${result.tilastoTiedot.postinumeroNimi})`:""}. {result.tilastoTiedot?.kauppoja?`${result.tilastoTiedot.kauppoja} kauppaa vuonna ${result.tilastoTiedot.vuosi}.`:""}
              </div>
            </div>
          ):(
            <div style={{background:C.cream,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",gap:8,alignItems:"flex-start"}}>
              <span style={{fontSize:13,flexShrink:0,marginTop:1}}>ℹ️</span>
              <div style={{fontFamily:B,fontSize:11,color:C.stone,lineHeight:1.55,fontWeight:300}}>
                <span style={{color:C.ink,fontWeight:500}}>Yleinen arvio</span> — postinumerolla ei löytynyt Tilastokeskuksen virallista dataa. Lisää 5-numeroinen postinumero saadaksesi tarkemmat hinnat.
              </div>
            </div>
          )}
          <div style={{background:C.cream,border:`1px solid ${C.border}`,borderRadius:14,padding:"20px",marginBottom:16}}>
            <div style={{fontFamily:H,fontSize:17,fontStyle:"italic",color:C.ink,marginBottom:14}}>
              Hintakehitys alueella
              {result.lahde==="tilastokeskus"&&<span style={{fontFamily:B,fontSize:10,color:C.stone,letterSpacing:1,textTransform:"uppercase",fontStyle:"normal",marginLeft:10,fontWeight:400}}>Tilastokeskus</span>}
            </div>
            {result.hintakehitys.map((d,i)=>(
              <div key={d.vuosi} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                <span style={{fontFamily:B,fontSize:12,color:C.stone,width:32,textAlign:"right"}}>{d.vuosi}</span>
                <div style={{flex:1,background:C.warm,borderRadius:20,height:6,overflow:"hidden"}}>
                  <div style={{width:`${Math.round(d.hinta/maxH*100)}%`,height:"100%",borderRadius:20,background:i===result.hintakehitys.length-1?`linear-gradient(90deg,${C.terra},${C.clay})`:C.linen,transition:"width 0.8s"}}/>
                </div>
                <span style={{fontFamily:B,fontSize:12,color:i===result.hintakehitys.length-1?C.terra:C.stone,fontWeight:i===result.hintakehitys.length-1?600:400,width:90,textAlign:"right"}}>{d.hinta.toLocaleString("fi-FI")} €/m²</span>
              </div>
            ))}
            {result.lahde==="tilastokeskus"&&(
              <div style={{fontFamily:B,fontSize:10,color:C.stone,lineHeight:1.5,marginTop:8,paddingTop:10,borderTop:`1px solid ${C.border}`,fontWeight:300,fontStyle:"italic"}}>
                Hinnat ovat vuosittaisia keskiarvoja. Ne kuvaavat hintatasoja — eivät täsmällistä hintakehitystä (Tilastokeskuksen suositus).
              </div>
            )}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <div style={{background:C.forestDim,border:`1px solid ${C.forest}20`,borderRadius:12,padding:"16px"}}>
              <div style={{fontFamily:B,fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:C.forest,marginBottom:10,fontWeight:600}}>Vahvuudet</div>
              {result.vahvuudet.map((v,i)=><div key={i} style={{fontFamily:B,fontSize:12,color:C.ink,marginBottom:7,display:"flex",gap:7,lineHeight:1.5}}><span style={{color:C.forest,flexShrink:0}}>✓</span>{v}</div>)}
            </div>
            <div style={{background:C.clayDim,border:`1px solid ${C.clay}25`,borderRadius:12,padding:"16px"}}>
              <div style={{fontFamily:B,fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:C.terra,marginBottom:10,fontWeight:600}}>{isSeller?"Huomioitavaa":"Riskit"}</div>
              {result.riskit.map((v,i)=><div key={i} style={{fontFamily:B,fontSize:12,color:C.ink,marginBottom:7,display:"flex",gap:7,lineHeight:1.5}}><span style={{color:C.clay,flexShrink:0}}>◦</span>{v}</div>)}
            </div>
          </div>
          <div style={{background:C.goldDim,border:`1px solid ${C.gold}30`,borderRadius:12,padding:"16px",marginBottom:16,display:"flex",gap:12}}>
            <span style={{fontSize:18,flexShrink:0}}>💡</span>
            <div style={{fontFamily:B,fontSize:13,color:C.ink,lineHeight:1.7,fontWeight:300}}>{result.vinkki}</div>
          </div>
          {isSeller&&(
            <DarkCard style={{padding:"24px 20px"}}>
              <div style={{fontFamily:H,fontSize:20,fontStyle:"italic",color:"#FBF3E2",marginBottom:8}}>
                Valmis myymään?
              </div>
              <p style={{fontFamily:B,fontSize:13,color:"rgba(251,243,226,0.55)",lineHeight:1.7,marginBottom:20,fontWeight:300}}>
                Välittäjä hoitaa myynnin puolestasi — ilmainen arviolausunto ja myyntisuunnitelma.
              </p>
              <button onClick={()=>setLiidiModal(true)} style={{width:"100%",background:"rgba(201,168,76,0.12)",color:C.gold,border:"1px solid rgba(201,168,76,0.35)",padding:"14px 0",fontFamily:H,fontSize:16,fontStyle:"italic",cursor:"pointer",borderRadius:10,transition:"background 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(201,168,76,0.22)"}
                onMouseLeave={e=>e.currentTarget.style.background="rgba(201,168,76,0.12)"}>
                Pyydä välittäjä myymään →
              </button>
            </DarkCard>
          )}
        </div>
      )}
      </div>
      {regModal&&(
        <Modal onClose={()=>setRegModal(false)}>
          <GoldLine/>
          <div style={{textAlign:"center",padding:"16px 0 14px"}}>
            <div style={{fontSize:40,marginBottom:12}}>🔓</div>
            <div style={{fontFamily:H,fontSize:24,fontStyle:"italic",color:C.ink,marginBottom:8}}>Rekisteröidy ilmaiseksi</div>
            <p style={{fontFamily:B,fontSize:13,color:C.stone,lineHeight:1.7,fontWeight:300}}>Saat <strong style={{color:C.terra}}>rajattomat arviot</strong> käyttöösi.</p>
          </div>
          <div style={{display:"grid",gap:10,marginBottom:14}}>
            <FloatInput label="Nimi *" value={regForm.nimi} onChange={e=>setRegForm(f=>({...f,nimi:e.target.value}))}/>
            <FloatInput label="Sähköposti *" type="email" value={regForm.email} onChange={e=>setRegForm(f=>({...f,email:e.target.value}))}/>
            <FloatInput label="Puhelin" type="tel" value={regForm.puhelin} onChange={e=>setRegForm(f=>({...f,puhelin:e.target.value}))}/>
          </div>
          <DarkBtn onClick={submitReg} style={{fontSize:16}}>Rekisteröidy ja näe arvio →</DarkBtn>
        </Modal>
      )}
      {liidiModal&&(
        <Modal onClose={()=>setLiidiModal(false)}>
          <GoldLine/>
          {sent?(
            <div style={{textAlign:"center",padding:"24px 0"}}>
              <div style={{fontSize:52,marginBottom:16}}>🏡</div>
              <div style={{fontFamily:H,fontSize:24,fontStyle:"italic",color:C.ink,marginBottom:8}}>Pyyntö lähetetty!</div>
              <p style={{fontFamily:B,fontSize:14,color:C.stone,lineHeight:1.7}}>Välittäjä ottaa yhteyttä <strong>24h sisällä</strong>.</p>
            </div>
          ):(
            <>
              <div style={{fontFamily:H,fontSize:22,fontStyle:"italic",color:C.ink,marginBottom:6,marginTop:12}}>{isSeller?"Pyydä välittäjä myymään":"Pyydä arviolausunto"}</div>
              <p style={{fontFamily:B,fontSize:13,color:C.stone,marginBottom:20,lineHeight:1.7,fontWeight:300}}>Välittäjä ottaa yhteyttä 24h sisällä. Ei sitoumuksia.</p>
              <div style={{display:"grid",gap:10,marginBottom:14}}>
                <FloatInput label="Nimi *" value={liidi.nimi} onChange={e=>setLiidi(x=>({...x,nimi:e.target.value}))}/>
                <FloatInput label="Puhelin *" type="tel" value={liidi.puhelin} onChange={e=>setLiidi(x=>({...x,puhelin:e.target.value}))}/>
                <FloatInput label="Sähköposti" type="email" value={liidi.email} onChange={e=>setLiidi(x=>({...x,email:e.target.value}))}/>
              </div>
              <label style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:14,cursor:"pointer",padding:"8px 0"}}>
                <input type="checkbox" checked={gdpr} onChange={e=>setGdpr(e.target.checked)} style={{marginTop:3,cursor:"pointer",accentColor:C.gold}}/>
                <span style={{fontFamily:B,fontSize:11,color:C.stone,lineHeight:1.6,fontWeight:300}}>Hyväksyn, että yhteystietoni välitetään välityspalveluun. Tietojani käsitellään <a href="/tietosuojaseloste.html" target="_blank" rel="noopener" style={{color:C.gold,textDecoration:"underline"}}>tietosuojaselosteen</a> mukaisesti, eikä niitä jaeta kolmansille osapuolille markkinointitarkoituksiin.</span>
              </label>
              {liidiError&&(<div style={{fontFamily:B,fontSize:12,color:"#c44",background:"rgba(196,68,68,0.1)",padding:"8px 12px",borderRadius:6,marginBottom:12,fontWeight:300}}>{liidiError}</div>)}
              <DarkBtn onClick={sendLiidi} disabled={sending} style={{fontSize:16,opacity:sending?0.6:1,cursor:sending?"wait":"pointer"}}>{sending?"⏳ Lähetetään...":"Lähetä pyyntö →"}</DarkBtn>
              <p style={{fontFamily:B,fontSize:11,color:C.stone,marginTop:10,textAlign:"center",fontWeight:300}}>Asuntoraportti saa välityspalkkion onnistuneesta kaupasta.</p>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

function TabTarkistus({mode}){
  const isSeller=mode==="myyjä";
  const groups=isSeller?[
    {title:"Valmistelu",items:["Pyydä isännöitsijäntodistus taloyhtiöltä","Kerää tilinpäätökset ja PTS-suunnitelma","Tilaa energiatodistus jos ei voimassa","Selvitä taloyhtiölainan osuus"]},
    {title:"Hinnoittelu ja markkinointi",items:["Pyydä hinta-arvio vähintään 2 välittäjältä","Tutki alueen toteutuneet kauppahinnat","Päätä myydäänkö itse vai välittäjän kautta","Ota laadukkaat valokuvat — paras investointi myyntiin"]},
    {title:"Myyntiprosessi",items:["Laita ilmoitus Etuoveen ja Oikotiehen","Järjestä näytöt — siisti ja tuuleta ennen","Arvioi tarjoukset huolella — ei vain hinta vaan myös ehdot","Kauppakirja allekirjoitetaan välittäjällä tai notaarilla","Muista ilmoittaa verottajalle luovutusvoitosta"]},
  ]:[
    {title:"Ennen lainahakemusta",items:["Laske nettotulot ja menosi tarkasti","Tarkista luottotietosi Asiakastiedolta","Dokumentoi säästöt — pankki pyytää 6 kk tiliotteen","Selvitä oletko oikeutettu ASP-lainaan (alle 44 v.)"]},
    {title:"Asuntoa tutkiessa",items:["Pyydä isännöitsijäntodistus","Lue tilinpäätökset 3 vuodelta","Kysy PTS eli tuleva remonttisuunnitelma","Tarkista energiatodistus","Tilaa kuntotarkastus (erityisesti omakotitalo)"]},
    {title:"Kaupanteon yhteydessä",items:["Lue kauppakirja huolellisesti","Maksa varainsiirtovero 2 kk kuluessa","Hanki kotivakuutus ennen avaimia","Tee muuttoilmoitus DVV:lle (digi.fi)"]},
  ];
  const [checked,setChecked]=useState({});
  const toggle=key=>setChecked(c=>({...c,[key]:!c[key]}));
  const total=groups.reduce((a,g)=>a+g.items.length,0);
  const done=Object.values(checked).filter(Boolean).length;
  return(
    <div>
      <div style={{fontFamily:H,fontSize:28,fontStyle:"italic",color:C.ink,marginBottom:6}}>{isSeller?"Myyjän tarkistuslista":"Ostajan tarkistuslista"}</div>
      <div style={{fontFamily:B,fontSize:13,color:C.stone,marginBottom:16,fontWeight:300}}>{done}/{total} tehty</div>
      <div style={{height:4,background:C.linen,borderRadius:2,overflow:"hidden",marginBottom:28}}>
        <div style={{width:`${Math.round(done/total*100)}%`,height:"100%",background:`linear-gradient(90deg,${C.forest},${C.clay})`,borderRadius:2,transition:"width 0.4s"}}/>
      </div>
      {groups.map(g=>(
        <div key={g.title} style={{marginBottom:28}}>
          <div style={{fontFamily:H,fontSize:17,fontStyle:"italic",color:C.ink,marginBottom:12}}>{g.title}</div>
          {g.items.map((item,i)=>{
            const key=`${g.title}-${i}`;
            return <CheckItem key={key} text={item} done={!!checked[key]} onClick={()=>toggle(key)}/>;
          })}
        </div>
      ))}
    </div>
  );
}

// ── Pyydä ilmainen arviokäynti: myyjän liidikanava (lähettää /api/liidi → Brevo) ──
// Välittäjäkumppani tekee maksuttoman arviokäynnin ja jättää tarjouksen.
function TabKonsultaatio(){
  const lang=useLang();
  const [liidi,setLiidi]=useState({nimi:"",puhelin:"",email:"",katuosoite:"",postinumero:"",kaupunki:"",tyyppi:"",koko:"",viesti:""});
  const [gdpr,setGdpr]=useState(false);
  const [sent,setSent]=useState(false);
  const [sending,setSending]=useState(false);
  const [error,setError]=useState(null);
  const set=(k,v)=>setLiidi(x=>({...x,[k]:v}));
  async function laheta(){
    if(!liidi.nimi||!liidi.puhelin){setError(t(lang,"Nimi ja puhelin ovat pakollisia.","Name and phone are required."));return;}
    if(!liidi.email){setError(t(lang,"Sähköposti on pakollinen.","Email is required."));return;}
    if(!liidi.katuosoite||!liidi.postinumero||!liidi.kaupunki){setError(t(lang,"Täytä katuosoite, postinumero ja kaupunki.","Fill in the street address, postal code and city."));return;}
    if(!gdpr){setError(t(lang,"Hyväksy tietosuojakäytäntö ennen lähetystä.","Please accept the privacy policy before sending."));return;}
    setError(null);setSending(true);
    // Kootaan asunnon tiedot yhteen luettavaan muotoon Brevon ASUNTO-kenttään
    const asuntoTiedot=[
      `${liidi.katuosoite}, ${liidi.postinumero} ${liidi.kaupunki}`,
      liidi.tyyppi||null,
      liidi.koko?`${liidi.koko} m²`:null,
    ].filter(Boolean).join(" · ");
    try{
      const r=await fetch("https://kotiopas-backend.onrender.com/api/liidi",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          nimi:liidi.nimi,
          puhelin:liidi.puhelin,
          email:liidi.email,
          asunto:asuntoTiedot,
          hinta:null,
          tyyppi:"myyja-arviokaynti",
          lisatieto:liidi.viesti||"",
          gdpr:true
        })
      });
      const data=await r.json();
      if(data.ok){
        setSent(true);
      }else{
        setError(data.error||t(lang,"Lähetys epäonnistui. Yritä uudelleen.","Sending failed. Please try again."));
      }
    }catch(err){
      console.error("Arviokäynti-liidi-virhe:",err);
      setError(t(lang,"Yhteysvirhe. Tarkista verkkoyhteys ja yritä uudelleen.","Connection error. Check your network and try again."));
    }finally{
      setSending(false);
    }
  }
  const hyodyt=[
    {ikoni:"home",t:t(lang,"Ilmainen arviokäynti","Free valuation visit"),d:t(lang,"Luotettava välittäjä käy arvioimassa asuntosi paikan päällä — maksutta.","A trusted agent visits to value your home in person — free of charge.")},
    {ikoni:"euro",t:t(lang,"Hinta-arvio ja tarjous","Price estimate and offer"),d:t(lang,"Saat tietää paljonko asunnostasi voi saada ja mitä myynti maksaa.","Find out how much you could get for your home and what selling costs.")},
    {ikoni:"handshake",t:t(lang,"Ei sitoumuksia","No commitment"),d:t(lang,"Arviokäynti ei velvoita mihinkään — päätät itse haluatko edetä.","The visit commits you to nothing — you decide whether to proceed.")},
  ];
  if(sent){
    return(
      <div>
        <div style={{fontFamily:H,fontSize:28,fontStyle:"italic",color:C.ink,marginBottom:6}}>{t(lang,"Kiitos yhteydenotosta!","Thank you for getting in touch!")}</div>
        <div style={{background:C.forestDim,border:`1px solid ${C.forest}30`,borderRadius:14,padding:"24px 20px",marginTop:16,display:"flex",gap:12,alignItems:"flex-start"}}>
          <span style={{fontSize:22,flexShrink:0}}>✅</span>
          <div style={{fontFamily:B,fontSize:14,color:C.ink,lineHeight:1.65,fontWeight:300}}>
            {t(lang,
              "Pyyntösi on vastaanotettu. Otamme sinuun yhteyttä pian ja sovimme sinulle sopivan ajan maksuttomalle arviokäynnille — rauhassa ja ilman kiirettä.",
              "Your request has been received. We'll be in touch soon to arrange a time that suits you for a free valuation visit — calmly and without pressure.")}
          </div>
        </div>
      </div>
    );
  }
  return(
    <div>
      <div style={{fontFamily:H,fontSize:28,fontStyle:"italic",color:C.ink,marginBottom:6}}>{t(lang,"Pyydä ilmainen arviokäynti","Request a free valuation visit")}</div>
      <div style={{fontFamily:B,fontSize:13,color:C.stone,marginBottom:24,fontWeight:300}}>{t(lang,"Vähemmän stressiä, sujuvampi myynti — autamme sinua.","Less stress, a smoother sale — we'll help you.")}</div>

      <div style={{display:"grid",gap:12,marginBottom:24}}>
        {hyodyt.map((h,i)=>(
          <div key={i} style={{background:C.cream,borderRadius:12,padding:"16px 18px",display:"flex",gap:14,alignItems:"flex-start"}}>
            <span style={{flexShrink:0,marginTop:1}}><Ikoni nimi={h.ikoni} size={22} color={C.clay}/></span>
            <div>
              <div style={{fontFamily:B,fontSize:14,color:C.ink,fontWeight:500,marginBottom:3}}>{h.t}</div>
              <div style={{fontFamily:B,fontSize:13,color:C.stone,fontWeight:300,lineHeight:1.55}}>{h.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{fontFamily:B,fontSize:14,color:C.ink,marginBottom:16,fontWeight:300,lineHeight:1.6}}>
        {t(lang,
          "Jätä yhteystietosi, niin järjestämme sinulle maksuttoman arviokäynnin luotettavan välittäjän kanssa. Ei sido mihinkään.",
          "Leave your details and we'll arrange a free valuation visit with a trusted agent. No obligation.")}
      </div>

      <div style={{display:"grid",gap:10,marginBottom:16}}>
        <FloatInput label={t(lang,"Nimi *","Name *")} value={liidi.nimi} onChange={e=>set("nimi",e.target.value)}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <FloatInput label={t(lang,"Puhelin *","Phone *")} type="tel" value={liidi.puhelin} onChange={e=>set("puhelin",e.target.value)}/>
          <FloatInput label={t(lang,"Sähköposti *","Email *")} type="email" value={liidi.email} onChange={e=>set("email",e.target.value)}/>
        </div>
        <FloatInput label={t(lang,"Katuosoite *","Street address *")} value={liidi.katuosoite} onChange={e=>set("katuosoite",e.target.value)}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <FloatInput label={t(lang,"Postinumero *","Postal code *")} value={liidi.postinumero} onChange={e=>set("postinumero",e.target.value)}/>
          <FloatInput label={t(lang,"Kaupunki *","City *")} value={liidi.kaupunki} onChange={e=>set("kaupunki",e.target.value)}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <FloatSelect label={t(lang,"Asuntotyyppi","Property type")} value={liidi.tyyppi} onChange={e=>set("tyyppi",e.target.value)}>
            <option value="">{t(lang,"Valitse…","Select…")}</option>
            <option value="Kerrostalo">{t(lang,"Kerrostalo","Apartment")}</option>
            <option value="Rivitalo">{t(lang,"Rivitalo","Terraced house")}</option>
            <option value="Omakotitalo">{t(lang,"Omakotitalo","Detached house")}</option>
            <option value="Paritalo">{t(lang,"Paritalo","Semi-detached")}</option>
          </FloatSelect>
          <FloatInput label={t(lang,"Koko (m²)","Size (m²)")} type="number" value={liidi.koko} onChange={e=>set("koko",e.target.value)}/>
        </div>
        <FloatInput label={t(lang,"Kerro lyhyesti tilanteestasi — vapaaehtoinen","Tell us briefly about your situation — optional")} value={liidi.viesti} onChange={e=>set("viesti",e.target.value)}/>
      </div>

      <label style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:16,cursor:"pointer"}}>
        <input type="checkbox" checked={gdpr} onChange={e=>setGdpr(e.target.checked)} style={{marginTop:3,cursor:"pointer",accentColor:C.gold}}/>
        <span style={{fontFamily:B,fontSize:12,color:C.stone,fontWeight:300,lineHeight:1.5}}>
          {t(lang,
            "Hyväksyn, että minuun saa olla yhteydessä antamillani tiedoilla, ja että tietojani käsitellään tietosuojaselosteen mukaisesti.",
            "I agree to be contacted using the details I've provided, and that my data is processed in accordance with the privacy policy.")}
        </span>
      </label>

      {error&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"12px 16px",color:"#B91C1C",fontFamily:B,fontSize:13,marginBottom:16}}>⚠ {error}</div>}

      <DarkBtn onClick={laheta} disabled={sending} style={{opacity:sending?0.6:1,cursor:sending?"wait":"pointer"}}>
        {sending?t(lang,"⏳ Lähetetään...","⏳ Sending..."):t(lang,"Pyydä ilmainen arviokäynti →","Request a free valuation visit →")}
      </DarkBtn>
    </div>
  );
}

// ── Kirjallinen arviolausunto pankkiin: myyjän/omistajan liidikanava ──────────
// Välittäjäkumppani tekee kirjallisen arviolausunnon esim. lainaa tai vakuutta
// varten. Lähettää /api/liidi → Brevo, tunniste "myyja-arviolausunto".
// ── Yleiskäyttöinen liidilomake (käytetään arviolausunnolle ja kauppakirjalle) ──
// Parametrit määräävät otsikon, hyödyt, Brevo-tunnisteen ja tekstit.
function LiidiLomake({otsikko,alaotsikko,hyodyt,brevoTyyppi,lisatietoLabel,nappiTeksti,kiitosViesti,naytaTyyppiKoko=true,onBack}){
  const lang=useLang();
  const [liidi,setLiidi]=useState({nimi:"",puhelin:"",email:"",katuosoite:"",postinumero:"",kaupunki:"",tyyppi:"",koko:"",viesti:""});
  const [gdpr,setGdpr]=useState(false);
  const [sent,setSent]=useState(false);
  const [sending,setSending]=useState(false);
  const [error,setError]=useState(null);
  const set=(k,v)=>setLiidi(x=>({...x,[k]:v}));
  async function laheta(){
    if(!liidi.nimi||!liidi.puhelin){setError(t(lang,"Nimi ja puhelin ovat pakollisia.","Name and phone are required."));return;}
    if(!liidi.email){setError(t(lang,"Sähköposti on pakollinen.","Email is required."));return;}
    if(!liidi.katuosoite||!liidi.postinumero||!liidi.kaupunki){setError(t(lang,"Täytä katuosoite, postinumero ja kaupunki.","Fill in the street address, postal code and city."));return;}
    if(!gdpr){setError(t(lang,"Hyväksy tietosuojakäytäntö ennen lähetystä.","Please accept the privacy policy before sending."));return;}
    setError(null);setSending(true);
    const asuntoTiedot=[
      `${liidi.katuosoite}, ${liidi.postinumero} ${liidi.kaupunki}`,
      liidi.tyyppi||null,
      liidi.koko?`${liidi.koko} m²`:null,
    ].filter(Boolean).join(" · ");
    try{
      const r=await fetch("https://kotiopas-backend.onrender.com/api/liidi",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          nimi:liidi.nimi,
          puhelin:liidi.puhelin,
          email:liidi.email,
          asunto:asuntoTiedot,
          hinta:null,
          tyyppi:brevoTyyppi,
          lisatieto:liidi.viesti||"",
          gdpr:true
        })
      });
      const data=await r.json();
      if(data.ok){setSent(true);}else{setError(data.error||t(lang,"Lähetys epäonnistui. Yritä uudelleen.","Sending failed. Please try again."));}
    }catch(err){
      console.error("Liidi-virhe:",err);
      setError(t(lang,"Yhteysvirhe. Tarkista verkkoyhteys ja yritä uudelleen.","Connection error. Check your network and try again."));
    }finally{setSending(false);}
  }
  if(sent){
    return(
      <div>
        <div style={{fontFamily:H,fontSize:28,fontStyle:"italic",color:C.ink,marginBottom:6}}>{t(lang,"Kiitos yhteydenotosta!","Thank you for getting in touch!")}</div>
        <div style={{background:C.forestDim,border:`1px solid ${C.forest}30`,borderRadius:14,padding:"24px 20px",marginTop:16,display:"flex",gap:12,alignItems:"flex-start"}}>
          <span style={{fontSize:22,flexShrink:0}}>✅</span>
          <div style={{fontFamily:B,fontSize:14,color:C.ink,lineHeight:1.65,fontWeight:300}}>{kiitosViesti}</div>
        </div>
        {onBack&&<button onClick={onBack} style={{marginTop:18,background:"none",border:"none",color:C.stone,fontFamily:B,fontSize:13,cursor:"pointer",textDecoration:"underline"}}>{t(lang,"← Takaisin lisäpalveluihin","← Back to extra services")}</button>}
      </div>
    );
  }
  return(
    <div>
      {onBack&&<button onClick={onBack} style={{background:"none",border:"none",color:C.stone,fontFamily:B,fontSize:13,cursor:"pointer",textDecoration:"underline",marginBottom:16,padding:0}}>{t(lang,"← Takaisin lisäpalveluihin","← Back to extra services")}</button>}
      <div style={{fontFamily:H,fontSize:28,fontStyle:"italic",color:C.ink,marginBottom:6}}>{otsikko}</div>
      <div style={{fontFamily:B,fontSize:13,color:C.stone,marginBottom:24,fontWeight:300}}>{alaotsikko}</div>

      <div style={{display:"grid",gap:12,marginBottom:24}}>
        {hyodyt.map((h,i)=>(
          <div key={i} style={{background:C.cream,borderRadius:12,padding:"16px 18px",display:"flex",gap:14,alignItems:"flex-start"}}>
            <span style={{flexShrink:0,marginTop:1}}><Ikoni nimi={h.ikoni} size={22} color={C.clay}/></span>
            <div>
              <div style={{fontFamily:B,fontSize:14,color:C.ink,fontWeight:500,marginBottom:3}}>{h.t}</div>
              <div style={{fontFamily:B,fontSize:13,color:C.stone,fontWeight:300,lineHeight:1.55}}>{h.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gap:10,marginBottom:16}}>
        <FloatInput label={t(lang,"Nimi *","Name *")} value={liidi.nimi} onChange={e=>set("nimi",e.target.value)}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <FloatInput label={t(lang,"Puhelin *","Phone *")} type="tel" value={liidi.puhelin} onChange={e=>set("puhelin",e.target.value)}/>
          <FloatInput label={t(lang,"Sähköposti *","Email *")} type="email" value={liidi.email} onChange={e=>set("email",e.target.value)}/>
        </div>
        <FloatInput label={t(lang,"Katuosoite *","Street address *")} value={liidi.katuosoite} onChange={e=>set("katuosoite",e.target.value)}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <FloatInput label={t(lang,"Postinumero *","Postal code *")} value={liidi.postinumero} onChange={e=>set("postinumero",e.target.value)}/>
          <FloatInput label={t(lang,"Kaupunki *","City *")} value={liidi.kaupunki} onChange={e=>set("kaupunki",e.target.value)}/>
        </div>
        {naytaTyyppiKoko&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <FloatSelect label={t(lang,"Asuntotyyppi","Property type")} value={liidi.tyyppi} onChange={e=>set("tyyppi",e.target.value)}>
              <option value="">{t(lang,"Valitse…","Select…")}</option>
              <option value="Kerrostalo">{t(lang,"Kerrostalo","Apartment")}</option>
              <option value="Rivitalo">{t(lang,"Rivitalo","Terraced house")}</option>
              <option value="Omakotitalo">{t(lang,"Omakotitalo","Detached house")}</option>
              <option value="Paritalo">{t(lang,"Paritalo","Semi-detached")}</option>
            </FloatSelect>
            <FloatInput label={t(lang,"Koko (m²)","Size (m²)")} type="number" value={liidi.koko} onChange={e=>set("koko",e.target.value)}/>
          </div>
        )}
        <FloatInput label={lisatietoLabel} value={liidi.viesti} onChange={e=>set("viesti",e.target.value)}/>
      </div>

      <label style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:16,cursor:"pointer"}}>
        <input type="checkbox" checked={gdpr} onChange={e=>setGdpr(e.target.checked)} style={{marginTop:3,cursor:"pointer",accentColor:C.gold}}/>
        <span style={{fontFamily:B,fontSize:12,color:C.stone,fontWeight:300,lineHeight:1.5}}>
          {t(lang,
            "Hyväksyn, että minuun saa olla yhteydessä antamillani tiedoilla, ja että tietojani käsitellään tietosuojaselosteen mukaisesti.",
            "I agree to be contacted using the details I've provided, and that my data is processed in accordance with the privacy policy.")}
        </span>
      </label>

      {error&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"12px 16px",color:"#B91C1C",fontFamily:B,fontSize:13,marginBottom:16}}>⚠ {error}</div>}

      <DarkBtn onClick={laheta} disabled={sending} style={{opacity:sending?0.6:1,cursor:sending?"wait":"pointer"}}>
        {sending?t(lang,"⏳ Lähetetään...","⏳ Sending..."):nappiTeksti}
      </DarkBtn>
    </div>
  );
}

// ── Lisäpalvelut: kokoaa erikoispalvelut (arviolausunto, kauppakirja) ──
function TabLisapalvelut(){
  const lang=useLang();
  const [valittu,setValittu]=useState(null); // null = korttinäkymä, muuten palvelun id
  const palvelut=[
    {
      id:"arviolausunto",
      kortti:{ikoni:"doc",t:t(lang,"Arviolausunto pankkiin","Valuation statement for the bank"),d:t(lang,"Kirjallinen arvio asunnostasi lainaa tai vakuutta varten.","A written valuation of your home for a loan or collateral.")},
      otsikko:t(lang,"Arviolausunto pankkiin","Valuation statement for the bank"),
      alaotsikko:t(lang,"Tarvitsetko kirjallisen arvion asunnostasi pankkia varten? Autamme.","Need a written valuation of your home for the bank? We'll help."),
      hyodyt:[
        {ikoni:"doc",t:t(lang,"Kirjallinen arviolausunto","Written valuation statement"),d:t(lang,"Arviolausunnon laatii kokenut kiinteistönvälittäjä, jolla on LKV-pätevyys (laillistettu kiinteistönvälittäjä). Voit toimittaa lausunnon suoraan pankille.","The statement is prepared by an experienced agent with LKV qualification (licensed real estate agent). You can submit it directly to the bank.")},
        {ikoni:"bank",t:t(lang,"Lainaa tai vakuutta varten","For a loan or collateral"),d:t(lang,"Pankki pyytää usein arviolausunnon esim. lainan, lisävakuuden tai uudelleenrahoituksen yhteydessä.","Banks often require a valuation statement for a loan, additional collateral, or refinancing.")},
      ],
      brevoTyyppi:"myyja-arviolausunto",
      lisatietoLabel:t(lang,"Lisätietoa — mihin tarvitset lausunnon (vapaaehtoinen)","More info — what you need the statement for (optional)"),
      nappiTeksti:t(lang,"Pyydä arviolausunto →","Request a valuation statement →"),
      kiitosViesti:t(lang,"Pyyntösi on vastaanotettu. Otamme sinuun yhteyttä pian ja sovimme kirjallisen arviolausunnon laatimisesta.","Your request has been received. We'll be in touch soon to arrange the written valuation statement."),
    },
    {
      id:"kauppakirja",
      kortti:{ikoni:"pen",t:t(lang,"Kauppakirjan laatiminen","Drafting the deed of sale"),d:t(lang,"Oletko itsemyyjä? Saat apua asunnon kauppakirjan laatimiseen.","Selling on your own? Get help drafting the deed of sale.")},
      otsikko:t(lang,"Kauppakirjan laatiminen","Drafting the deed of sale"),
      alaotsikko:t(lang,"Oletko itsemyyjä ja tarvitset apua kauppakirjan laatimisessa? Autamme.","Selling on your own and need help drafting the deed of sale? We'll help."),
      hyodyt:[
        {ikoni:"pen",t:t(lang,"Asiantunteva kauppakirja","An expertly drafted deed"),d:t(lang,"Kauppakirjan laatii kokenut kiinteistönvälittäjä, jolla on LKV-pätevyys (laillistettu kiinteistönvälittäjä). Varmistat että kauppa tehdään oikein ja turvallisesti.","The deed is drafted by an experienced agent with LKV qualification (licensed real estate agent). You ensure the sale is done correctly and safely.")},
        {ikoni:"handshake",t:t(lang,"Tueksi kaupantekoon","Support for the transaction"),d:t(lang,"Hyödyllinen erityisesti yksityiskaupassa, jossa kauppaa ei hoida välittäjä — saat ammattilaisen varmistamaan asiakirjat.","Especially useful in a private sale without an agent — you get a professional to verify the documents.")},
      ],
      brevoTyyppi:"myyja-kauppakirja",
      naytaTyyppiKoko:false,
      lisatietoLabel:t(lang,"Lisätietoa kaupasta (vapaaehtoinen)","More info about the sale (optional)"),
      nappiTeksti:t(lang,"Pyydä apua kauppakirjaan →","Request help with the deed →"),
      kiitosViesti:t(lang,"Pyyntösi on vastaanotettu. Otamme sinuun yhteyttä pian ja sovimme kauppakirjan laatimisesta.","Your request has been received. We'll be in touch soon to arrange the drafting of the deed of sale."),
    },
  ];
  if(valittu){
    const p=palvelut.find(x=>x.id===valittu);
    return <LiidiLomake {...p} onBack={()=>setValittu(null)}/>;
  }
  return(
    <div>
      <div style={{fontFamily:H,fontSize:28,fontStyle:"italic",color:C.ink,marginBottom:6}}>{t(lang,"Lisäpalvelut","Extra services")}</div>
      <div style={{fontFamily:B,fontSize:13,color:C.stone,marginBottom:24,fontWeight:300}}>{t(lang,"Asiantuntijan palveluita asunnon omistajalle — valitse mitä tarvitset.","Expert services for home owners — choose what you need.")}</div>
      <div style={{display:"grid",gap:14}}>
        {palvelut.map(p=>(
          <button key={p.id} onClick={()=>setValittu(p.id)}
            style={{textAlign:"left",background:C.cream,border:`1px solid ${C.border}`,borderRadius:14,padding:"20px 22px",cursor:"pointer",display:"flex",gap:16,alignItems:"center",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold;e.currentTarget.style.background=C.goldDim;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background=C.cream;}}>
            <span style={{flexShrink:0,marginTop:1}}><Ikoni nimi={p.kortti.ikoni} size={26} color={C.clay}/></span>
            <div style={{flex:1}}>
              <div style={{fontFamily:B,fontSize:16,color:C.ink,fontWeight:500,marginBottom:3}}>{p.kortti.t}</div>
              <div style={{fontFamily:B,fontSize:13.5,color:C.stone,fontWeight:300,lineHeight:1.5}}>{p.kortti.d}</div>
            </div>
            <span style={{color:C.gold,fontSize:20,flexShrink:0}}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}



function TabMyyntikulut(){
  const lang=useLang();
  const [hinta,setHinta]=useState("280000");
  const [ostoHinta,setOstoHinta]=useState("250000");
  const [omistusAika,setOmistusAika]=useState("3");
  const [valitPct,setValitPct]=useState("3");
  const myyntihinta=parseFloat(hinta)||0;
  const ostohinta=parseFloat(ostoHinta)||0;
  const valittajaPalkkio=myyntihinta*(parseFloat(valitPct)/100);
  const voitto=myyntihinta-ostohinta;
  const veroVapaa=parseInt(omistusAika)>=2;
  const luovutusvoittovero=voitto>0&&!veroVapaa?voitto*0.30:0;
  const nettoMyyntitulo=myyntihinta-valittajaPalkkio-luovutusvoittovero;
  return(
    <div>
      <div style={{fontFamily:H,fontSize:28,fontStyle:"italic",color:C.ink,marginBottom:6}}>{t(lang,"Myyntikululaskin","Selling cost calculator")}</div>
      <div style={{fontFamily:B,fontSize:13,color:C.stone,marginBottom:24,fontWeight:300}}>{t(lang,"Laske myynnin kulut ja nettotulo","Calculate selling costs and net proceeds")}</div>
      <div style={{display:"grid",gap:10,marginBottom:20}}>
        <FloatInput label={t(lang,"Myyntihinta (€)","Sale price (€)")} type="number" value={hinta} onChange={e=>setHinta(e.target.value)}/>
        <FloatInput label={t(lang,"Alkuperäinen ostohinta (€)","Original purchase price (€)")} type="number" value={ostoHinta} onChange={e=>setOstoHinta(e.target.value)}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <FloatInput label={t(lang,"Omistusaika (vuotta)","Ownership (years)")} type="number" value={omistusAika} onChange={e=>setOmistusAika(e.target.value)}/>
          <FloatInput label={t(lang,"Välittäjäpalkkio (%)","Agent fee (%)")} type="number" value={valitPct} onChange={e=>setValitPct(e.target.value)}/>
        </div>
      </div>
      <DarkCard style={{padding:"24px 20px"}}>
        <div style={{fontFamily:B,fontSize:10,color:"rgba(201,168,76,0.6)",letterSpacing:2,textTransform:"uppercase",marginBottom:16}}>{t(lang,"Myyntilaskelma","Sale breakdown")}</div>
        {[
          {l:t(lang,"Myyntihinta","Sale price"),v:`${fmt(myyntihinta)} €`},
          {l:`${t(lang,"Välittäjäpalkkio","Agent fee")} (${valitPct}%)`,v:`− ${fmt(valittajaPalkkio)} €`},
          {l:t(lang,"Voitto / tappio","Profit / loss"),v:`${voitto>=0?"+":""}${fmt(voitto)} €`},
          {l:t(lang,"Luovutusvoittovero (30%)","Capital gains tax (30%)"),v:veroVapaa?t(lang,"0 € (verovapaa ✓)","€0 (exempt ✓)"):`− ${fmt(luovutusvoittovero)} €`},
        ].map(row=>(
          <div key={row.l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <span style={{fontFamily:B,fontSize:13,color:"rgba(251,243,226,0.5)",fontWeight:300}}>{row.l}</span>
            <span style={{fontFamily:H,fontSize:16,color:"#FBF3E2"}}>{row.v}</span>
          </div>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",padding:"14px 0"}}>
          <span style={{fontFamily:B,fontSize:13,color:"rgba(251,243,226,0.5)",fontWeight:300}}>{t(lang,"Nettotulo myynnistä","Net proceeds from sale")}</span>
          <span style={{fontFamily:H,fontSize:32,color:C.gold,letterSpacing:-0.5}}>{fmt(nettoMyyntitulo)} €</span>
        </div>
        {veroVapaa&&(
          <div style={{background:"rgba(62,92,63,0.3)",border:"1px solid rgba(62,92,63,0.4)",borderRadius:8,padding:"10px 14px",fontFamily:B,fontSize:12,color:"#A8D5B5",lineHeight:1.6}}>
            {t(lang,"✓ Yli 2 vuoden omistus — luovutusvoitto on verovapaa!","✓ Over 2 years of ownership — the capital gain is tax-free!")}
          </div>
        )}
        {!veroVapaa&&voitto>0&&(
          <div style={{background:"rgba(181,105,60,0.2)",border:"1px solid rgba(181,105,60,0.3)",borderRadius:8,padding:"10px 14px",fontFamily:B,fontSize:12,color:"#E8B08A",lineHeight:1.6}}>
            {t(lang,"⚠ Alle 2 vuoden omistus — luovutusvoitosta maksetaan 30% veroa.","⚠ Less than 2 years of ownership — a 30% tax applies to the capital gain.")}
          </div>
        )}
        <div style={{fontFamily:B,fontSize:11,color:"rgba(251,243,226,0.3)",marginTop:12,lineHeight:1.6,fontWeight:300}}>{t(lang,"Suuntaa-antava. Kysy verottajalta tai tilintarkastajalta tarkempi arvio.","Indicative only. Ask the tax authority or an accountant for a more precise estimate.")}</div>
      </DarkCard>
    </div>
  );
}

// Myyjän opas: mitä asunnon myynti vaatii + missä välittäjä auttaa → CTA arviokäyntiin.
// EI dokumenttianalyysiä (se on ostajan maksullinen tuote). Tarkoitus: auttaa apua
// tarvitsevaa myyjää hahmottamaan myynnin laajuus ja ohjata ammattilaisen luo.
function TabMyyntiopas({onArviokaynti}){
  const lang=useLang();
  const kortit=[
    {ikoni:"coins",t:t(lang,"Oikea hinnoittelu","The right pricing"),d:t(lang,"Liian korkea hinta karkottaa ostajat, liian matala maksaa sinulle. Kokenut välittäjä hinnoittelee asunnon tämänhetkisen markkinan ja toteutuneiden kauppojen perusteella.","Too high scares off buyers, too low costs you money. An experienced agent prices your home based on the current market and actual sales.")},
    {ikoni:"camera",t:t(lang,"Markkinointi ja esittely","Marketing and presentation"),d:t(lang,"Laadukkaat kuvat, hyvä ilmoitus ja näytöt ratkaisevat kuinka monta kiinnostunutta tavoitat. Välittäjällä on välineet ja näkyvyys joita yksityismyyjällä ei ole.","Quality photos, a good listing and viewings decide how many interested buyers you reach. An agent has tools and visibility a private seller doesn't.")},
    {ikoni:"clipboard",t:t(lang,"Paperit ja juridiikka","Documents and legal side"),d:t(lang,"Kauppakirja, isännöitsijäntodistus, vastuukysymykset, virhevastuu. Tässä tehdyt virheet voivat tulla kalliiksi — ammattilainen varmistaa että kaikki on kunnossa.","Deed of sale, manager's certificate, liability questions. Mistakes here can be costly — a professional makes sure everything is in order.")},
    {ikoni:"handshake",t:t(lang,"Neuvottelu ja tarjoukset","Negotiation and offers"),d:t(lang,"Tarjousten käsittely ja hinnasta neuvottelu on taitolaji. Ammattilainen saa usein paremman lopputuloksen kuin myyjä yksin — ja hoitaa tunteikkaatkin tilanteet.","Handling offers and negotiating price is a skill. A professional often gets a better result than a seller alone — and handles emotional moments.")},
    {ikoni:"target",t:t(lang,"Stressitön prosessi","A stress-free process"),d:t(lang,"Myynti on iso ja aikaa vievä projekti. Kun välittäjä hoitaa kokonaisuuden, säästät aikaa ja vaivaa — ja voit keskittyä omaan elämääsi.","Selling is a big, time-consuming project. When an agent handles it all, you save time and effort — and can focus on your own life.")},
  ];
  return(
    <div>
      <div style={{fontFamily:H,fontSize:28,fontStyle:"italic",color:C.ink,marginBottom:6}}>{t(lang,"Apua asunnon myyntiin","Help with selling your home")}</div>
      <div style={{fontFamily:B,fontSize:13,color:C.stone,marginBottom:24,fontWeight:300,lineHeight:1.6}}>{t(lang,"Asunnon myynti on iso päätös ja monta liikkuvaa osaa. Tässä mitä myyntiin kuuluu — ja missä kokenut välittäjä auttaa sinua onnistumaan.","Selling a home is a big decision with many moving parts. Here's what selling involves — and where an experienced agent helps you succeed.")}</div>

      <div style={{display:"grid",gap:12,marginBottom:24}}>
        {kortit.map((k,i)=>(
          <div key={i} style={{background:C.cream,border:`1px solid ${C.border}`,borderRadius:12,padding:"16px 18px",display:"flex",gap:14,alignItems:"flex-start"}}>
            <span style={{flexShrink:0,marginTop:1}}><Ikoni nimi={k.ikoni} size={24} color={C.clay}/></span>
            <div>
              <div style={{fontFamily:B,fontSize:15,color:C.ink,fontWeight:500,marginBottom:4}}>{k.t}</div>
              <div style={{fontFamily:B,fontSize:13,color:C.stone,fontWeight:300,lineHeight:1.6}}>{k.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{background:C.forestDim,border:`1px solid ${C.forest}40`,borderRadius:14,padding:"22px 22px",textAlign:"center"}}>
        <div style={{fontFamily:H,fontSize:21,fontStyle:"italic",color:C.ink,marginBottom:8}}>{t(lang,"Mietitkö asuntosi myyntiä?","Thinking of selling your home?")}</div>
        <div style={{fontFamily:B,fontSize:13.5,color:C.stone,fontWeight:300,lineHeight:1.65,marginBottom:18}}>{t(lang,"Aloita ilmaisella arviokäynnillä. Kokenut välittäjä käy katsomassa asuntosi, kertoo paljonko siitä voi saada ja miten myynti kannattaa hoitaa — maksutta ja ilman sitoumuksia.","Start with a free valuation visit. An experienced agent visits your home, tells you what it could sell for and how to approach the sale — free of charge and with no commitment.")}</div>
        <button onClick={()=>{onArviokaynti&&onArviokaynti();window.scrollTo({top:0,behavior:"smooth"});}} style={{background:C.forest,color:"#FBF3E2",border:"none",padding:"14px 28px",fontFamily:B,fontSize:14,fontWeight:500,letterSpacing:0.5,cursor:"pointer",borderRadius:10}}>{t(lang,"Pyydä ilmainen arviokäynti →","Request a free valuation visit →")}</button>
      </div>
    </div>
  );
}

function TabSanasto(){
  const lang=useLang();
  const terms=[
    {t:t(lang,"Isännöitsijäntodistus","Property manager's certificate (isännöitsijäntodistus)"),d:t(lang,"Taloyhtiön virallinen dokumentti: osakkeiden tiedot, yhtiön velat, tehdyt ja tulevat remontit sekä vastike.","The housing company's official document: share details, company debts, completed and upcoming renovations, and the maintenance charge.")},
    {t:t(lang,"Taloyhtiölaina","Housing company loan"),d:t(lang,"Taloyhtiön ottama laina jaettuna osakkaiden kesken. Velaton hinta = myyntihinta + oma osuus lainasta.","A loan taken by the housing company, divided among the shareholders. Debt-free price = sale price + your share of the loan.")},
    {t:t(lang,"Hoitovastike","Maintenance charge (hoitovastike)"),d:t(lang,"Kuukausimaksu taloyhtiön juokseviin kuluihin: lämmitys, siivous, hallinto, vakuutukset.","A monthly fee for the housing company's running costs: heating, cleaning, administration, insurance.")},
    {t:t(lang,"ASP-laina","ASP loan (first-home savings)"),d:t(lang,"Asuntosäästöpalkkiojärjestelmä alle 44-vuotiaille ensiasunnon ostajille — valtion korkotuki ja alhaisempi marginaali.","A home-savings bonus scheme for first-home buyers under 44 — state interest subsidy and a lower margin.")},
    {t:t(lang,"Varainsiirtovero","Transfer tax (varainsiirtovero)"),d:t(lang,"Ostajalta perittävä vero. Osakehuoneistosta 1,5 %, kiinteistöstä 3 %. (Ensiasunnon verovapaus poistui 1.1.2024 – myös ensiasunnon ostaja maksaa veron.)","A tax paid by the buyer. 1.5% for shares in a housing company, 3% for real property. (The first-home exemption was abolished on 1 Jan 2024 – first-home buyers now pay the tax too.)")},
    {t:t(lang,"Luovutusvoittovero","Capital gains tax"),d:t(lang,"Myyjältä perittävä 30% vero myyntivoitosta. Verovapaa jos asunto on ollut omassa asuinkäytössä yli 2 vuotta.","A 30% tax on the seller's profit. Exempt if the home has been your own residence for over 2 years.")},
    {t:t(lang,"PTS","Long-term plan (PTS)"),d:t(lang,"Pitkän tähtäimen suunnitelma — taloyhtiön 5–10 vuoden tuleva remonttiohjelma.","A long-term plan — the housing company's 5–10 year upcoming renovation programme.")},
    {t:t(lang,"Välittäjäpalkkio","Agent's commission"),d:t(lang,"Kiinteistönvälittäjän palkkio, tyypillisesti 2–4% myyntihinnasta. Myyjä maksaa yleensä.","The real estate agent's fee, typically 2–4% of the sale price. Usually paid by the seller.")},
    {t:t(lang,"Euribor + marginaali","Euribor + margin"),d:t(lang,"Asuntolainan korko = Euribor (viitekorko) + pankin marginaali. Marginaali on neuvoteltavissa.","The mortgage rate = Euribor (reference rate) + the bank's margin. The margin is negotiable.")},
    {t:t(lang,"Energiatodistus","Energy certificate"),d:t(lang,"Virallinen A–G luokitus asunnon energiatehokkuudesta. Pakollinen myynti-ilmoituksessa.","An official A–G rating of the home's energy efficiency. Required in the sales listing.")},
    {t:t(lang,"Yhtiövastike","Total monthly charge (yhtiövastike)"),d:t(lang,"Osakkaan kuukausimaksu taloyhtiölle yhteensä — sisältää hoitovastikkeen ja mahdollisen rahoitusvastikkeen.","The shareholder's total monthly payment to the housing company — includes the maintenance charge and any capital charge.")},
    {t:t(lang,"Rahoitusvastike","Capital charge (rahoitusvastike)"),d:t(lang,"Vastikkeen osa, joka menee taloyhtiölainan lyhennykseen ja korkoihin. Voi usein maksaa myös kerralla pois (\"lainaosuuden poismaksu\").","The part of the charge that goes toward repaying the housing company loan and its interest. Can often be paid off in one lump sum.")},
    {t:t(lang,"Velaton hinta","Debt-free price (velaton hinta)"),d:t(lang,"Asunnon kokonaishinta: myyntihinta + osuus taloyhtiön lainasta. Vertaa aina velattomia hintoja keskenään.","The total price of the home: sale price + your share of the housing company loan. Always compare debt-free prices.")},
    {t:t(lang,"Lunastuslauseke","Redemption clause (lunastuslauseke)"),d:t(lang,"Yhtiöjärjestyksen ehto, joka antaa taloyhtiölle tai osakkaille oikeuden lunastaa myydyt osakkeet kauppahinnalla. Voi viivästyttää kauppaa — tarkista isännöitsijäntodistuksesta.","A clause in the articles of association giving the company or shareholders the right to redeem sold shares at the sale price. Can delay the deal — check the manager's certificate.")},
    {t:t(lang,"Kuntotarkastus","Condition inspection (kuntotarkastus)"),d:t(lang,"Asiantuntijan tekemä pintapuolinen arvio asunnon kunnosta ja korjaustarpeista ennen kauppaa. Yleisempi omakoti- ja rivitaloissa kuin kerrostaloissa.","An expert's surface-level assessment of the home's condition and repair needs before the sale. More common for houses and row houses than apartments.")},
  ].sort((a,b)=>a.t.localeCompare(b.t,lang==="en"?"en":"fi"));
  return(
    <div>
      <div style={{fontFamily:H,fontSize:28,fontStyle:"italic",color:C.ink,marginBottom:6}}>{t(lang,"Sanasto","Glossary")}</div>
      <div style={{fontFamily:B,fontSize:13,color:C.stone,marginBottom:24,fontWeight:300}}>{t(lang,"Tärkeimmät termit ostajalle ja myyjälle","Key terms for buyers and sellers")}</div>
      <div style={{display:"grid",gap:10}}>
        {terms.map(term=>(
          <div key={term.t} style={{background:C.cream,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.clay}`,borderRadius:"0 10px 10px 0",padding:"16px 18px"}}>
            <div style={{fontFamily:H,fontSize:17,fontStyle:"italic",color:C.ink,marginBottom:6}}>{term.t}</div>
            <div style={{fontFamily:B,fontSize:13,color:C.stone,lineHeight:1.7,fontWeight:300}}>{term.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const BACKEND_URL = "https://kotiopas-backend.onrender.com";

function TabIlmoitus(){
  const [url,setUrl]=useState("");
  const [loading,setLoading]=useState(false);
  const [loadStep,setLoadStep]=useState(0);
  const [result,setResult]=useState(null);
  const [error,setError]=useState(null);

  async function analysoi(){
    const u=url.trim();
    if(!u){setError("Liitä myynti-ilmoituksen linkki.");return;}
    if(!u.startsWith("http")){setError("Linkki pitää alkaa https://");return;}
    if(!u.includes("etuovi")&&!u.includes("oikotie")&&!u.includes("kiinteistomaailma")){
      setError("Tuetut portaalit: Etuovi.com, Oikotie.fi, Kiinteistömaailma.fi");return;
    }
    setError(null);setResult(null);setLoading(true);setLoadStep(1);

    try{
      setTimeout(()=>setLoadStep(2),600);
      const res=await fetch(`${BACKEND_URL}/api/hae-ilmoitus`,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({url:u}),
      });
      setLoadStep(3);
      if(!res.ok){
        const err=await res.json().catch(()=>({}));
        throw new Error(err.error||`Haku epäonnistui (${res.status})`);
      }
      const data=await res.json();
      const t=data.tiedot;

      const arvioForm={
        alue:t.sijainti||"Helsinki",postinumero:t.postinumero||"",
        tyyppi:t.rakennustyyppi||"Kerrostaloasunto",koko:t.koko||50,
        huoneet:t.huoneet||"2h+k",rakVuosi:t.vuosi||"1980",
        kerros:t.kerros||"",kunto:"Hyvä (hyväkuntoinen)",
        taloyhtiölaina:String(t.laina||0),lisatiedot:"",
      };
      const arvio=await laskeArvioSmart(arvioForm);

      const hoito=parseFloat(t.hoitovastike)||0;
      const vuosiN=parseInt(t.vuosi)||1980;
      const ika=2025-vuosiN;
      let pisteet=100;
      const hyvat=[],huolet=[],kysymykset=[];
      if(ika>50){pisteet-=20;huolet.push(`Vanha rakennus (${vuosiN}) — putkiremonttiriski`);}
      else if(ika>30){pisteet-=10;huolet.push(`Rakennus ${vuosiN} — tarkista linjasaneeraus`);}
      else{hyvat.push(`Uusi rakennus (${vuosiN})`);}
      if(hoito>6){pisteet-=15;huolet.push(`Korkea hoitovastike ${hoito} €/m²`);}
      else if(hoito>0){hyvat.push(`Hoitovastike ${hoito} €/m²/kk kohtuullinen`);}
      if((t.laina||0)>50000){pisteet-=20;huolet.push(`Taloyhtiölaina ${fmt(t.laina)} € — suuri`);}
      else if((t.laina||0)>25000){pisteet-=10;huolet.push(`Taloyhtiölaina ${fmt(t.laina)} € — huomioitava`);}
      else if(!t.laina){hyvat.push("Ei taloyhtiölainaa");}
      else{hyvat.push(`Maltillinen yhtiölaina ${fmt(t.laina)} €`);}
      kysymykset.push("Onko putkiremontti tehty tai suunniteltu?");
      kysymykset.push("Onko taloyhtiöllä riittävä korjausrahasto?");
      kysymykset.push("Mitkä remontit ovat tulossa seuraavalle 10 vuodelle?");
      pisteet=Math.max(0,Math.min(100,pisteet));
      const tyArvosana=pisteet>=85?"A":pisteet>=70?"B":pisteet>=50?"C":"D";

      const myyntihinta=t.hinta||0;
      const ero=myyntihinta>0?myyntihinta-arvio.todennakoisin:0;
      const eroPct=arvio.todennakoisin>0?Math.round(ero/arvio.todennakoisin*100):0;

      setResult({t,arvio,tyArvosana,tyPisteet:pisteet,hyvat,huolet,kysymykset,ero,eroPct,myyntihinta});
    }catch(e){
      setError(e.message);
    }
    setLoading(false);setLoadStep(0);
  }

  const gradeColor={A:C.forest,B:"#5A8A3F",C:C.clay,D:C.terra};

  const steps=["🔍 Haetaan ilmoituksen tiedot...","📊 Lasketaan hinta-arvio...","🏢 Analysoidaan taloyhtiö..."];

  return(
    <div>
      <div style={{fontFamily:H,fontSize:28,fontStyle:"italic",color:C.ink,marginBottom:6}}>Tarjousapuri</div>
      <div style={{fontFamily:B,fontSize:13,color:C.stone,marginBottom:20,fontWeight:300}}>
        Liitä Etuovi- tai Oikotie-linkki — saat hinta-analyysin ja vinkit tarjouksen tueksi
      </div>

      <div style={{position:"relative",marginBottom:12}}>
        <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:18,pointerEvents:"none"}}>🔗</div>
        <input value={url} onChange={e=>{setUrl(e.target.value);setResult(null);setError(null);}}
          onKeyDown={e=>e.key==="Enter"&&analysoi()}
          placeholder="https://www.etuovi.com/kohde/..."
          style={{width:"100%",padding:"16px 14px 16px 46px",background:C.cream,border:`1.5px solid ${url?C.clay:C.border}`,borderRadius:12,fontFamily:B,fontSize:14,color:C.ink,outline:"none",boxSizing:"border-box",transition:"border-color 0.2s"}}/>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {["✓ Etuovi.com","✓ Oikotie.fi","✓ Kiinteistömaailma.fi"].map(p=>(
          <div key={p} style={{background:C.forestDim,border:`1px solid ${C.forest}30`,borderRadius:20,padding:"5px 12px",fontFamily:B,fontSize:11,color:C.forest}}>{p}</div>
        ))}
      </div>

      {error&&(
        <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"12px 16px",color:"#B91C1C",fontFamily:B,fontSize:13,marginBottom:16}}>
          ⚠ {error}
          {error.includes("backend")||error.includes("fetch")?(
            <div style={{marginTop:8,fontSize:12,color:C.stone}}>Backend ei ole käynnissä. Katso OHJEET.md deployauksesta.</div>
          ):null}
        </div>
      )}

      <DarkBtn onClick={analysoi} style={{marginBottom:24}} disabled={loading}>
        {loading?"⏳ Analysoidaan...":"Analysoi →"}
      </DarkBtn>

      {loading&&(
        <div style={{background:C.cream,border:`1px solid ${C.border}`,borderRadius:14,padding:"24px 20px",marginBottom:16}}>
          {steps.map((s,i)=>(
            <div key={i} style={{fontFamily:B,fontSize:13,marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:loadStep>i?C.forest:loadStep===i+1?C.clay:C.linen,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.3s"}}>
                {loadStep>i&&<span style={{color:"white",fontSize:10}}>✓</span>}
                {loadStep===i+1&&<span style={{fontSize:10}}>⏳</span>}
              </div>
              <span style={{color:loadStep>i?C.forest:loadStep===i+1?C.ink:C.stone,fontWeight:loadStep===i+1?500:300}}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {result&&(
        <div>
          <div style={{background:C.cream,border:`1px solid ${C.border}`,borderRadius:14,padding:"20px",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:C.forest}}/>
              <span style={{fontFamily:B,fontSize:11,letterSpacing:2,textTransform:"uppercase",color:C.forest,fontWeight:600}}>Haettu {result.t.portaali||"portaalista"}</span>
            </div>
            {result.t.otsikko&&<div style={{fontFamily:H,fontSize:18,fontStyle:"italic",color:C.ink,marginBottom:4}}>{result.t.otsikko}</div>}
            {result.t.sijainti&&<div style={{fontFamily:B,fontSize:13,color:C.stone,marginBottom:14,fontWeight:300}}>📍 {result.t.sijainti}</div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[
                {l:"Velaton hinta",v:result.myyntihinta?`${fmt(result.myyntihinta)} €`:"—",hi:true},
                {l:"Koko",v:result.t.koko?`${result.t.koko} m²`:"—"},
                {l:"Huoneet",v:result.t.huoneet||"—"},
                {l:"Rak.vuosi",v:result.t.vuosi||"—"},
                {l:"Hoitovastike",v:result.t.hoitovastike?`${result.t.hoitovastike} €/m²`:"—"},
                {l:"Yhtiölaina",v:result.t.laina?`${fmt(result.t.laina)} €`:"—"},
              ].map(s=>(
                <div key={s.l} style={{background:C.warm,borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontFamily:B,fontSize:10,color:C.stone,letterSpacing:1,textTransform:"uppercase",marginBottom:3}}>{s.l}</div>
                  <div style={{fontFamily:H,fontSize:15,color:s.hi?C.terra:C.ink,fontWeight:s.hi?600:400}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {result.myyntihinta>0&&(
            <>
              <div style={{height:2,background:`linear-gradient(90deg,transparent,${C.gold},${C.clay},transparent)`,borderRadius:2}}/>
              <DarkCard style={{padding:"24px 20px",marginBottom:16,marginTop:0}}>
                <div style={{fontFamily:B,fontSize:10,color:"rgba(201,168,76,0.6)",letterSpacing:2,textTransform:"uppercase",marginBottom:14}}>Hinta-analyysi</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                  <div><div style={{fontFamily:B,fontSize:10,color:"rgba(251,243,226,0.35)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Velaton hinta</div><div style={{fontFamily:H,fontSize:28,color:"#FBF3E2"}}>{fmt(result.myyntihinta)} €</div></div>
                  <div><div style={{fontFamily:B,fontSize:10,color:"rgba(251,243,226,0.35)",letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Asuntoraportti-arvio</div><div style={{fontFamily:H,fontSize:28,color:C.gold}}>{fmt(result.arvio.todennakoisin)} €</div></div>
                </div>
                <div style={{background:Math.abs(result.eroPct)<=5?"rgba(62,92,63,0.2)":"rgba(181,105,60,0.2)",border:`1px solid ${Math.abs(result.eroPct)<=5?C.forest:C.terra}40`,borderRadius:8,padding:"12px 16px",marginBottom:16}}>
                  <div style={{fontFamily:B,fontSize:14,color:Math.abs(result.eroPct)<=5?C.forest:result.eroPct>5?C.terra:C.forest,fontWeight:500,marginBottom:4}}>
                    {result.eroPct>5?`⚠ Hinta ${result.eroPct}% yli markkina-arvon`:result.eroPct<-5?`✓ Hinta ${Math.abs(result.eroPct)}% alle markkina-arvon`:"✓ Hinta vastaa markkina-arvoa"}
                  </div>
                  <div style={{fontFamily:B,fontSize:12,color:"rgba(251,243,226,0.5)",fontWeight:300}}>
                    {result.eroPct>5?"Neuvottele — voit tarjota arviohintaa tai alle":"Kohtuullinen hinta alueen markkinoihin nähden"}
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[{l:"Vaihteluväli",v:`${fmt(result.arvio.arvio_min)}–${fmt(result.arvio.arvio_max)} €`},{l:"Erotus",v:`${result.ero>=0?"+":""}${fmt(result.ero)} €`},{l:"Tämä / m²",v:`${fmt(result.arvio.hinta_per_m2)} €/m²`},{l:"Alue keskim.",v:`${fmt(result.arvio.alueen_keskim_m2)} €/m²`}].map(s=>(
                    <div key={s.l} style={{padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                      <div style={{fontFamily:B,fontSize:10,color:"rgba(251,243,226,0.3)",letterSpacing:1,textTransform:"uppercase",marginBottom:4}}>{s.l}</div>
                      <div style={{fontFamily:H,fontSize:16,color:"#FBF3E2"}}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </DarkCard>
              {result.arvio.lahde==="tilastokeskus"?(
                <div style={{background:C.cream,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",gap:8,alignItems:"flex-start"}}>
                  <span style={{fontSize:13,flexShrink:0,marginTop:1}}>📊</span>
                  <div style={{fontFamily:B,fontSize:11,color:C.stone,lineHeight:1.55,fontWeight:300}}>
                    <span style={{color:C.ink,fontWeight:500}}>Tilastokeskus</span> — Vanhojen osakeasuntojen neliöhinnat postinumeroittain {result.arvio.tilastoTiedot?.postinumeroNimi?`(${result.arvio.tilastoTiedot.postinumeroNimi})`:""}. {result.arvio.tilastoTiedot?.kauppoja?`${result.arvio.tilastoTiedot.kauppoja} kauppaa vuonna ${result.arvio.tilastoTiedot.vuosi}.`:""}
                  </div>
                </div>
              ):(
                <div style={{background:C.cream,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",gap:8,alignItems:"flex-start"}}>
                  <span style={{fontSize:13,flexShrink:0,marginTop:1}}>ℹ️</span>
                  <div style={{fontFamily:B,fontSize:11,color:C.stone,lineHeight:1.55,fontWeight:300}}>
                    <span style={{color:C.ink,fontWeight:500}}>Yleinen arvio</span> — Tilastokeskuksen viralliset hinnat eivät ole saatavilla tälle alueelle (liian vähän vuosittaisia kauppoja tilaston julkaisuun). Arvio perustuu yleisiin alueen hintatasoihin.
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{background:C.cream,border:`1px solid ${C.border}`,borderRadius:14,padding:"20px",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>
              <div style={{width:52,height:52,borderRadius:"50%",border:`2px solid ${gradeColor[result.tyArvosana]}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{fontFamily:H,fontSize:30,color:gradeColor[result.tyArvosana],lineHeight:1}}>{result.tyArvosana}</span>
              </div>
              <div><div style={{fontFamily:H,fontSize:18,fontStyle:"italic",color:C.ink}}>Taloyhtiöanalyysi</div><div style={{fontFamily:B,fontSize:12,color:C.stone,fontWeight:300}}>{result.tyPisteet}/100 pistettä</div></div>
            </div>
            <div style={{height:4,background:C.linen,borderRadius:2,overflow:"hidden",marginBottom:14}}>
              <div style={{width:`${result.tyPisteet}%`,height:"100%",background:`linear-gradient(90deg,${gradeColor[result.tyArvosana]},${C.gold})`,borderRadius:2,transition:"width 1s"}}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
              <div style={{background:C.forestDim,borderRadius:10,padding:"12px"}}>
                <div style={{fontFamily:B,fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:C.forest,marginBottom:8,fontWeight:600}}>Positiivista</div>
                {result.hyvat.map((v,i)=><div key={i} style={{fontFamily:B,fontSize:12,color:C.ink,marginBottom:5,display:"flex",gap:6,lineHeight:1.5}}><span style={{color:C.forest,flexShrink:0}}>✓</span>{v}</div>)}
              </div>
              <div style={{background:C.clayDim,borderRadius:10,padding:"12px"}}>
                <div style={{fontFamily:B,fontSize:10,letterSpacing:1.5,textTransform:"uppercase",color:C.terra,marginBottom:8,fontWeight:600}}>Huomiot</div>
                {result.huolet.map((v,i)=><div key={i} style={{fontFamily:B,fontSize:12,color:C.ink,marginBottom:5,display:"flex",gap:6,lineHeight:1.5}}><span style={{color:C.clay,flexShrink:0}}>⚠</span>{v}</div>)}
              </div>
            </div>
            <div style={{background:C.goldDim,border:`1px solid ${C.gold}25`,borderRadius:10,padding:"14px"}}>
              <div style={{fontFamily:H,fontSize:14,fontStyle:"italic",color:C.ink,marginBottom:10}}>Kysy isännöitsijältä</div>
              {result.kysymykset.map((q,i)=>(
                <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
                  <div style={{width:18,height:18,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}><span style={{fontFamily:B,fontSize:9,fontWeight:700,color:"white"}}>{i+1}</span></div>
                  <div style={{fontFamily:B,fontSize:12,color:C.ink,lineHeight:1.6,fontWeight:300}}>{q}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

// ── Asuntoraportin tekstin renderöinti ───────────────────────────────────────
// Claude palauttaa analyysin selkokielisenä tekstinä (mahdollisesti markdownia).
// Tämä kevyt renderöijä muuntaa otsikot, lihavoinnit ja luettelot brändin
// mukaisiksi elementeiksi — ilman ulkoisia kirjastoja.
function renderInline(teksti){
  const osat=String(teksti).split(/(\*\*[^*]+\*\*)/g);
  return osat.map((osa,i)=>{
    if(/^\*\*[^*]+\*\*$/.test(osa)){
      return <strong key={i} style={{color:C.ink,fontWeight:600}}>{osa.slice(2,-2)}</strong>;
    }
    return <span key={i}>{osa}</span>;
  });
}

// Tunnistaa taulukkorivin: sisältää vähintään yhden |-merkin keskellä
// (sallii rivit jotka eivät ala/lopu täsmälleen |-merkkiin, esim. "| a | b |.")
function onTaulukkoRivi(t){
  if(!t.includes("|")) return false;
  // Poista mahdolliset reuna-pisteet/välilyönnit, tarkista että jää sisältöä molemmin puolin |-merkkiä
  const ydin=t.replace(/^[\s.|]+/,"").replace(/[\s.|]+$/,"");
  return ydin.includes("|");
}
// Erotinrivi otsikon alla: "|---|:--:|---|" (pelkkiä viivoja, kaksoispisteitä, putkia)
function onErotinRivi(t){
  const ydin=t.replace(/^[\s|]+/,"").replace(/[\s|]+$/,"");
  return /^[\s:|-]+$/.test(ydin) && ydin.includes("-");
}
function jaaSolut(t){
  // Poista reunoilta putket, välilyönnit ja ylimääräiset pisteet, jaa |-merkillä
  return t.replace(/^[\s.|]+/,"").replace(/[\s.|]+$/,"").split("|").map(s=>s.trim());
}

function RaporttiText({text}){
  const rivit=String(text).split("\n");
  const elementit=[];
  let lista=[];
  let viimeisinOtsikko="";
  const purgeLista=avain=>{
    if(lista.length){
      const nykyinen=lista.slice();
      elementit.push(
        <ul key={"ul-"+avain} style={{margin:"4px 0 14px",paddingLeft:22}}>
          {nykyinen.map((it,i)=>(
            <li key={i} style={{fontFamily:B,fontSize:14,color:C.ink,lineHeight:1.7,marginBottom:6,fontWeight:300}}>{renderInline(it)}</li>
          ))}
        </ul>
      );
      lista=[];
    }
  };

  for(let idx=0; idx<rivit.length; idx++){
    const t=rivit[idx].trim();
    if(!t){ purgeLista(idx); continue; }

    // ── Taulukko ──────────────────────────────────────────────
    if(onTaulukkoRivi(t)){
      purgeLista(idx);
      // Kerää kaikki peräkkäiset taulukkorivit
      const taulukkoRivit=[];
      let j=idx;
      while(j<rivit.length && onTaulukkoRivi(rivit[j].trim())){
        taulukkoRivit.push(rivit[j].trim());
        j++;
      }
      idx=j-1; // hyppää taulukon yli (for-silmukka kasvattaa vielä +1)

      // Ensimmäinen rivi = otsikko (ei näytetä rivilistassa), erotinrivi ohitetaan
      let dataAlku=1;
      if(taulukkoRivit[1] && onErotinRivi(taulukkoRivit[1])) dataAlku=2;
      const dataRivit=taulukkoRivit.slice(dataAlku).map(jaaSolut);

      // Onko tämä Kuukausikulut-osio? → kortit. Muuten → rivilista.
      const onKulut=/kuukausikul|kulut/i.test(viimeisinOtsikko);

      if(onKulut){
        // ── KORTIT ──────────────────────────────────────────────
        // Viimeinen rivi (esim. "Arvioitu yhteensä") korostetaan tummalla kortilla.
        elementit.push(
          <div key={"kortit-"+idx} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,margin:"8px 0 16px"}}>
            {dataRivit.map((rivi,ri)=>{
              const viimeinen=ri===dataRivit.length-1;
              const nimi=rivi[0]||"";
              const arvo=rivi.slice(1).filter(Boolean).join(" · ");
              if(viimeinen){
                return(
                  <div key={ri} style={{gridColumn:"1 / -1",background:C.goldDim,border:`1.5px solid ${C.gold}`,borderRadius:8,padding:"16px 18px"}}>
                    <div style={{fontFamily:B,fontSize:11,letterSpacing:1,textTransform:"uppercase",color:C.terra,marginBottom:6,fontWeight:600}}>{renderInline(nimi)}</div>
                    <div style={{fontFamily:H,fontSize:24,color:C.ink}}>{renderInline(arvo)}</div>
                  </div>
                );
              }
              return(
                <div key={ri} style={{background:C.cream,borderRadius:8,padding:"14px 16px"}}>
                  <div style={{fontFamily:B,fontSize:11,letterSpacing:1,textTransform:"uppercase",color:C.stone,marginBottom:6}}>{renderInline(nimi)}</div>
                  <div style={{fontFamily:H,fontSize:20,color:C.ink}}>{renderInline(arvo)}</div>
                </div>
              );
            })}
          </div>
        );
      } else {
        // ── RIVILISTA ───────────────────────────────────────────
        elementit.push(
          <div key={"taulu-"+idx} style={{background:C.cream,borderRadius:10,padding:"6px 16px",margin:"8px 0 16px"}}>
            {dataRivit.map((rivi,ri)=>{
              const viimeinen=ri===dataRivit.length-1;
              const nimi=rivi[0]||"";
              const arvo=rivi.slice(1).filter(Boolean).join(" · ");
              return(
                <div key={ri} style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:14,padding:"11px 0",borderBottom:viimeinen?"none":`1px solid ${C.linen}`}}>
                  <span style={{fontFamily:B,fontSize:13,color:C.stone,fontWeight:300,flexShrink:0}}>{renderInline(nimi)}</span>
                  <span style={{fontFamily:B,fontSize:13,color:C.ink,textAlign:"right"}}>{renderInline(arvo)}</span>
                </div>
              );
            })}
          </div>
        );
      }
      continue;
    }

    const h1=t.match(/^#\s+(.*)/);
    const h2=t.match(/^##\s+(.*)/);
    const h3=t.match(/^###\s+(.*)/);
    const bullet=t.match(/^[-*•]\s+(.*)/);
    if(h3||h2||h1){
      purgeLista(idx);
      const sisalto=h3?h3[1]:h2?h2[1]:h1[1];
      viimeisinOtsikko=sisalto;
      const koko=h1?24:h2?20:17;
      elementit.push(
        <div key={idx} style={{fontFamily:H,fontSize:koko,fontStyle:"italic",color:C.ink,margin:"20px 0 8px",lineHeight:1.25}}>{renderInline(sisalto)}</div>
      );
    } else if(bullet){
      lista.push(bullet[1]);
    } else {
      purgeLista(idx);
      elementit.push(
        <p key={idx} style={{fontFamily:B,fontSize:14,color:C.ink,lineHeight:1.75,marginBottom:12,fontWeight:300}}>{renderInline(t)}</p>
      );
    }
  }
  purgeLista("loppu");
  return <div>{elementit}</div>;
}

// ── Asuntoanalyysi: lataa taloyhtiön paperit (PDF), AI tekee Asuntoraportin ───
// Paperit lähetetään backendin /api/analyysi -endpointtiin (multipart, kenttä
// "tiedostot"). Mitään ei tallenneta — paperit luetaan muistissa ja heitetään
// heti pois. Tulos näkyy ruudulla selkokielisenä.
function TabTaloyhtion({nakokulma="ostaja",onArviokaynti}){
  const lang=useLang();
  const onMyyja=nakokulma==="myyja";
  const [files,setFiles]=useState([]);
  const [analyysi,setAnalyysi]=useState(null);
  const [malli,setMalli]=useState(null);
  const [skannatut,setSkannatut]=useState([]);
  const [error,setError]=useState(null);
  const [loading,setLoading]=useState(false);
  const [loadStep,setLoadStep]=useState(0);
  const [dragging,setDragging]=useState(false);

  const fmtKoko=b=>b>=1048576?`${(b/1048576).toFixed(1)} MB`:`${Math.round(b/1024)} kB`;

  function addFiles(fileList){
    const arr=Array.from(fileList||[]);
    if(arr.length===0)return;
    const pdfit=[];
    let virhe=null;
    for(const f of arr){
      const onPdf=f.type==="application/pdf"||f.name.toLowerCase().endsWith(".pdf");
      if(!onPdf){virhe=t(lang,"Vain PDF-tiedostot kelpaavat — muut jätettiin pois.","Only PDF files are accepted — others were left out.");continue;}
      if(f.size>15*1024*1024){virhe=t(lang,`"${f.name}" on liian suuri (yli 15 MB).`,`"${f.name}" is too large (over 15 MB).`);continue;}
      pdfit.push(f);
    }
    setFiles(prev=>{
      const avaimet=new Set(prev.map(f=>f.name+"|"+f.size));
      const uudet=pdfit.filter(f=>!avaimet.has(f.name+"|"+f.size));
      const yhd=[...prev,...uudet];
      if(yhd.length>10){virhe=t(lang,"Enintään 10 tiedostoa kerralla.","Up to 10 files at a time.");return yhd.slice(0,10);}
      return yhd;
    });
    setError(virhe);
  }

  function poistaFile(idx){
    setFiles(prev=>prev.filter((_,i)=>i!==idx));
  }

  function nollaa(){
    setFiles([]);setAnalyysi(null);setMalli(null);setSkannatut([]);setError(null);setLoadStep(0);
  }

  async function analysoi(){
    if(files.length===0){setError(t(lang,"Lataa vähintään yksi PDF-tiedosto.","Upload at least one PDF file."));return;}
    setError(null);setAnalyysi(null);setSkannatut([]);setMalli(null);setLoading(true);setLoadStep(1);
    const t1=setTimeout(()=>setLoadStep(2),1800);
    // Kun teksti alkaa virrata, siirrytään suoraan vaiheeseen 3 — ei tarvita t2-ajastinta.
    let ekaPala=true;
    try{
      const fd=new FormData();
      files.forEach(f=>fd.append("tiedostot",f));
      fd.append("kieli",lang); // välitä kieli backendille (analyysin kieli)
      fd.append("nakokulma",nakokulma); // ostaja tai myyja → eri raporttinäkökulma
      // HUOM: ei aseteta Content-Type-otsikkoa — selain lisää sen automaattisesti.
      const res=await fetch(`${BACKEND_URL}/api/analyysi`,{method:"POST",body:fd});

      // Jos backend palautti virheen ENNEN streamin alkua, se on tavallista JSONia.
      const ctype=res.headers.get("content-type")||"";
      if(!res.ok || ctype.includes("application/json")){
        const data=await res.json().catch(()=>({}));
        throw new Error(data.error||t(lang,`Analyysi epäonnistui (${res.status})`,`Analysis failed (${res.status})`));
      }

      // Striimaava NDJSON-vastaus: luetaan rivi riviltä.
      const reader=res.body.getReader();
      const decoder=new TextDecoder();
      let puskuri="";
      let kerätty="";
      while(true){
        const {done,value}=await reader.read();
        if(done) break;
        puskuri+=decoder.decode(value,{stream:true});
        let nl;
        while((nl=puskuri.indexOf("\n"))!==-1){
          const rivi=puskuri.slice(0,nl).trim();
          puskuri=puskuri.slice(nl+1);
          if(!rivi) continue;
          let evt;
          try{ evt=JSON.parse(rivi); }catch{ continue; }
          if(evt.tyyppi==="meta"){
            setMalli(evt.malli||null);
            setSkannatut(Array.isArray(evt.skannatut)?evt.skannatut:[]);
          }else if(evt.tyyppi==="teksti"){
            if(ekaPala){ ekaPala=false; clearTimeout(t1); setLoadStep(3); }
            kerätty+=evt.pala;
            setAnalyysi(kerätty); // päivittyy reaaliajassa → teksti ilmestyy ruudulle
          }else if(evt.tyyppi==="virhe"){
            throw new Error(evt.error||t(lang,"Analyysi keskeytyi.","Analysis was interrupted."));
          }else if(evt.tyyppi==="valmis"){
            // raportti valmis
          }
        }
      }
      if(!kerätty.trim()){
        throw new Error(t(lang,"Analyysi jäi tyhjäksi. Yritä uudelleen.","The analysis came back empty. Please try again."));
      }
    }catch(e){
      console.error("Analyysi-virhe:",e);
      setError(e.message||t(lang,"Yhteysvirhe. Tarkista verkkoyhteys ja yritä uudelleen.","Connection error. Check your network and try again."));
      setAnalyysi(null);
    }finally{
      clearTimeout(t1);
      setLoading(false);setLoadStep(0);
    }
  }

  const steps=t(lang,
    ["📄 Luetaan papereita...","🧠 Analysoidaan sisältöä...","📝 Kootaan Asuntoraporttia..."],
    ["📄 Reading the documents...","🧠 Analysing the content...","📝 Compiling your Property Report..."]);

  return(
    <div>
      <div style={{fontFamily:H,fontSize:28,fontStyle:"italic",color:C.ink,marginBottom:6}}>
        {onMyyja
          ? t(lang,"Myyntivalmius","Selling readiness")
          : t(lang,"Asuntoanalyysi","Property Analysis")}
      </div>
      <div style={{fontFamily:B,fontSize:13,color:C.stone,marginBottom:20,fontWeight:300}}>
        {onMyyja
          ? t(lang,
              "Lataa taloyhtiön paperit — näet miten asuntosi näyttäytyy ostajalle, mitä korostaa ja mihin varautua. (Ei hinta-arvio — sen saat arviokäynnillä.)",
              "Upload the housing company documents — see how your home looks to a buyer, what to highlight and what to prepare for. (Not a price estimate — you get that from the valuation visit.)")
          : t(lang,
              "Lataa taloyhtiön paperit (isännöitsijäntodistus, tilinpäätös, myyntiesite…) — saat selkokielisen Asuntoraportin",
              "Upload the housing company documents (manager's certificate, financial statements, sales brochure…) — get a plain-language Property Report")}
      </div>

      {/* Tietosuoja-lupaus */}
      <div style={{background:C.forestDim,border:`1px solid ${C.forest}30`,borderRadius:10,padding:"10px 14px",marginBottom:10,display:"flex",gap:8,alignItems:"flex-start"}}>
        <span style={{fontSize:13,flexShrink:0,marginTop:1}}>🔒</span>
        <div style={{fontFamily:B,fontSize:11,color:C.stone,lineHeight:1.55,fontWeight:300}}>
          <span style={{color:C.ink,fontWeight:500}}>{t(lang,"Papereita ei tallenneta.","Documents are not stored.")}</span> {t(lang,"Ne luetaan analyysiä varten ja heitetään heti pois — mitään ei jää talteen.","They are read for the analysis and discarded immediately — nothing is kept.")}
        </div>
      </div>

      {/* Vinkki: tärkeimmät paperit → nopeampi ja terävämpi analyysi */}
      <div style={{background:C.goldDim,border:`1px solid ${C.gold}40`,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",gap:8,alignItems:"flex-start"}}>
        <span style={{fontSize:13,flexShrink:0,marginTop:1}}>💡</span>
        <div style={{fontFamily:B,fontSize:11,color:C.stone,lineHeight:1.55,fontWeight:300}}>
          <span style={{color:C.ink,fontWeight:500}}>{t(lang,"Vinkki: lataa tärkeimmät paperit.","Tip: upload the key documents.")}</span> {t(lang,"Paras tulos saadaan yleensä isännöitsijäntodistuksesta, tilinpäätöksestä, yhtiöjärjestyksestä ja myyntiesitteestä (josta näkyy hinta). Mitä enemmän dokumentteja lataat, sitä kauemmin analyysi kestää — iso nippu voi viedä pari minuuttia. Voit ladata enintään 10 dokumenttia kerralla.","The best result usually comes from the property manager's certificate, financial statements, articles of association and the sales brochure (which shows the price). The more documents you upload, the longer the analysis takes — a large batch may take a couple of minutes. You can upload up to 10 documents at a time.")}
        </div>
      </div>

      {/* Latausalue */}
      <div
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)}
        onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files);}}
        onClick={()=>document.getElementById("asuntoanalyysi-pdf").click()}
        style={{border:`2px dashed ${dragging?C.clay:files.length?C.forest:C.border}`,borderRadius:14,padding:"28px 20px",textAlign:"center",cursor:"pointer",background:files.length?C.forestDim:dragging?C.clayDim:C.cream,transition:"all 0.2s",marginBottom:16}}>
        <input id="asuntoanalyysi-pdf" type="file" accept=".pdf" multiple style={{display:"none"}} onChange={e=>{addFiles(e.target.files);e.target.value="";}}/>
        <div style={{fontSize:32,marginBottom:10}}>{files.length?"✅":"📄"}</div>
        <div style={{fontFamily:H,fontSize:17,fontStyle:"italic",color:files.length?C.forest:C.ink,marginBottom:4}}>
          {files.length
            ? t(lang,`${files.length} tiedosto${files.length===1?"":"a"} valittu`,`${files.length} file${files.length===1?"":"s"} selected`)
            : t(lang,"Lataa taloyhtiön paperit","Upload the documents")}
        </div>
        <div style={{fontFamily:B,fontSize:12,color:C.stone,fontWeight:300}}>
          {files.length
            ? t(lang,"Klikkaa lisätäksesi tai vedä lisää PDF:iä","Click to add or drag more PDFs")
            : t(lang,"PDF-tiedostot · vedä tähän tai klikkaa · voit lisätä useita","PDF files · drag here or click · you can add several")}
        </div>
      </div>

      {/* Valitut tiedostot */}
      {files.length>0&&(
        <div style={{marginBottom:16}}>
          {files.map((f,i)=>(
            <div key={f.name+f.size} style={{display:"flex",alignItems:"center",gap:10,background:C.cream,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",marginBottom:8}}>
              <span style={{fontSize:16,flexShrink:0}}>📄</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:B,fontSize:13,color:C.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.name}</div>
                <div style={{fontFamily:B,fontSize:11,color:C.stone,fontWeight:300}}>{fmtKoko(f.size)}</div>
              </div>
              <button onClick={e=>{e.stopPropagation();poistaFile(i);}} style={{background:"none",border:"none",color:C.stone,fontSize:18,cursor:"pointer",lineHeight:1,flexShrink:0,padding:"0 4px"}} aria-label={t(lang,"Poista","Remove")}>×</button>
            </div>
          ))}
        </div>
      )}

      {error&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"12px 16px",color:"#B91C1C",fontFamily:B,fontSize:13,marginBottom:16}}>⚠ {error}</div>}

      {skannatut.length>0&&(
        <div style={{background:C.forestDim,border:`1px solid ${C.forest}30`,borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",gap:8,alignItems:"flex-start"}}>
          <span style={{fontSize:14,flexShrink:0,marginTop:1}}>🔍</span>
          <div style={{fontFamily:B,fontSize:12,color:C.ink,lineHeight:1.55,fontWeight:300}}>
            <span style={{fontWeight:500}}>{t(lang,"Nämä tiedostot olivat skannattuja, ja teksti luettiin kuvasta:","These files were scanned, and the text was read from the image:")}</span>
            <span style={{display:"block",marginTop:4,color:C.forest}}>{skannatut.join(", ")}</span>
            <span style={{display:"block",marginTop:6}}>{t(lang,"Skannatun dokumentin luku voi olla hieman epätarkempaa — tarkista tärkeät luvut alkuperäisistä papereista.","Reading a scanned document can be slightly less accurate — check important figures against the original documents.")}</span>
          </div>
        </div>
      )}

      <DarkBtn onClick={analysoi} style={{marginBottom:analyysi?28:0,opacity:loading?0.6:1,cursor:loading?"wait":"pointer"}} disabled={loading}>
        {loading?t(lang,"⏳ Analysoidaan...","⏳ Analysing..."):t(lang,"Analysoi →","Analyse →")}
      </DarkBtn>

      {/* Latausanimaatio — vain ennen kuin teksti alkaa virrata */}
      {loading&&!analyysi&&(
        <div style={{background:C.cream,border:`1px solid ${C.border}`,borderRadius:14,padding:"24px 20px",marginTop:16,marginBottom:16}}>
          {steps.map((s,i)=>(
            <div key={i} style={{fontFamily:B,fontSize:13,marginBottom:10,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:20,height:20,borderRadius:"50%",background:loadStep>i?C.forest:loadStep===i+1?C.clay:C.linen,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.3s"}}>
                {loadStep>i&&<span style={{color:"white",fontSize:10}}>✓</span>}
                {loadStep===i+1&&<span style={{fontSize:10}}>⏳</span>}
              </div>
              <span style={{color:loadStep>i?C.forest:loadStep===i+1?C.ink:C.stone,fontWeight:loadStep===i+1?500:300}}>{s}</span>
            </div>
          ))}
          <div style={{fontFamily:B,fontSize:11,color:C.stone,marginTop:6,fontWeight:300,fontStyle:"italic"}}>{t(lang,"Raportti alkaa ilmestyä hetken kuluttua.","The report will start appearing shortly.")}</div>
        </div>
      )}

      {/* Tulos: Asuntoraportti (näkyy heti kun teksti alkaa virrata) */}
      {analyysi&&(
        <div>
          <div style={{height:2,background:`linear-gradient(90deg,transparent,${C.gold},${C.clay},transparent)`,borderRadius:2}}/>
          <div style={{background:C.paper,border:`1px solid ${C.border}`,borderRadius:14,padding:"24px 22px",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <span style={{fontFamily:B,fontSize:10,letterSpacing:2,textTransform:"uppercase",color:C.clay,fontWeight:600}}>{onMyyja?t(lang,"Myyjän raportti","Seller's Report"):t(lang,"Asuntoraportti","Property Report")}</span>
              <div style={{height:1,flex:1,background:`linear-gradient(90deg,${C.linen},transparent)`}}/>
              {loading&&<span style={{fontFamily:B,fontSize:11,color:C.forest,fontWeight:500,fontStyle:"italic",flexShrink:0}}>{t(lang,"kirjoittaa…","writing…")}</span>}
            </div>
            <RaporttiText text={analyysi}/>
          </div>

          {/* Vastuuvapaus ja uusi analyysi -nappi vasta kun raportti on valmis */}
          {!loading&&(
            <>
              {/* Myyjälle: ohjaus arviokäyntiin (tästä liidi syntyy) */}
              {onMyyja&&(
                <div style={{background:C.forestDim,border:`1px solid ${C.forest}40`,borderRadius:12,padding:"18px 20px",marginBottom:16,textAlign:"center"}}>
                  <div style={{fontFamily:H,fontSize:19,fontStyle:"italic",color:C.ink,marginBottom:6}}>{t(lang,"Paljonko asunnostasi voi saada?","What could you get for your home?")}</div>
                  <div style={{fontFamily:B,fontSize:13,color:C.stone,fontWeight:300,lineHeight:1.6,marginBottom:14}}>{t(lang,"Tarkan, tämänhetkiseen markkinaan perustuvan hinta-arvion saat kun kokenut välittäjä käy katsomassa asuntosi paikan päällä — maksutta, ilman sitoumuksia.","Get an accurate price estimate based on the current market when an experienced agent visits your home in person — free of charge, no commitment.")}</div>
                  <button onClick={()=>{onArviokaynti&&onArviokaynti();window.scrollTo({top:0,behavior:"smooth"});}} style={{background:C.forest,color:"#FBF3E2",border:"none",padding:"13px 26px",fontFamily:B,fontSize:14,fontWeight:500,letterSpacing:0.5,cursor:"pointer",borderRadius:10}}>{t(lang,"Pyydä ilmainen arviokäynti →","Request a free valuation visit →")}</button>
                </div>
              )}

              <div style={{background:C.cream,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",gap:8,alignItems:"flex-start"}}>
                <span style={{fontSize:13,flexShrink:0,marginTop:1}}>ℹ️</span>
                <div style={{fontFamily:B,fontSize:11,color:C.stone,lineHeight:1.55,fontWeight:300}}>
                  {onMyyja
                    ? t(lang,
                        "Tämän raportin on koonnut tekoäly lataamistasi papereista auttaakseen sinua valmistautumaan myyntiin. Se ei sisällä hinta-arviota eikä korvaa välittäjän tai muun ammattilaisen henkilökohtaista neuvontaa. Varmista tärkeät tiedot alkuperäisistä asiakirjoista ja isännöitsijältä.",
                        "This report was compiled by AI from the documents you uploaded to help you prepare for selling. It does not include a price estimate and does not replace personal advice from an agent or other professional. Verify important details from the original documents and the property manager.")
                    : t(lang,
                        "Tämän raportin on koonnut tekoäly lataamistasi papereista, jotta ymmärrät olennaisen nopeasti ja selkokielellä. Lopullinen ja sitova tieto löytyy aina alkuperäisistä asiakirjoista ja isännöitsijältä — varmista tärkeät yksityiskohdat niistä ennen ostopäätöstä. Asuntoraportti on päätöksesi tukena, mutta ei korvaa juridista tai sijoitusneuvontaa.",
                        "This report was compiled by AI from the documents you uploaded, so you can grasp the essentials quickly and in plain language. The final and binding information is always in the original documents and from the property manager — verify important details from those before making a purchase decision. The Property Report supports your decision but does not replace legal or investment advice.")}
                </div>
              </div>

              <button onClick={nollaa} style={{width:"100%",background:"transparent",color:C.stone,border:`1px solid ${C.border}`,padding:"14px 0",fontFamily:B,fontSize:13,letterSpacing:1,cursor:"pointer",borderRadius:10}}>
                {t(lang,"Tee uusi analyysi","Start a new analysis")}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const OSTAJA_TABS=[
  {id:"taloyhtion",ikoni:"building",label:"Asuntoanalyysi",labelEn:"Property Analysis"},
  {id:"opas",ikoni:"compass",label:"Ostopolku",labelEn:"Buying Path"},
  {id:"sanasto",ikoni:"book",label:"Sanasto",labelEn:"Glossary"},
];
const MYYJA_TABS=[
  {id:"myyntivalmius",ikoni:"bulb",label:"Apua myyntiin",labelEn:"Help Selling"},
  {id:"konsultaatio",ikoni:"home",label:"Ilmainen arviokäynti",labelEn:"Free Valuation Visit"},
  {id:"lisapalvelut",ikoni:"sparkles",label:"Lisäpalvelut",labelEn:"Extra Services"},
  {id:"kulut",ikoni:"coins",label:"Myyntikulut",labelEn:"Selling Costs"},
  {id:"sanasto",ikoni:"book",label:"Sanasto",labelEn:"Glossary"},
];

// Lukee nykyisen tilan URL-hashista, esim. "#ostaja/hinta"
function lueHash(){
  const h=(typeof window!=="undefined"?window.location.hash:"").replace(/^#/,"");
  if(!h) return {mode:null,tab:null};
  const osat=h.split("/");
  const m=osat[0]||null;
  const t=osat[1]||null;
  if(m!=="ostaja"&&m!=="myyjä"&&m!=="myyja") return {mode:null,tab:null};
  // "myyja" (ilman ä) sallitaan URL:ssa, muunnetaan sisäiseksi "myyjä"
  const moded=(m==="myyja")?"myyjä":m;
  return {mode:moded,tab:t};
}

export default function App(){
  const init=lueHash();
  const lang=useLang();
  const [mode,setMode]=useState(init.mode);
  const [tab,setTab]=useState(init.tab||"opas");
  const isDesktop=useIsDesktop(900);
  const ekaAjo=useRef(true);

  // Päivitä URL-hash kun mode/tab muuttuu (jotta selaimen historia tallentaa tilan)
  useEffect(()=>{
    if(typeof window==="undefined") return;
    let uusi;
    if(!mode){ uusi=window.location.pathname; }
    else {
      const mUrl=(mode==="myyjä")?"myyja":mode; // ä pois URL:sta
      uusi=`#${mUrl}/${tab}`;
    }
    if(ekaAjo.current){
      // Ensimmäinen lataus: korvaa nykyinen merkintä (ei lisää historiaa,
      // jotta selaimen takaisin palaa edelliselle sivustolle vasta lopuksi)
      ekaAjo.current=false;
      const nyt=window.location.hash||window.location.pathname;
      if(nyt!==uusi) window.history.replaceState(null,"",uusi);
      return;
    }
    // Käyttäjän toiminta: lisää uusi historiamerkintä → takaisin-nuoli toimii
    if((window.location.hash||window.location.pathname)!==uusi){
      window.history.pushState(null,"",uusi);
    }
  },[mode,tab]);

  // Kuuntele selaimen taakse/eteen-nuolia (popstate)
  useEffect(()=>{
    if(typeof window==="undefined") return;
    const kasittele=()=>{
      const s=lueHash();
      setMode(s.mode);
      setTab(s.tab||"opas");
    };
    window.addEventListener("popstate",kasittele);
    return()=>window.removeEventListener("popstate",kasittele);
  },[]);

  // Saumaton mobiilitausta:
  // - Etusivulla: body saa LINEAR-GRADIENTIN joka matchaa heron yläreuna (#2A1F14) ja alareuna (#1E3020)
  //   → tilapalkki tumma, osoiterivi vihreänsävyinen, molemmat saumattomia heron kanssa.
  // - Välilehdellä: body on TUMMA (matchaa heron yläreuna). Alaosaan on erillinen fixed kermainen täyttäjä (footer).
  useEffect(()=>{
    if(typeof window==="undefined") return;
    const vari = mode
      ? "#2A1F14"
      : "linear-gradient(180deg,#2A1F14 0%,#3E2D1A 40%,#1E3020 100%)";
    document.body.style.background = vari;
    const root=document.getElementById("root");
    if(root) root.style.background = vari;
  },[mode]);

  if(!mode){
    return(
      <div style={{background:"#2A1F14",minHeight:"100vh",fontFamily:B}}>
        <style>{GLOBAL}</style>
        <div style={{position:"relative",overflow:"hidden",background:"linear-gradient(165deg,#2A1F14 0%,#3E2D1A 40%,#1E3020 100%)",padding:"calc(52px + env(safe-area-inset-top)) 28px calc(60px + env(safe-area-inset-bottom))",minHeight:"100vh",minHeight:"100dvh",display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center"}}>
          <div style={{position:"absolute",top:-80,right:-80,width:300,height:300,borderRadius:"50%",border:"1px solid rgba(201,168,76,0.1)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",bottom:-80,left:-80,width:240,height:240,borderRadius:"50%",border:"1px solid rgba(201,168,76,0.07)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",top:"calc(20px + env(safe-area-inset-top))",right:24}}><LangToggle dark/></div>
          <div style={{width:"100%",maxWidth:isDesktop?620:420,display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:48}}>
            <img src="/Asuntoraportti_Logo_256.png" alt="Asuntoraportti" width="80" height="80" style={{marginBottom:10,objectFit:"contain"}}/>
            <span style={{fontFamily:H,fontSize:18,color:"rgba(251,243,226,0.85)",letterSpacing:4,fontStyle:"italic",fontWeight:500}}>Asuntoraportti</span>
          </div>
          <div style={{fontFamily:B,fontSize:11,letterSpacing:3,textTransform:"uppercase",color:C.gold,marginBottom:16,fontWeight:500}}>{t(lang,"Tervetuloa","Welcome")}</div>
          <h1 style={{fontFamily:H,fontSize:isDesktop?52:44,fontWeight:500,color:"#FBF3E2",lineHeight:1.1,marginBottom:16,letterSpacing:-0.5}}>
            {t(lang,<>Asuntokaupan<br/><em style={{color:C.gold}}>paras apuri.</em></>,<>Your best companion<br/><em style={{color:C.gold}}>in home buying.</em></>)}
          </h1>
          <p style={{fontFamily:B,fontSize:isDesktop?16:14,color:"rgba(251,243,226,0.5)",lineHeight:1.8,maxWidth:isDesktop?460:340,fontWeight:300,marginBottom:52}}>
            {t(lang,
              "Lataa taloyhtiön paperit ja saat selkokielisen analyysin — tai pyydä apua asuntosi myyntiin. Selkeää tukea asuntokaupan molemmille puolille.",
              "Upload the housing company documents and get a plain-language analysis — or get help selling your home. Clear support for both sides of the deal.")}
          </p>
          <div style={{fontFamily:B,fontSize:12,letterSpacing:2,textTransform:"uppercase",color:"rgba(201,168,76,0.6)",marginBottom:20,fontWeight:500}}>{t(lang,"Olen…","I am…")}</div>
          <div style={{display:"grid",gap:16,width:"100%",gridTemplateColumns:isDesktop?"1fr 1fr":"1fr"}}>
            {[
              {m:"ostaja",t:t(lang,"Asunnon ostaja","Home buyer"),d:t(lang,"Asuntoanalyysi papereista, ostopolku ja sanasto","Property analysis from documents, buying path and glossary")},
              {m:"myyjä",t:t(lang,"Asunnon myyjä","Home seller"),d:t(lang,"Ilmainen arviokäynti, myyntikululaskin ja sanasto","Free valuation visit, selling cost calculator and glossary")},
            ].map(opt=>(
              <button key={opt.m} onClick={()=>{setMode(opt.m);setTab(opt.m==="ostaja"?"taloyhtion":"myyntivalmius");}}
                style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(201,168,76,0.2)",borderRadius:16,padding:"22px 24px",cursor:"pointer",textAlign:"left",transition:"all 0.2s",display:"flex",alignItems:"center",gap:18}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(201,168,76,0.1)";e.currentTarget.style.borderColor="rgba(201,168,76,0.4)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";e.currentTarget.style.borderColor="rgba(201,168,76,0.2)";}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:"rgba(201,168,76,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>
                  {opt.m==="ostaja"
                    ? <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V10.5"/><path d="M19 10.5V21"/><path d="M3 11.2 12 4l9 7.2"/><path d="M5 21h14"/><rect x="10" y="14.5" width="4" height="6.5"/><path d="M16 7.5V5h1.8v3.9"/></svg>
                    : <Ikoni nimi="key" size={30} color={C.gold} style={{strokeWidth:1.3}}/>}
                </div>
                <div>
                  <div style={{fontFamily:H,fontSize:22,fontStyle:"italic",color:"#FBF3E2",marginBottom:4}}>{opt.t}</div>
                  <div style={{fontFamily:B,fontSize:13,color:"rgba(251,243,226,0.45)",fontWeight:300,lineHeight:1.5}}>{opt.d}</div>
                </div>
                <div style={{marginLeft:"auto",color:C.gold,fontSize:20,flexShrink:0}}>→</div>
              </button>
            ))}
          </div>
          </div>
          {/* Footer myös etusivulla — luottamus + saavutettavuus */}
          <div style={{width:"100%",maxWidth:isDesktop?620:420,marginTop:56,paddingTop:24,borderTop:"1px solid rgba(201,168,76,0.15)",textAlign:"center"}}>
            <div style={{fontFamily:H,fontSize:15,fontStyle:"italic",color:"rgba(251,243,226,0.85)",marginBottom:5}}>Asuntoraportti</div>
            <div style={{fontFamily:B,fontSize:11,color:"rgba(251,243,226,0.4)",letterSpacing:0.5,marginBottom:12}}>© 2026 Miss S Tmi — {t(lang,"Asuntokaupan paras apuri","Your best companion in home buying")}</div>
            <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:12,flexWrap:"wrap"}}>
              <a href="/tietoja.html" target="_blank" rel="noopener" style={{fontFamily:B,fontSize:11,color:"rgba(251,243,226,0.55)",letterSpacing:0.3,textDecoration:"underline"}}>{t(lang,"Tietoja meistä","About us")}</a>
              <span style={{color:"rgba(251,243,226,0.3)",fontSize:9}}>•</span>
              <a href="/tietosuojaseloste.html" target="_blank" rel="noopener" style={{fontFamily:B,fontSize:11,color:"rgba(251,243,226,0.55)",letterSpacing:0.3,textDecoration:"underline"}}>{t(lang,"Tietosuojaseloste","Privacy policy")}</a>
              <span style={{color:"rgba(251,243,226,0.3)",fontSize:9}}>•</span>
              <a href="/kayttoehdot.html" target="_blank" rel="noopener" style={{fontFamily:B,fontSize:11,color:"rgba(251,243,226,0.55)",letterSpacing:0.3,textDecoration:"underline"}}>{t(lang,"Käyttöehdot","Terms of use")}</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs=mode==="ostaja"?OSTAJA_TABS:MYYJA_TABS;
  // Varmista että tab on validi tälle modelle (esim. suora hash-linkki voi tuoda väärän)
  const validiTab=tabs.some(t=>t.id===tab)?tab:tabs[0].id;
  // Leveä layout vain tietyilla välilehdilla joissa on hyötyä kahdesta palstasta
  const isWide=isDesktop&&(validiTab==="hinta"||validiTab==="taloyhtion"||validiTab==="ilmoitus"||validiTab==="myyntivalmius");

  return(
    <div style={{background:C.paper,minHeight:"100vh",fontFamily:B}}>
      <style>{GLOBAL}</style>

      {/* Fixed kermainen alapalkki-täyttäjä: peittää iOS Safarin osoiterivin alueen (safe-area-bottom) kermaisella, jotta footer jatkuu saumattomasti */}
      <div aria-hidden="true" style={{position:"fixed",bottom:0,left:0,right:0,height:"env(safe-area-inset-bottom)",background:C.paper,zIndex:1000,pointerEvents:"none"}}/>

      <div style={{position:"relative",overflow:"hidden",background:"linear-gradient(165deg,#2A1F14 0%,#3E2D1A 40%,#1E3020 100%)",padding:"calc(36px + env(safe-area-inset-top)) 24px 44px"}}>
        <div style={{position:"absolute",top:-60,right:-60,width:220,height:220,borderRadius:"50%",border:"1px solid rgba(201,168,76,0.1)",pointerEvents:"none"}}/>
        <div style={{maxWidth:1080,margin:"0 auto",width:"100%"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <button onClick={()=>setMode(null)} style={{background:"rgba(255,255,255,0.08)",border:"none",color:"rgba(251,243,226,0.5)",fontFamily:B,fontSize:11,letterSpacing:1,padding:"6px 14px",borderRadius:20,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:6}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V10.5"/><path d="M19 10.5V21"/><path d="M3 11.2 12 4l9 7.2"/><path d="M5 21h14"/><rect x="10" y="14.5" width="4" height="6.5"/><path d="M16 7.5V5h1.8v3.9"/></svg>
            {t(lang,"Etusivu","Home")}
          </button>
          <LangToggle dark/>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:24}}>
          <button onClick={()=>setMode(null)} title={t(lang,"Etusivulle","To home")} style={{background:"none",border:"none",padding:0,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center"}}>
            <img src="/Asuntoraportti_Logo_256.png" alt="Asuntoraportti" width="72" height="72" style={{objectFit:"contain",marginBottom:8}}/>
            <span style={{fontFamily:H,fontSize:24,color:"rgba(251,243,226,0.85)",letterSpacing:3,fontStyle:"italic"}}>Asuntoraportti</span>
          </button>
        </div>
        <div style={{display:"flex",justifyContent:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:mode==="ostaja"?"rgba(62,92,63,0.25)":"rgba(181,105,60,0.25)",border:`1px solid ${mode==="ostaja"?"rgba(62,92,63,0.5)":"rgba(181,105,60,0.5)"}`,borderRadius:20,padding:"5px 14px",marginBottom:14}}>
          {mode==="ostaja"
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V10.5"/><path d="M19 10.5V21"/><path d="M3 11.2 12 4l9 7.2"/><path d="M5 21h14"/><rect x="10" y="14.5" width="4" height="6.5"/><path d="M16 7.5V5h1.8v3.9"/></svg>
            : <span style={{fontSize:14}}>🔑</span>}
          <span style={{fontFamily:B,fontSize:12,color:mode==="ostaja"?"#A8D5B5":"#E8B08A",fontWeight:500,letterSpacing:1}}>{mode==="ostaja"?t(lang,"OSTAJA","BUYER"):t(lang,"MYYJÄ","SELLER")}</span>
        </div>
        </div>
        <h1 style={{fontFamily:H,fontSize:34,fontWeight:500,color:"#FBF3E2",lineHeight:1.1,letterSpacing:-0.5,textAlign:"center"}}>
          {mode==="ostaja"?t(lang,"Löydä unelmiesi","Find your dream"):t(lang,"Myy asuntosi","Sell your home")}
          <br/><em style={{color:C.gold}}>{mode==="ostaja"?t(lang,"koti.","home."):t(lang,"parhaaseen hintaan.","at the best price.")}</em>
        </h1>
        </div>
      </div>

      <div style={{background:C.cream,borderBottom:`1px solid ${C.border}`,padding:"14px 16px",overflowX:"auto"}}>
        <div style={{display:"flex",gap:8,minWidth:"max-content",maxWidth:1080,margin:"0 auto"}}>
          {tabs.map(tabi=>(
            <Pill key={tabi.id} active={validiTab===tabi.id} onClick={()=>setTab(tabi.id)}>
              <span style={{display:"inline-flex",alignItems:"center",gap:7}}>
                {tabi.ikoni&&<Ikoni nimi={tabi.ikoni} size={15} color={validiTab===tabi.id?C.gold:C.stone}/>}
                {lang==="en"&&tabi.labelEn?tabi.labelEn:tabi.label}
              </span>
            </Pill>
          ))}
        </div>
      </div>

      <div style={{maxWidth:isWide?1080:560,margin:"0 auto",padding:isWide?"40px 24px 80px":"32px 20px 80px"}}>
        {mode==="ostaja"&&validiTab==="opas"&&<TabOstopolku/>}
        {mode==="ostaja"&&validiTab==="ilmoitus"&&<TabIlmoitus/>}
        {mode==="myyjä"&&validiTab==="hinta"&&<TabHintaArvio mode={mode} isDesktop={isDesktop}/>}
        {mode==="myyjä"&&validiTab==="kulut"&&<TabMyyntikulut/>}
        {mode==="myyjä"&&validiTab==="konsultaatio"&&<TabKonsultaatio/>}
        {mode==="myyjä"&&validiTab==="lisapalvelut"&&<TabLisapalvelut/>}
        {mode==="ostaja"&&validiTab==="taloyhtion"&&<TabTaloyhtion/>}
        {mode==="myyjä"&&validiTab==="myyntivalmius"&&<TabMyyntiopas onArviokaynti={()=>setTab("konsultaatio")}/>}
        {validiTab==="tarkistus"&&<TabTarkistus mode={mode}/>}
        {validiTab==="sanasto"&&<TabSanasto/>}
      </div>

      <div style={{background:C.paper,borderTop:`1px solid ${C.border}`,padding:"24px 24px calc(24px + env(safe-area-inset-bottom))",textAlign:"center"}}>
        <div style={{fontFamily:H,fontSize:14,fontStyle:"italic",color:C.stone,marginBottom:4}}>Asuntoraportti</div>
        <div style={{fontFamily:B,fontSize:11,color:C.linen,letterSpacing:1,marginBottom:10}}>© 2026 Miss S Tmi — {t(lang,"Asuntokaupan paras apuri","Your best companion in home buying")}</div>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:14,flexWrap:"wrap"}}>
          <a href="/tietoja.html" target="_blank" rel="noopener" style={{fontFamily:B,fontSize:11,color:C.stone,letterSpacing:0.5,textDecoration:"underline"}}>{t(lang,"Tietoja meistä","About us")}</a>
          <span style={{color:C.linen,fontSize:9}}>•</span>
          <a href="/tietosuojaseloste.html" target="_blank" rel="noopener" style={{fontFamily:B,fontSize:11,color:C.stone,letterSpacing:0.5,textDecoration:"underline"}}>{t(lang,"Tietosuojaseloste","Privacy policy")}</a>
          <span style={{color:C.linen,fontSize:9}}>•</span>
          <a href="/kayttoehdot.html" target="_blank" rel="noopener" style={{fontFamily:B,fontSize:11,color:C.stone,letterSpacing:0.5,textDecoration:"underline"}}>{t(lang,"Käyttöehdot","Terms of use")}</a>
        </div>
      </div>
    </div>
  );
}
