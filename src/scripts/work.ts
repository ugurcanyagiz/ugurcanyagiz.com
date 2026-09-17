type ArRow = { period:string; customer:string; region:string; current:number; mid:number; late:number; critical:number };

const root = document.querySelector<HTMLElement>("[data-work]");
if (root) {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = root.querySelectorAll<HTMLElement>("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) reveals.forEach(el => el.classList.add("is-visible"));
  else {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }), { threshold:.09, rootMargin:"0px 0px -7%" });
    reveals.forEach(el => observer.observe(el));
  }

  const filter = root.querySelector<HTMLSelectElement>("[data-sheet-filter]");
  const sheetRows = [...root.querySelectorAll<HTMLTableRowElement>("[data-sheet-row]")];
  const sheetTotal = root.querySelector<HTMLElement>("[data-sheet-total]");
  const updateSheet = () => {
    const wanted = filter?.value || "all";
    let total = 0;
    sheetRows.forEach(row => {
      const visible = wanted === "all" || row.dataset.status === wanted;
      row.hidden = !visible;
      if (visible) total += Number(row.cells[2].textContent?.replace(/[$,]/g,""));
    });
    if (sheetTotal) sheetTotal.textContent = `$${total.toLocaleString()}`;
  };
  filter?.addEventListener("change", updateSheet);

  const reconcile = root.querySelector<HTMLElement>("[data-reconcile]");
  const reconcileButton = root.querySelector<HTMLButtonElement>("[data-reconcile-button]");
  reconcileButton?.addEventListener("click", () => {
    const done = reconcile?.classList.toggle("is-reconciled") || false;
    const difference = root.querySelector<HTMLElement>("[data-difference]");
    const final = root.querySelector<HTMLElement>("[data-final]");
    const live = root.querySelector<HTMLElement>("[data-reconcile-live]");
    if (difference) difference.textContent = done ? "$0" : "$2,500";
    if (final) final.textContent = done ? "$428,750" : "Pending";
    reconcileButton.textContent = done ? "Reset demonstration" : "Apply reconciling item";
    if (live) live.textContent = done ? "Reconciliation complete. Final reconciled balance is $428,750." : "Reconciliation reset with an outstanding difference of $2,500.";
  });

  const arData:ArRow[] = [
    ["Q1","Northstar","North",142,42,18,8],["Q1","Harbor","West",78,31,22,14],["Q1","Meridian","East",116,38,19,11],["Q1","Atlas","South",94,26,14,9],
    ["Q2","Northstar","North",128,48,26,12],["Q2","Harbor","West",68,35,28,19],["Q2","Meridian","East",109,29,21,13],["Q2","Atlas","South",86,24,17,11],
    ["Q3","Northstar","North",151,37,22,10],["Q3","Harbor","West",61,41,31,21],["Q3","Meridian","East",124,34,18,9],["Q3","Atlas","South",73,29,21,14],
    ["Q4","Northstar","North",166,39,19,7],["Q4","Harbor","West",55,44,36,24],["Q4","Meridian","East",139,31,15,8],["Q4","Atlas","South",81,28,16,11],
  ].map(([period,customer,region,current,mid,late,critical]) => ({period:String(period),customer:String(customer),region:String(region),current:Number(current),mid:Number(mid),late:Number(late),critical:Number(critical)}));
  const arFilters = [...root.querySelectorAll<HTMLSelectElement>("[data-ar-filter]")];
  const money = (value:number) => value >= 1000 ? `$${(value/1000).toFixed(2)}M` : `$${Math.round(value)}K`;
  const updateDashboard = () => {
    const selected = Object.fromEntries(arFilters.map(el => [el.dataset.arFilter, el.value]));
    const rows = arData.filter(row => Object.entries(selected).every(([key,value]) => value === "all" || row[key as keyof ArRow] === value));
    const sums = {current:0,mid:0,late:0,critical:0};
    rows.forEach(row => Object.keys(sums).forEach(key => sums[key as keyof typeof sums] += row[key as keyof typeof sums]));
    const total = Object.values(sums).reduce((a,b) => a+b,0);
    const set = (key:string,value:string) => { const el=root.querySelector<HTMLElement>(`[data-ar-kpi="${key}"]`); if(el) el.textContent=value; };
    set("total",money(total)); Object.entries(sums).forEach(([key,value]) => set(key,money(value)));
    const count = root.querySelector<HTMLElement>("[data-record-count]"); if(count) count.textContent=`${rows.length} account${rows.length===1?"":"s"}`;
    const bars = root.querySelector<HTMLElement>("[data-aging-bars]");
    if (bars) bars.innerHTML = Object.entries(sums).map(([key,value]) => `<div><span>${({current:"Current",mid:"30–60",late:"60–90",critical:"90+"} as Record<string,string>)[key]}</span><i style="--value:${total ? Math.max(4,value/total*100):0}%"></i><b>${money(value)}</b></div>`).join("");
    const customers = new Map<string,number>(); rows.forEach(row => customers.set(row.customer,(customers.get(row.customer)||0)+row.current+row.mid+row.late+row.critical));
    const colors=["#88c9b8","#d6ad63","#698ab0","#b7786f"];
    const entries=[...customers.entries()].sort((a,b)=>b[1]-a[1]);
    const donut=root.querySelector<HTMLElement>("[data-donut]");
    if(donut){ let at=0; const stops=entries.map(([_,v],i)=>{const start=at;at+=total?v/total*100:0;return `${colors[i]} ${start}% ${at}%`;}); donut.style.background=stops.length?`conic-gradient(${stops.join(",")})`:`#27332f`; }
    const center=root.querySelector<HTMLElement>("[data-donut-center]"); if(center) center.textContent=String(entries.length);
    const exposure=root.querySelector<HTMLElement>("[data-exposure]"); if(exposure) exposure.innerHTML=entries.map(([name,value],i)=>`<li><i style="background:${colors[i]}"></i><span>${name}</span><b>${total?Math.round(value/total*100):0}%</b></li>`).join("");
    const factors=[.62,.71,.68,.81,.78,.92]; const points=factors.map((f,i)=>[10+i*120,115-f*85*(.85+Math.min(rows.length,16)/100)]); const line=points.map((p,i)=>`${i?"L":"M"}${p[0]} ${p[1]}`).join(" ");
    const trend=root.querySelector<SVGPathElement>("[data-collection-line]"); if(trend) trend.setAttribute("d",line);
    const area=root.querySelector<SVGPathElement>("[data-collection-area]"); if(area) area.setAttribute("d",`${line} L610 120 L10 120Z`);
  };
  arFilters.forEach(filter => filter.addEventListener("change",updateDashboard)); updateDashboard();
}
