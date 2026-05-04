// TFB Plan / Feature Gating — shared utility
// Load with: <script src="tfb-plan.js"></script>
// Exposes: window.TFBPlan (object with helpers)
(function(){
  const PLANS = {
    free:    { id:'free',    name:'Free',    price:0,   color:'#8A8F98', colorDim:'rgba(138,143,152,0.15)' },
    starter: { id:'starter', name:'Starter', price:29,  color:'#3FA9F5', colorDim:'rgba(63,169,245,0.15)' },
    pro:     { id:'pro',     name:'Pro',     price:79,  color:'#B6FF2B', colorDim:'rgba(182,255,43,0.15)'  },
    club:    { id:'club',    name:'Club',    price:199, color:'#9B7FE8', colorDim:'rgba(155,127,232,0.15)' },
  };

  // Feature → minimum plan required
  const FEATURE_GATES = {
    sessions:       'starter',
    session_builder:'starter',
    block_planner:  'starter',
    attendance:     'starter',
    wellness:       'starter',
    fixtures:       'free',
    team:           'free',
    chat:           'free',
    dashboard:      'free',
    tactics:        'pro',
    gameday:        'pro',
    development:    'pro',
    idp:            'pro',
    video_analysis: 'pro',
    player_dev:     'pro',
    meetings:       'starter',
    award:          'starter',
    overview:       'club',
    multi_team:     'club',
    recruitment:    'club',
    league_mgmt:    'club',
    dribl_sync:     'starter',
    billing_portal: 'free',
    custom_branding:'pro',
    data_export:    'starter',
    advanced_stats: 'pro',
  };

  const PLAN_ORDER = ['free','starter','pro','club'];

  function getPlan(){
    try{ return localStorage.getItem('tfb_plan') || 'pro'; }catch(e){ return 'pro'; }
  }
  function setPlan(id){
    try{ localStorage.setItem('tfb_plan', id); }catch(e){}
    window.dispatchEvent(new CustomEvent('tfb_plan_changed', {detail:{plan:id}}));
  }
  function getPlanData(id){ return PLANS[id||getPlan()] || PLANS.pro; }
  function planIndex(id){ return PLAN_ORDER.indexOf(id||getPlan()); }

  function canAccess(featureId){
    const required = FEATURE_GATES[featureId];
    if(!required) return true;
    return planIndex(getPlan()) >= planIndex(required);
  }

  function getRequiredPlan(featureId){
    return PLANS[FEATURE_GATES[featureId]] || null;
  }

  function getAllPlans(){ return Object.values(PLANS); }
  function getGates(){ return FEATURE_GATES; }

  window.TFBPlan = {
    getPlan, setPlan, getPlanData, planIndex,
    canAccess, getRequiredPlan, getAllPlans, getGates,
    PLANS, PLAN_ORDER, FEATURE_GATES,
  };
})();
