// TFB Responsive Shell — shared primitives
// Loaded as: <script type="text/babel" src="tfb-responsive.jsx"></script>
// Exposes globals: useBreakpoint, useIsMobile, useIsTablet, useIsDesktop, useDensity,
// MobileDrawer, MobileTopBar, MobileBottomTabs, TFB_NAV, TFB_BP

(function(){
  // ── Breakpoints ─────────────────────────────────────────────────────────
  window.TFB_BP = { mobile: 640, tablet: 1024 };
  
  function getBreakpoint(){
    const w = window.innerWidth;
    if (w < 640) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  }
  
  function applyBreakpointClass(){
    const bp = getBreakpoint();
    document.body.classList.remove('is-mobile','is-tablet','is-desktop');
    document.body.classList.add('is-' + bp);
    document.body.dataset.breakpoint = bp;
  }
  applyBreakpointClass();
  let _resizeT;
  window.addEventListener('resize', ()=>{ clearTimeout(_resizeT); _resizeT=setTimeout(applyBreakpointClass, 60); });
  
  // ── React hook ──────────────────────────────────────────────────────────
  window.useBreakpoint = function(){
    const [bp, setBp] = React.useState(getBreakpoint());
    React.useEffect(()=>{
      const onR = ()=> setBp(getBreakpoint());
      window.addEventListener('resize', onR);
      return ()=> window.removeEventListener('resize', onR);
    }, []);
    return bp;
  };
  
  window.useIsMobile  = () => window.useBreakpoint() === 'mobile';
  window.useIsTablet  = () => window.useBreakpoint() === 'tablet';
  window.useIsDesktop = () => window.useBreakpoint() === 'desktop';
  
  // ── Density mode ────────────────────────────────────────────────────────
  window.useDensity = function(){
    const get = ()=> { try{ return localStorage.getItem('tfb_density')||'standard'; }catch(e){ return 'standard'; } };
    const [d, setD] = React.useState(get());
    React.useEffect(()=>{
      const onS = ()=> setD(get());
      window.addEventListener('storage', onS);
      return ()=> window.removeEventListener('storage', onS);
    }, []);
    return d;
  };
  
  // ── Nav menu used by hamburger drawer ───────────────────────────────────
  window.TFB_NAV = [
    {section:'Coaching', items:[
      {l:'Dashboard', h:'tfb-dashboard.html', i:'M3 12L12 3l9 9M5 10v10h14V10'},
      {l:'Sessions', h:'tfb-sessions.html', i:'M9 5l-5 5 5 5M15 5l5 5-5 5'},
      {l:'Session Builder', h:'tfb-session-builder.html', i:'M12 5v14M5 12h14'},
      {l:'Block Planner', h:'tfb-planner.html', i:'M3 4h18v4H3zM3 11h18v4H3zM3 18h12v3H3z'},
      {l:'Yearly Overview', h:'tfb-yearly.html', i:'M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z'},
      {l:'Gameday', h:'tfb-gameday.html', i:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 2v20M2 12h20'},
      {l:'Coaching Plan', h:'tfb-coaching.html', i:'M2 3h20M2 21h20M5 3v18M19 3v18'},
    ]},
    {section:'Team', items:[
      {l:'Team Management', h:'tfb-team.html', i:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'},
      {l:'Player Profile', h:'tfb-player.html', i:'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'},
      {l:'Development', h:'tfb-development.html', i:'M22 12h-4l-3 9L9 3l-3 9H2'},
      {l:'Wellness', h:'tfb-wellness.html', i:'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'},
      {l:'Comparison', h:'tfb-comparison.html', i:'M3 3v18h18M7 14l4-4 4 4 6-6'},
    ]},
    {section:'Match', items:[
      {l:'Fixtures', h:'tfb-fixtures.html', i:'M3 4h18v18H3zM3 10h18M8 2v4M16 2v4'},
      {l:'League', h:'tfb-league.html', i:'M6 9V2h12v7M6 9a6 6 0 0 0 12 0M12 15v7M9 22h6'},
      {l:'Availability', h:'tfb-availability.html', i:'M8 2v4M16 2v4M3 8h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM9 14l2 2 4-4'},
      {l:'RSVP', h:'tfb-rsvp.html', i:'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3'},
    ]},
    {section:'Comms', items:[
      {l:'Team Chat', h:'tfb-chat.html', i:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'},
      {l:'Club Overview', h:'tfb-overview.html', i:'M2 20h20M4 20V8l8-6 8 6v12M9 20V12h6v8'},
    ]},
    {section:'Account', items:[
      {l:'Billing', h:'tfb-billing.html', i:'M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM4 10h16'},
      {l:'Settings', h:'tfb-settings.html', i:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'},
      {l:'All Screens', h:'tfb-nav.html', i:'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z'},
    ]},
  ];
  
  // ── Mobile drawer component ─────────────────────────────────────────────
  // Usage: <MobileDrawer open={state} onClose={fn} currentPath="tfb-dashboard.html" />
  window.MobileDrawer = function MobileDrawer({open, onClose, currentPath, role='Coach', user}){
    const C = {lime:'#B6FF2B', green:'#0F3D2E', greenDark:'#0A2E20', s1:'#1C2128', s2:'#242B33', txt:'#F0F2F4', txt2:'rgba(240,242,244,0.55)', txt3:'rgba(240,242,244,0.32)', border:'rgba(255,255,255,0.07)', border2:'rgba(255,255,255,0.13)', red:'#E5533D'};
    
    React.useEffect(()=>{
      if (open) document.body.style.overflow = 'hidden';
      else document.body.style.overflow = '';
      return ()=> { document.body.style.overflow = ''; };
    }, [open]);
    
    if (!open) return null;
    
    return (
      <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',zIndex:1000,animation:'tfb-fade-in .2s ease'}}>
        <div onClick={e=>e.stopPropagation()} style={{position:'absolute',left:0,top:0,bottom:0,width:'min(82vw, 320px)',background:C.s1,borderRight:`1px solid ${C.border2}`,display:'flex',flexDirection:'column',animation:'tfb-slide-in .25s ease',boxShadow:'8px 0 32px rgba(0,0,0,0.4)'}}>
          {/* Header */}
          <div style={{padding:'14px 16px',background:`linear-gradient(135deg,${C.greenDark},${C.green})`,borderBottom:`1px solid rgba(182,255,43,0.18)`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none"><polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#0F3D2E" stroke="#B6FF2B" strokeWidth="1.5"/><text x="20" y="26" textAnchor="middle" fill="#B6FF2B" fontFamily="Barlow Condensed" fontWeight="900" fontSize="13">TFB</text></svg>
              <div>
                <div style={{fontFamily:'Barlow Condensed,sans-serif',fontWeight:900,fontSize:16,color:'#fff',letterSpacing:'0.04em',lineHeight:1}}>TFB</div>
                <div style={{fontSize:9.5,color:'rgba(182,255,43,0.65)',fontWeight:700,letterSpacing:'0.1em'}}>Football Blueprint</div>
              </div>
            </div>
            <button onClick={onClose} style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'#fff',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
          </div>
          
          {/* User */}
          {user && (
            <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:`linear-gradient(135deg,${C.lime},#68B42E)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:900,color:C.green,fontFamily:'Barlow Condensed,sans-serif',flexShrink:0}}>{user.initials||'??'}</div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:C.txt,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user.full||user.name||'User'}</div>
                <div style={{fontSize:10.5,color:C.lime,fontWeight:700,letterSpacing:'0.04em',textTransform:'uppercase'}}>{role}</div>
              </div>
            </div>
          )}
          
          {/* Nav */}
          <div style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
            {window.TFB_NAV.map(sec=>(
              <div key={sec.section} style={{marginBottom:6}}>
                <div style={{fontSize:9.5,fontWeight:800,color:C.txt3,textTransform:'uppercase',letterSpacing:'0.12em',padding:'10px 16px 4px'}}>{sec.section}</div>
                {sec.items.map(it=>{
                  const active = currentPath === it.h;
                  return (
                    <a key={it.h} href={it.h} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 16px',color:active?C.lime:C.txt,fontSize:14,fontWeight:active?700:500,textDecoration:'none',background:active?'rgba(182,255,43,0.08)':'transparent',borderLeft:`3px solid ${active?C.lime:'transparent'}`,minHeight:44}}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,opacity:active?1:0.7}}><path d={it.i}/></svg>
                      {it.l}
                    </a>
                  );
                })}
              </div>
            ))}
          </div>
          
          {/* Footer */}
          <div style={{padding:'12px 16px',borderTop:`1px solid ${C.border}`,display:'flex',gap:8}}>
            <a href="tfb-login.html" style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px',background:'transparent',border:`1px solid ${C.border2}`,borderRadius:8,color:C.red,fontSize:12,fontWeight:700,textDecoration:'none'}}>Sign Out</a>
          </div>
        </div>
      </div>
    );
  };
  
  // ── Mobile-friendly top bar with hamburger ─────────────────────────────
  // Usage: <MobileTopBar title="Settings" subtitle="..." onMenu={fn} right={<button.../>} />
  window.MobileTopBar = function MobileTopBar({title, subtitle, onMenu, right, accent='#B6FF2B', back}){
    return (
      <header style={{height:54,background:`linear-gradient(90deg,#0A2E20,#0F3D2E)`,borderBottom:'1px solid rgba(182,255,43,0.18)',display:'flex',alignItems:'center',padding:'0 12px',gap:10,flexShrink:0,zIndex:50}}>
        {back ? (
          <button onClick={back} style={{width:40,height:40,borderRadius:9,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'#fff',fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>‹</button>
        ) : (
          <button onClick={onMenu} aria-label="Menu" style={{width:40,height:40,borderRadius:9,background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,padding:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          </button>
        )}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:'Barlow Condensed,sans-serif',fontWeight:900,fontSize:16,color:'#fff',letterSpacing:'0.04em',lineHeight:1.1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{title}</div>
          {subtitle && <div style={{fontSize:9.5,color:'rgba(182,255,43,0.65)',fontWeight:700,letterSpacing:'0.1em',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{subtitle}</div>}
        </div>
        {right}
      </header>
    );
  };
  
  // ── Bottom tab bar (optional, for player/parent pages) ─────────────────
  window.MobileBottomTabs = function MobileBottomTabs({current, items}){
    const tabs = items || [
      {l:'Home', h:'tfb-dashboard.html', i:'M3 12L12 3l9 9M5 10v10h14V10'},
      {l:'Team', h:'tfb-team.html', i:'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'},
      {l:'Sessions', h:'tfb-sessions.html', i:'M9 5l-5 5 5 5M15 5l5 5-5 5'},
      {l:'Chat', h:'tfb-chat.html', i:'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'},
      {l:'Menu', h:'tfb-nav.html', i:'M3 12h18M3 6h18M3 18h18'},
    ];
    return (
      <nav style={{height:62,background:'#15191F',borderTop:'1px solid rgba(255,255,255,0.07)',display:'grid',gridTemplateColumns:`repeat(${tabs.length}, 1fr)`,paddingBottom:'env(safe-area-inset-bottom)',flexShrink:0,zIndex:40}}>
        {tabs.map(t=>{
          const active = current === t.h;
          return (
            <a key={t.h} href={t.h} style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,color:active?'#B6FF2B':'rgba(255,255,255,0.5)',textDecoration:'none',padding:'6px 4px'}}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={t.i}/></svg>
              <div style={{fontSize:10,fontWeight:active?700:500,letterSpacing:'0.02em'}}>{t.l}</div>
            </a>
          );
        })}
      </nav>
    );
  };
  
  // ── Auto-inject hamburger menu into existing Header on mobile ──────────
  // Most TFB pages have <header> with back-button + title. On mobile we replace the back button
  // with a hamburger that opens the drawer.
  function autoInjectHamburger(){
    const cleanup = ()=>{
      const existing = document.getElementById('__tfb_mobile_menu_btn');
      if (existing) existing.remove();
      const drawer = document.getElementById('__tfb_drawer_root');
      if (drawer) drawer.remove();
    };
    if (getBreakpoint() === 'desktop') { cleanup(); return; }
    if (document.body.dataset.tfbHasOwnMenu === '1') { cleanup(); return; }
    // Already injected?
    if (document.getElementById('__tfb_mobile_menu_btn')) return;
    // Heuristic: skip if there's already a button containing a hamburger SVG (3 horizontal lines)
    const allHeaderBtns = document.querySelectorAll('#root header button, #root > div > div:first-child button, [aria-label*="enu" i], [aria-label*="amburger" i]');
    for (const btn of allHeaderBtns) {
      const lines = btn.querySelectorAll('svg line');
      if (lines.length >= 3) {
        // Check they're horizontal
        const horizontals = [...lines].filter(l => {
          const y1 = parseFloat(l.getAttribute('y1'));
          const y2 = parseFloat(l.getAttribute('y2'));
          return !isNaN(y1) && y1 === y2;
        });
        if (horizontals.length >= 3) {
          document.body.dataset.tfbHasOwnMenu = '1';
          cleanup();
          return;
        }
      }
      const paths = btn.querySelectorAll('svg path');
      for (const p of paths) {
        const d = p.getAttribute('d') || '';
        if (/M\s*4\s+6h16|M\s*3\s+12h18M\s*3\s+6h18|M\s*4\s+12h16M\s*4\s+6h16/.test(d)) {
          document.body.dataset.tfbHasOwnMenu = '1';
          cleanup();
          return;
        }
      }
    }
    // Find the page's header — most pages render <header> as first child of #root's React tree
    let header = document.querySelector('#root header') || document.querySelector('header');
    if (!header) {
      // Fallback: first horizontal-flex row at top of #root tree
      const root = document.getElementById('root');
      if (root) {
        const firstDiv = root.querySelector(':scope > div');
        if (firstDiv) {
          // Find first child that looks like a top bar
          for (const child of firstDiv.children) {
            const cs = getComputedStyle(child);
            if (cs.display === 'flex' && cs.flexDirection !== 'column' && child.offsetHeight < 80 && child.offsetHeight > 30) {
              header = child;
              break;
            }
          }
        }
      }
    }
    if (!header) {
      // No header at all — just inject a floating button
      header = document.body;
    }
    
    // Create hamburger button
    const btn = document.createElement('button');
    btn.id = '__tfb_mobile_menu_btn';
    btn.setAttribute('aria-label', 'Open menu');
    btn.style.cssText = 'position:fixed;top:9px;left:8px;width:38px;height:38px;border-radius:9px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:90;padding:0;-webkit-tap-highlight-color:transparent';
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>';
    document.body.appendChild(btn);
    
    // Drawer root
    const drawerRoot = document.createElement('div');
    drawerRoot.id = '__tfb_drawer_root';
    document.body.appendChild(drawerRoot);
    
    let drawerOpen = false;
    const currentPath = (location.pathname.split('/').pop()) || 'tfb-dashboard.html';
    
    function renderDrawer(){
      if (!window.ReactDOM || !window.MobileDrawer) return;
      const root = ReactDOM.createRoot ? (drawerRoot._reactRoot || (drawerRoot._reactRoot = ReactDOM.createRoot(drawerRoot))) : null;
      const el = React.createElement(window.MobileDrawer, {
        open: drawerOpen,
        onClose: ()=>{ drawerOpen=false; renderDrawer(); },
        currentPath: currentPath,
        role: (function(){ try{ return localStorage.getItem('tfb_role')||'Coach'; }catch(e){ return 'Coach'; } })()
      });
      if (root) root.render(el);
      else ReactDOM.render(el, drawerRoot);
    }
    
    btn.addEventListener('click', ()=>{ drawerOpen=true; renderDrawer(); });
    renderDrawer();
  }
  
  // Run after React mount, then on resize
  setTimeout(autoInjectHamburger, 200);
  setTimeout(autoInjectHamburger, 800);
  setTimeout(autoInjectHamburger, 2000);
  // Watch for late React mounts
  if (document.getElementById('root')) {
    const mo = new MutationObserver(()=>{ autoInjectHamburger(); });
    mo.observe(document.getElementById('root'), {childList:true, subtree:true});
    // Stop observing after 10s to avoid runaway
    setTimeout(()=>mo.disconnect(), 10000);
  }
  window.addEventListener('resize', ()=>{ clearTimeout(_resizeT); _resizeT=setTimeout(()=>{ applyBreakpointClass(); autoInjectHamburger(); }, 80); });
  
  // ── Inject global responsive CSS ────────────────────────────────────────
  if (!document.getElementById('tfb-responsive-css')) {
    const style = document.createElement('style');
    style.id = 'tfb-responsive-css';
    style.textContent = `
      @keyframes tfb-fade-in { from{opacity:0} to{opacity:1} }
      @keyframes tfb-slide-in { from{transform:translateX(-100%)} to{transform:translateX(0)} }
      @keyframes tfb-slide-up { from{transform:translateY(100%)} to{transform:translateY(0)} }
      
      /* Touch-friendly hit targets on mobile/tablet */
      .is-mobile button, .is-mobile a[role="button"], .is-tablet button {
        min-height: 36px;
      }
      .is-mobile input, .is-mobile select, .is-mobile textarea {
        font-size: 16px !important; /* prevents iOS auto-zoom */
      }
      
      /* Hide desktop-only on mobile, hide mobile-only on desktop */
      .is-mobile .tfb-desktop-only { display: none !important; }
      .is-tablet .tfb-desktop-only { display: none !important; }
      .is-desktop .tfb-mobile-only { display: none !important; }
      .is-tablet .tfb-mobile-only { display: none !important; }
      .is-mobile .tfb-tablet-up { display: none !important; }
      .is-desktop .tfb-mobile-tablet-only { display: none !important; }
      
      /* Keep page scrollable on mobile */
      .is-mobile html, .is-mobile body, .is-mobile #root { 
        height: auto !important; 
        overflow-y: auto !important; 
        overflow-x: hidden !important;
      }
      
      /* Mobile-friendly modals */
      .is-mobile .tfb-modal { 
        max-width: 100% !important; 
        max-height: 100vh !important;
        border-radius: 12px 12px 0 0 !important;
        margin-top: auto !important;
        margin-bottom: 0 !important;
      }
      
      /* Global mobile shim — collapse fixed-width sidebars and multi-col grids */
      .is-mobile #root > div[style*="height: 100vh"],
      .is-mobile #root > div[style*="height:100vh"] {
        height: auto !important;
        min-height: 100vh !important;
        overflow: visible !important;
      }
      .is-mobile #root [style*="overflow: hidden"]:not(.tfb-keep-overflow),
      .is-mobile #root [style*="overflow:hidden"]:not(.tfb-keep-overflow) {
        overflow: visible !important;
      }
      /* Pad header so injected hamburger doesn't overlap content */
      .is-mobile #root header {
        padding-left: 56px !important;
      }
      .is-mobile #root header [style*="width: 36px"][style*="height: 36px"]:first-of-type,
      .is-mobile #root header button:first-child:not([aria-label]) {
        /* Hide the original page back button on mobile (replaced by hamburger) */
      }
      
      /* Tablet — collapse 4-col grids to 2, 3-col grids to 2 */
      .is-tablet #root [style*="grid-template-columns: 1fr 1fr 1fr 1fr"],
      .is-tablet #root [style*="gridTemplateColumns: 1fr 1fr 1fr 1fr"] {
        grid-template-columns: 1fr 1fr !important;
      }
      
      /* Mobile — force any multi-column grid to single column */
      .is-mobile #root [style*="grid-template-columns: 1fr 1fr"],
      .is-mobile #root [style*="gridTemplateColumns: 1fr 1fr"],
      .is-mobile #root [style*="grid-template-columns: repeat(2"],
      .is-mobile #root [style*="grid-template-columns: repeat(3"],
      .is-mobile #root [style*="grid-template-columns: repeat(4"],
      .is-mobile #root [style*="grid-template-columns: repeat(5"] {
        grid-template-columns: 1fr !important;
      }
      /* Mobile — flex rows wrap */
      .is-mobile #root [style*="display: flex"]:not([style*="flex-direction: column"]):not([style*="flex-direction:column"]) {
        flex-wrap: wrap;
      }
      /* Mobile — neutralize fixed widths on sidebars (>200px wide divs) */
      .is-mobile #root [style*="width: 220px"],
      .is-mobile #root [style*="width: 240px"],
      .is-mobile #root [style*="width: 260px"],
      .is-mobile #root [style*="width: 280px"],
      .is-mobile #root [style*="width: 300px"],
      .is-mobile #root [style*="width: 320px"],
      .is-mobile #root [style*="width: 340px"],
      .is-mobile #root [style*="width: 360px"],
      .is-mobile #root [style*="width: 380px"],
      .is-mobile #root [style*="width: 400px"] {
        width: 100% !important;
        max-width: 100% !important;
      }
      /* Mobile — tables/wide content scroll horizontally */
      .is-mobile #root table { display: block; overflow-x: auto; max-width: 100%; }
      
      /* Mobile — root padding + spacing */
      .is-mobile #root [style*="padding: 24px"],
      .is-mobile #root [style*="padding:24px"] {
        padding: 14px !important;
      }
      .is-mobile #root [style*="padding: 20px"],
      .is-mobile #root [style*="padding:20px"] {
        padding: 12px !important;
      }
      
      /* Inputs/buttons full-width on mobile */
      .is-mobile #root input[type="text"],
      .is-mobile #root input[type="email"],
      .is-mobile #root input[type="search"],
      .is-mobile #root input[type="tel"],
      .is-mobile #root input[type="password"],
      .is-mobile #root input[type="number"],
      .is-mobile #root textarea,
      .is-mobile #root select {
        max-width: 100% !important;
        box-sizing: border-box;
      }
      
      /* Mobile bottom safe area for fixed bottom toolbars */
      .is-mobile #root [style*="position: fixed"][style*="bottom: 0"],
      .is-mobile #root [style*="position:fixed"][style*="bottom:0"] {
        padding-bottom: env(safe-area-inset-bottom);
      }
      
      /* Hide horizontal scrollbar on mobile pill rows */
      .hide-scrollbar::-webkit-scrollbar { display:none; }
      .hide-scrollbar { scrollbar-width: none; }
    `;
    document.head.appendChild(style);
  }
})();
