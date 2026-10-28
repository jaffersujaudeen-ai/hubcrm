/* UN Digital Hub CRM — local-first demo. No server/database. */
const KEY='undh_crm_v1';
const DEFAULT_SERVICES=[
{id:'SVC01',name:'Business Website Development',min:499,max:1999,active:true,description:'Websites, landing pages, catalogues and redesigns.'},
{id:'SVC02',name:'Business Portfolio (Showcase)',min:299,max:599,active:true,description:'Company profiles, brochures and business presentations.'},
{id:'SVC03',name:'Personal Portfolio (Showcase)',min:149,max:499,active:true,description:'Personal profiles, CVs and professional showcases.'},
{id:'SVC04',name:'Startup Support',min:199,max:1499,active:true,description:'Idea discussion, planning, MVPs and pitch decks.'},
{id:'SVC05',name:'Student Solutions',min:99,max:399,active:true,description:'Project reports, presentations and academic design support.'},
{id:'SVC06',name:'Digital Services',min:99,max:499,active:true,description:'Digital cards, posters, branding and business templates.'}
];
const emptyState=()=>({version:1,profile:{businessName:'UN Digital Hub',tagline:'Your Digital Growth Partner',phone:'9487838963',email:'undigitalhub13@gmail.com',address:'Cumbum, Theni District, Tamil Nadu, India',invoiceNote:'Thank you for choosing UN Digital Hub.',upiId:'',accountName:'',accountNumber:'',ifsc:'',bankName:'',paymentQr:''},services:structuredClone(DEFAULT_SERVICES),customers:[],orders:[],payments:[],invoices:[],expenses:[],reminders:[],activity:[],demo:false});
let db=loadDB(), page='dashboard', customerSearch='', orderSearch='', paySearch='', invoiceSearch='', expenseSearch='', reportStart='', reportEnd='', customerDetailId=null, detailTab='Overview', invoicePreviewId=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function loadDB(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x&&x.version===1)return {...emptyState(),...x,profile:{...emptyState().profile,...(x.profile||{})},reminders:Array.isArray(x.reminders)?x.reminders:[]};}catch(e){}return emptyState();}
function save(){try{localStorage.setItem(KEY,JSON.stringify(db));return true}catch(e){toast('Could not save. Browser storage may be full. Export a backup now.','error');return false}}
function id(prefix){return prefix+'-'+new Date().getFullYear()+'-'+Math.random().toString(36).slice(2,8).toUpperCase()}
function today(){return new Date().toISOString().slice(0,10)}
function money(n){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n)||0)}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function initials(s){return String(s||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()}
function dateFmt(s){if(!s)return '—';try{return new Date(s+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}catch{return s}}
function customer(id){return db.customers.find(x=>x.id===id)}
function service(id){return db.services.find(x=>x.id===id)}
function order(id){return db.orders.find(x=>x.id===id)}
function verifiedPayments(orderId){return db.payments.filter(p=>p.orderId===orderId&&p.status==='Verified').reduce((s,p)=>s+Number(p.amount||0),0)}
function refundedPayments(orderId){return db.payments.filter(p=>p.orderId===orderId&&['Refunded','Partially refunded'].includes(p.status)).reduce((s,p)=>s+Number(p.refundAmount||0),0)}
function paidForOrder(o){return Math.max(0,verifiedPayments(o.id)-refundedPayments(o.id))}
function balance(o){return Number(o.amount||0)-paidForOrder(o)}
function totalPaid(){return db.payments.filter(p=>p.status==='Verified').reduce((s,p)=>s+Number(p.amount||0),0)-db.payments.reduce((s,p)=>s+Number(p.refundAmount||0),0)}
function invoiceForOrder(oid){return db.invoices.find(i=>i.orderId===oid)}
function addActivity(text){db.activity.unshift({id:id('ACT'),text,at:new Date().toISOString()});db.activity=db.activity.slice(0,60)}
function toast(msg,type=''){const el=document.createElement('div');el.className='toast '+type;el.textContent=msg;$('#toastRoot').append(el);setTimeout(()=>el.remove(),3500)}
function statusBadge(s){let c='';if(['Verified','Delivered','Completed','Closed','Paid','Confirmed'].includes(s))c='green';else if(['Pending verification','Awaiting approval','Quotation sent','In progress','Review'].includes(s))c='gold';else if(['Failed','Cancelled','Overdue'].includes(s))c='red';else if(['New','Partially paid'].includes(s))c='blue';return `<span class="badge ${c}">${esc(s||'—')}</span>`}
function head(title,sub,actions=''){return `<div class="page-head"><div><div class="eyebrow">UN DIGITAL HUB / CRM</div><h1>${title}</h1><p>${sub}</p></div><div class="actions">${actions}</div></div>`}
function btn(label,action,cls=''){return `<button class="btn ${cls}" data-action="${action}">${label}</button>`}
function panel(title,sub,body,action=''){return `<section class="panel"><div class="panel-head"><div><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}</div>${action}</div>${body}</section>`}
function empty(icon,title,desc,action=''){return `<div class="empty"><div class="empty-icon">${icon}</div><strong>${title}</strong><p>${desc}</p>${action}</div>`}
function table(headers,rows,emptyMsg='No records yet.'){return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}">${empty('＋',emptyMsg,'Add a record to get started.')}</td></tr>`}</tbody></table></div>`}
function personCell(c){return `<div class="person"><div class="person-avatar">${esc(initials(c?.name||'Customer'))}</div><div><strong>${esc(c?.name||'Unknown customer')}</strong><small>${esc(c?.company||c?.type||'')}</small></div></div>`}
function customerOptions(selected=''){return `<option value="">Select customer…</option>`+db.customers.map(c=>`<option value="${esc(c.id)}" ${c.id===selected?'selected':''}>${esc(c.name)}${c.company?' — '+esc(c.company):''}</option>`).join('')}
function serviceOptions(selected=''){return `<option value="">Select service…</option>`+db.services.filter(s=>s.active||s.id===selected).map(s=>`<option value="${esc(s.id)}" ${s.id===selected?'selected':''}>${esc(s.name)}</option>`).join('')}
function orderOptions(selected=''){return `<option value="">Select order…</option>`+db.orders.filter(o=>!['Cancelled'].includes(o.status)||o.id===selected).map(o=>`<option value="${esc(o.id)}" ${o.id===selected?'selected':''}>${esc(o.code)} · ${esc(customer(o.customerId)?.name||'Unknown')} · ${money(o.amount)}</option>`).join('')}
function render(){ $('#pageCrumb').textContent=({dashboard:'Dashboard',customers:'Customers',services:'Services & Pricing',orders:'Orders & Projects',followups:'Follow-up Reminders',payments:'Payments',invoices:'Invoices',expenses:'Expenses',reports:'Reports & Analytics',settings:'Settings & Backup'})[page]||'CRM'; $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.page===page)); const f={dashboard:renderDashboard,customers:renderCustomers,services:renderServices,orders:renderOrders,followups:renderFollowups,payments:renderPayments,invoices:renderInvoices,expenses:renderExpenses,reports:renderReports,settings:renderSettings};$('#app').innerHTML=f[page](); }
function renderDashboard(){
 const active=db.orders.filter(o=>['Confirmed','In progress','Review','New','Quotation sent','Awaiting approval'].includes(o.status)).length;
 const outstanding=db.orders.reduce((s,o)=>s+Math.max(0,balance(o)),0);
 const month=today().slice(0,7), revenue=db.payments.filter(p=>p.status==='Verified'&&(p.date||'').startsWith(month)).reduce((s,p)=>s+Number(p.amount||0),0), expenses=db.expenses.filter(e=>(e.date||'').startsWith(month)).reduce((s,e)=>s+Number(e.amount||0),0);
 const rows=db.orders.slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||'')).slice(0,6).map(o=>`<tr><td><strong>${esc(o.code)}</strong><small style="display:block;color:#98a39b;margin-top:4px">${dateFmt(o.date)}</small></td><td>${personCell(customer(o.customerId))}</td><td>${esc(service(o.serviceId)?.name||'—')}</td><td>${money(o.amount)}</td><td>${statusBadge(o.status)}</td><td>${btn('View','view-order:'+o.id,'small')}</td></tr>`).join('');
 const serviceBars=db.services.map(s=>({name:s.name,n:db.orders.filter(o=>o.serviceId===s.id).length})).sort((a,b)=>b.n-a.n);
 const max=Math.max(1,...serviceBars.map(x=>x.n));
 const activities=db.activity.slice(0,6).map(a=>`<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #eff2ef"><span class="status-dot" style="margin-top:5px"></span><div style="flex:1;font-size:12px;line-height:1.5">${esc(a.text)}<small style="display:block;color:#9aa49d;margin-top:4px">${new Date(a.at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</small></div></div>`).join('');
 return head('Good to see you, Jaffer.','Here is what is happening across your business today.',btn('＋ Add customer','add-customer','primary')+btn('＋ Create order','add-order'))+
 `<div class="notice info"><strong>Local-first storage</strong>Your records are saved in this browser on this device. Use Settings & Backup to export a full backup regularly. This prototype does not sync online.</div>
 <div class="grid kpi-grid">
 <div class="kpi"><div class="kpi-top">Total customers <span class="kpi-icon">♙</span></div><div class="kpi-value">${db.customers.length}</div><div class="kpi-note">Saved customer profiles</div></div>
 <div class="kpi"><div class="kpi-top">Active orders <span class="kpi-icon">▤</span></div><div class="kpi-value">${active}</div><div class="kpi-note">Work awaiting completion</div></div>
 <div class="kpi"><div class="kpi-top">Verified payments this month <span class="kpi-icon">₹</span></div><div class="kpi-value">${money(revenue)}</div><div class="kpi-note">Verified receipts only</div></div>
 <div class="kpi"><div class="kpi-top">Outstanding balance <span class="kpi-icon">◷</span></div><div class="kpi-value">${money(outstanding)}</div><div class="kpi-note">Across all orders</div></div></div>
 <div class="grid two-col">
 ${panel('Recent orders','Latest customer work',`<div class="table-wrap">${table(['Order','Customer','Service','Amount','Status',''],rows,'No orders yet.')}</div>`,btn('All orders','go:orders','small'))}
 ${panel('Service overview','Orders by service category',`<div class="panel-body"><div class="bar-list">${serviceBars.map(s=>`<div class="bar-row"><span>${esc(s.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${s.n/max*100}%"></div></div><strong>${s.n} orders</strong></div>`).join('')}</div></div>`)}
 ${panel('Upcoming follow-ups','Overdue and next reminders',`<div class="panel-body">${(()=>{const rs=db.reminders.filter(r=>r.status==='Pending').sort((a,b)=>(a.dueDate||'').localeCompare(b.dueDate||'')).slice(0,5);return rs.length?rs.map(r=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid #eff2ef"><div><strong style="font-size:12px">${esc(r.title)}</strong><small style="display:block;color:#98a39b;margin-top:4px">${esc(customer(r.customerId)?.name||'')}</small></div><div style="text-align:right">${dateFmt(r.dueDate)}<small style="display:block;color:${r.dueDate<today()?'#b54747':'#98a39b'};margin-top:4px">${r.dueDate<today()?'Overdue':r.dueDate===today()?'Due today':'Pending'}</small></div></div>`).join('')+btn('Manage reminders','go:followups','small'):empty('◷','No pending reminders','Create a reminder for a quotation, payment or delivery follow-up.',btn('＋ Add reminder','add-reminder','small primary'))})()}</div>`)}\n ${panel('Recent activity','A lightweight history of changes',`<div class="panel-body">${activities||empty('◷','No activity yet','Customer, order and payment activity will appear here.')}</div>`)}
 ${panel('This month','Business snapshot',`<div class="panel-body"><div class="detail-grid grid"><div class="detail-stat"><span>Verified payments</span><strong>${money(revenue)}</strong></div><div class="detail-stat"><span>Expenses</span><strong>${money(expenses)}</strong></div><div class="detail-stat"><span>Net cash flow*</span><strong>${money(revenue-expenses)}</strong></div></div><p class="text-muted" style="font-size:10px">*Cash-flow snapshot based on verified payments received minus recorded expenses; not an accounting statement.</p>${btn('Open reports','go:reports','small')}</div>`)}
 </div>`;
}
function renderCustomers(){
 const list=db.customers.filter(c=>(c.name+' '+c.company+' '+c.phone+' '+c.email).toLowerCase().includes(customerSearch.toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name));
 const rows=list.map(c=>`<tr><td>${personCell(c)}</td><td>${esc(c.phone)}</td><td>${esc(c.email||'—')}</td><td>${esc(c.type)}</td><td>${db.orders.filter(o=>o.customerId===c.id).length}</td><td>${dateFmt(c.createdAt?.slice(0,10))}</td><td><button class="btn small" data-action="customer-detail:${c.id}">Open profile</button></td></tr>`).join('');
 return head('Customers','Build lasting relationships with a single customer record.',btn('＋ Add customer','add-customer','primary')+btn('Export CSV','export:customers'))+
 `<div class="toolbar"><div class="search"><span>⌕</span><input id="customerSearch" placeholder="Search name, company, phone or email…" value="${esc(customerSearch)}"></div><span class="text-muted">${list.length} customer${list.length===1?'':'s'}</span></div>
 ${panel('Customer directory','Every customer profile connects to their orders, payments and invoices',table(['Customer','Phone','Email','Type','Orders','Added',''],rows,'No customers added yet. Add your first customer to begin.'))}`;
}
function renderServices(){
 return head('Services & Pricing','Manage your catalogue. Order prices are saved separately from these ranges.',btn('Export CSV','export:services'))+
 `<div class="grid service-grid">${db.services.map((s,i)=>`<article class="service-card"><div class="service-symbol">${['⌘','▤','♙','✦','▣','◇'][i%6]}</div><h3>${esc(s.name)}</h3><div class="price">${money(s.min)} – ${money(s.max)}</div><p>${esc(s.description||'Service offered by UN Digital Hub.')}</p><div style="margin-bottom:12px">${s.active?'<span class="badge green">Active</span>':'<span class="badge">Inactive</span>'}</div><div class="card-actions">${btn('Edit','edit-service:'+s.id,'small')}${btn(s.active?'Deactivate':'Activate','toggle-service:'+s.id,'small')}</div></article>`).join('')}</div>`;
}
function renderOrders(){
 const list=db.orders.filter(o=>(o.code+' '+(customer(o.customerId)?.name||'')+' '+(service(o.serviceId)?.name||'')+' '+o.status).toLowerCase().includes(orderSearch.toLowerCase())).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 const rows=list.map(o=>`<tr><td><strong>${esc(o.code)}</strong><small style="display:block;color:#9aa49d;margin-top:4px">${dateFmt(o.date)}</small></td><td>${personCell(customer(o.customerId))}</td><td>${esc(service(o.serviceId)?.name||'—')}</td><td>${money(o.amount)}</td><td>${money(Math.max(0,balance(o)))}</td><td>${dateFmt(o.dueDate)}</td><td>${statusBadge(o.deliveryStatus||'Not started')}</td><td>${statusBadge(o.status)}</td><td>${btn('View','view-order:'+o.id,'small')} ${btn('Edit','edit-order:'+o.id,'small')}</td></tr>`).join('');
 return head('Orders & Projects','Track every deliverable from enquiry through delivery.',btn('＋ Create order','add-order','primary')+btn('Export CSV','export:orders'))+
 `<div class="toolbar"><div class="search"><span>⌕</span><input id="orderSearch" placeholder="Search order, customer or status…" value="${esc(orderSearch)}"></div><span class="text-muted">${list.length} orders</span></div>${panel('Order register','Agreed prices remain unchanged when catalogue pricing is updated',table(['Order','Customer','Service','Agreed amount','Balance','Delivery date','Delivery status','Order status','Actions'],rows,'No orders yet. Add a customer before creating an order.'))}`;
}

function renderFollowups(){
 const list=db.reminders.slice().sort((a,b)=>(a.dueDate||'').localeCompare(b.dueDate||''));
 const pending=list.filter(r=>r.status==='Pending'), overdue=pending.filter(r=>r.dueDate<today()), dueToday=pending.filter(r=>r.dueDate===today());
 const rows=list.map(r=>{const c=customer(r.customerId),o=order(r.orderId);const isOverdue=r.status==='Pending'&&r.dueDate<today();return `<tr><td><strong>${esc(r.title)}</strong><small style="display:block;color:#98a39b;margin-top:4px">${esc(r.type||'Follow-up')}</small></td><td>${personCell(c)}</td><td>${esc(o?.code||'—')}</td><td>${dateFmt(r.dueDate)}${isOverdue?'<small style="display:block;color:#b54747;margin-top:4px">Overdue</small>':''}</td><td>${statusBadge(r.status)}</td><td>${esc(r.notes||'—')}</td><td>${r.status==='Pending'?btn('Complete','complete-reminder:'+r.id,'small primary'):''} ${btn('Edit','edit-reminder:'+r.id,'small')} ${btn('Delete','delete-reminder:'+r.id,'small danger')}</td></tr>`}).join('');
 return head('Follow-up Reminders','Keep track of customer calls, quotation follow-ups, payments and delivery check-ins.',btn('＋ Add reminder','add-reminder','primary')+btn('Export CSV','export:reminders'))+
 `<div class="grid kpi-grid"><div class="kpi"><div class="kpi-top">Pending reminders <span class="kpi-icon">◷</span></div><div class="kpi-value">${pending.length}</div><div class="kpi-note">Need your attention</div></div><div class="kpi"><div class="kpi-top">Overdue <span class="kpi-icon">!</span></div><div class="kpi-value">${overdue.length}</div><div class="kpi-note">Past due date</div></div><div class="kpi"><div class="kpi-top">Due today <span class="kpi-icon">◉</span></div><div class="kpi-value">${dueToday.length}</div><div class="kpi-note">Follow up today</div></div><div class="kpi"><div class="kpi-top">Completed <span class="kpi-icon">✓</span></div><div class="kpi-value">${list.filter(r=>r.status==='Completed').length}</div><div class="kpi-note">Completed reminders</div></div></div>
 ${panel('Reminder register','Reminders are stored locally; this version does not send push notifications or emails.',table(['Reminder','Customer','Order','Due date','Status','Notes','Actions'],rows,'No reminders yet. Add a customer follow-up to get started.'))}`;
}
function reminderForm(existing){
 if(!db.customers.length){toast('Add a customer before creating a reminder.','error');customerForm();return}
 const cur=existing||{},edit=!!existing?.id;
 const body=`<div class="form-grid">${field('Reminder title','title',cur.title||'','text',true)}${selectField('Customer','customerId',db.customers.map(c=>({value:c.id,label:c.name+(c.company?' — '+c.company:'')})),cur.customerId||db.customers[0].id,true)}${selectField('Related order (optional)','orderId',[{value:'',label:'No linked order'},...db.orders.map(o=>({value:o.id,label:o.code+' · '+(customer(o.customerId)?.name||'Unknown')+' · '+o.title}))],cur.orderId||'')}${selectField('Reminder type','type',['Call customer','Quotation follow-up','Payment follow-up','Collect requirements','Delivery check-in','Feedback request','Other'],cur.type||'Call customer',true)}${field('Due date','dueDate',cur.dueDate||today(),'date',true)}${selectField('Status','status',['Pending','Completed','Cancelled'],cur.status||'Pending',true)}${textareaField('Notes','notes',cur.notes||'')}</div>`;
 openModal(edit?'Edit reminder':'Add follow-up reminder','Set a date to follow up with this customer. This is an in-app reminder, not a push notification.',body,edit?'Save changes':'Save reminder',fd=>{
 const d=Object.fromEntries(fd.entries());if(!d.title.trim()||!d.customerId||!d.dueDate){toast('Enter a title, customer and due date.','error');return}
 if(d.orderId&&order(d.orderId)?.customerId!==d.customerId){toast('Choose an order belonging to the selected customer.','error');return}
 if(edit)Object.assign(cur,d,{updatedAt:new Date().toISOString()});else{const r={id:id('REM'),code:id('REM'),...d,createdAt:new Date().toISOString()};db.reminders.push(r);addActivity('Added reminder '+r.title+' for '+customer(r.customerId)?.name)}
 save();closeModal();render();toast(edit?'Reminder updated.':'Reminder saved.');
 },true);
}
function renderPayments(){
 const list=db.payments.filter(p=>(p.code+' '+(customer(order(p.orderId)?.customerId)?.name||'')+' '+p.method+' '+p.status).toLowerCase().includes(paySearch.toLowerCase())).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 const rows=list.map(p=>{const o=order(p.orderId),c=customer(o?.customerId);return `<tr><td><strong>${esc(p.code)}</strong><small style="display:block;color:#9aa49d;margin-top:4px">${dateFmt(p.date)}</small></td><td>${personCell(c)}</td><td>${esc(o?.code||'—')}</td><td>${money(p.amount)}</td><td>${esc(p.method)}</td><td>${statusBadge(p.status)}</td><td>${esc(p.reference||'—')}</td><td>${p.status==='Pending verification'?btn('Verify','verify-payment:'+p.id,'small primary'):''} ${btn('Edit','edit-payment:'+p.id,'small')}</td></tr>`}).join('');
 return head('Payments','Record advances and final payments. Only verified payments count as received.',btn('＋ Record payment','add-payment','primary')+btn('Export CSV','export:payments'))+
 `<div class="grid kpi-grid"><div class="kpi"><div class="kpi-top">Verified receipts <span class="kpi-icon">₹</span></div><div class="kpi-value">${money(totalPaid())}</div><div class="kpi-note">Net of entered refunds</div></div><div class="kpi"><div class="kpi-top">Awaiting verification <span class="kpi-icon">◷</span></div><div class="kpi-value">${db.payments.filter(p=>p.status==='Pending verification').length}</div><div class="kpi-note">Confirm against bank/UPI records</div></div><div class="kpi"><div class="kpi-top">Failed records <span class="kpi-icon">!</span></div><div class="kpi-value">${db.payments.filter(p=>p.status==='Failed').length}</div><div class="kpi-note">Do not count as received</div></div><div class="kpi"><div class="kpi-top">Total outstanding <span class="kpi-icon">◷</span></div><div class="kpi-value">${money(db.orders.reduce((s,o)=>s+Math.max(0,balance(o)),0))}</div><div class="kpi-note">All orders</div></div></div>
 <div class="toolbar"><div class="search"><span>⌕</span><input id="paySearch" placeholder="Search payment, customer, method…" value="${esc(paySearch)}"></div></div>${panel('Payment register','Never store UPI PINs, OTPs or banking passwords in the CRM',table(['Payment','Customer','Order','Amount','Method','Status','Reference','Actions'],rows,'No payments recorded yet.'))}`;
}
function renderInvoices(){
 const list=db.invoices.filter(i=>(i.number+' '+(customer(order(i.orderId)?.customerId)?.name||'')+' '+(order(i.orderId)?.code||'')).toLowerCase().includes(invoiceSearch.toLowerCase())).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 const rows=list.map(i=>{const o=order(i.orderId);return `<tr><td><strong>${esc(i.number)}</strong><small style="display:block;color:#9aa49d;margin-top:4px">${dateFmt(i.date)}</small></td><td>${personCell(customer(o?.customerId))}</td><td>${esc(o?.code||'—')}</td><td>${money(i.total)}</td><td>${money(Math.max(0,i.total-paidForOrder(o||{id:''})))}</td><td>${statusBadge(i.status)}</td><td>${btn('Preview','preview-invoice:'+i.id,'small')} ${btn('Edit','edit-invoice:'+i.id,'small')} ${btn('Print / PDF','print-invoice:'+i.id,'small')} ${btn('WhatsApp','whatsapp-invoice:'+i.id,'small primary')}</td></tr>`}).join('');
 return head('Invoices','Create clear, print-ready invoices linked to customer orders.',btn('＋ Create invoice','add-invoice','primary')+btn('Export CSV','export:invoices'))+
 `<div class="toolbar"><div class="search"><span>⌕</span><input id="invoiceSearch" placeholder="Search invoice, customer or order…" value="${esc(invoiceSearch)}"></div></div>${panel('Invoice register','Tax is optional and defaults to zero. Configure invoice notes in Settings.',table(['Invoice','Customer','Order','Total','Balance','Status','Actions'],rows,'No invoices created yet.'))}`;
}
function renderExpenses(){
 const list=db.expenses.filter(e=>(e.code+' '+e.category+' '+e.description).toLowerCase().includes(expenseSearch.toLowerCase())).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 const rows=list.map(e=>`<tr><td><strong>${esc(e.code)}</strong></td><td>${esc(e.category)}</td><td>${esc(e.description||'—')}</td><td>${dateFmt(e.date)}</td><td>${esc(e.method||'—')}</td><td>${money(e.amount)}</td><td>${btn('Edit','edit-expense:'+e.id,'small')} ${btn('Delete','delete-expense:'+e.id,'small danger')}</td></tr>`).join('');
 const sum=list.reduce((s,e)=>s+Number(e.amount||0),0);
 return head('Expenses','Keep a record of business spending for cash-flow reporting.',btn('＋ Add expense','add-expense','primary')+btn('Export CSV','export:expenses'))+
 `<div class="kpi-grid grid"><div class="kpi"><div class="kpi-top">Expenses shown <span class="kpi-icon">↗</span></div><div class="kpi-value">${money(sum)}</div><div class="kpi-note">${list.length} records</div></div></div><div class="toolbar"><div class="search"><span>⌕</span><input id="expenseSearch" placeholder="Search expense category or description…" value="${esc(expenseSearch)}"></div></div>${panel('Expense register','Enter actual amounts paid',table(['Code','Category','Description','Date','Method','Amount','Actions'],rows,'No expenses recorded yet.'))}`;
}
function filteredDates(rows,field='date'){return rows.filter(x=>(!reportStart||(x[field]||'')>=reportStart)&&(!reportEnd||(x[field]||'')<=reportEnd))}
function renderReports(){
 const payments=filteredDates(db.payments.filter(p=>p.status==='Verified')), exp=filteredDates(db.expenses), orders=filteredDates(db.orders);
 const rev=payments.reduce((s,p)=>s+Number(p.amount||0)-Number(p.refundAmount||0),0), cost=exp.reduce((s,e)=>s+Number(e.amount||0),0);
 const byService=db.services.map(s=>({name:s.name,value:orders.filter(o=>o.serviceId===s.id).reduce((n,o)=>n+Number(o.amount||0),0)})).sort((a,b)=>b.value-a.value);
 const max=Math.max(1,...byService.map(s=>s.value));
 return head('Reports & Analytics','Use date filters to understand sales, collections, outstanding balances and costs.',btn('Export report CSV','export:report','primary'))+
 `<div class="toolbar"><label class="text-muted">From <input id="reportStart" type="date" value="${esc(reportStart)}" style="width:auto"></label><label class="text-muted">To <input id="reportEnd" type="date" value="${esc(reportEnd)}" style="width:auto"></label>${btn('Clear dates','clear-report','small')}</div>
 <div class="grid kpi-grid"><div class="kpi"><div class="kpi-top">Verified receipts <span class="kpi-icon">₹</span></div><div class="kpi-value">${money(rev)}</div><div class="kpi-note">Within selected dates</div></div><div class="kpi"><div class="kpi-top">Expenses <span class="kpi-icon">↗</span></div><div class="kpi-value">${money(cost)}</div><div class="kpi-note">Within selected dates</div></div><div class="kpi"><div class="kpi-top">Net cash flow <span class="kpi-icon">≈</span></div><div class="kpi-value">${money(rev-cost)}</div><div class="kpi-note">Receipts minus recorded expenses</div></div><div class="kpi"><div class="kpi-top">Order value <span class="kpi-icon">▤</span></div><div class="kpi-value">${money(orders.reduce((s,o)=>s+Number(o.amount||0),0))}</div><div class="kpi-note">Agreed value for orders in period</div></div></div>
 <div class="grid two-col">${panel('Order value by service','Agreed order amounts in selected period',`<div class="panel-body"><div class="bar-list">${byService.map(s=>`<div class="bar-row"><span>${esc(s.name)}</span><div class="bar-track"><div class="bar-fill" style="width:${s.value/max*100}%"></div></div><strong>${money(s.value)}</strong></div>`).join('')}</div></div>`)}
 ${panel('Order status','Current status distribution',`<div class="panel-body">${['New','Quotation sent','Awaiting approval','Confirmed','In progress','Review','Completed','Delivered','Closed','Cancelled'].map(s=>`<div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #eff2ef"><span>${statusBadge(s)}</span><strong>${db.orders.filter(o=>o.status===s).length}</strong></div>`).join('')}</div>`)}</div>
 <div class="notice" style="margin-top:16px"><strong>Reporting note</strong>These are operational summaries, not audited accounts or tax advice. Net cash flow is calculated from verified payment entries minus entered expenses.</div>`;
}

function field(label,name,value='',type='text',required=false){return `<div class="form-group"><label>${label}${required?' *':''}</label><input name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''}></div>`}
function selectField(label,name,options,selected='',required=false){return `<div class="form-group"><label>${label}${required?' *':''}</label><select name="${name}" ${required?'required':''}>${options.map(o=>{const value=typeof o==='object'?o.value:o,text=typeof o==='object'?o.label:o;return `<option value="${esc(value)}" ${value===selected?'selected':''}>${esc(text)}</option>`}).join('')}</select></div>`}
function textareaField(label,name,value=''){return `<div class="form-group full"><label>${label}</label><textarea name="${name}">${esc(value)}</textarea></div>`}
function renderSettings(){
 return head('Settings & Backup','Manage your business profile and protect your local records.',btn('Export full JSON backup','backup-export','primary')+btn('Import backup','backup-import'))+
 `<div class="notice"><strong>Important: browser-local storage</strong>This CRM stores records only in this browser on this device. It does not sync between devices or browsers. Clearing browser site data may delete your records. Export a full JSON backup regularly. This local-only prototype is not secure enough for public multi-user access.</div>
 <div class="grid settings-grid">
 ${panel('Business profile','Used on invoice previews and exports',`<div class="panel-body"><form id="profileForm" class="form-grid">
 ${field('Business name','businessName',db.profile.businessName)}${field('Tagline','tagline',db.profile.tagline)}
 ${field('Phone','phone',db.profile.phone,'tel')}${field('Email','email',db.profile.email,'email')}
 ${textareaField('Business address','address',db.profile.address)}${textareaField('Invoice note','invoiceNote',db.profile.invoiceNote)}
 <div class="form-group full"><label>UPI ID</label><input name="upiId" value="${esc(db.profile.upiId||'')}" placeholder="yourname@upi"></div>
 ${field('Account holder name','accountName',db.profile.accountName||'')}${field('Bank name','bankName',db.profile.bankName||'')}
 ${field('Bank account number','accountNumber',db.profile.accountNumber||'')}${field('IFSC code','ifsc',db.profile.ifsc||'')}
 <div class="form-group full"><label>Google Pay / UPI QR code image</label><input id="paymentQrFile" type="file" accept="image/png,image/jpeg,image/webp"><small class="text-muted">Upload your real payment QR image. It is stored in this browser's local storage and printed on invoices.</small>
 ${db.profile.paymentQr?`<img src="${db.profile.paymentQr}" alt="Saved payment QR code" style="width:140px;height:140px;object-fit:contain;border:1px solid var(--line);border-radius:8px;padding:5px;margin-top:8px"><button type="button" class="btn small danger" data-action="remove-payment-qr">Remove QR code</button>`:'<p class="text-muted">No payment QR uploaded yet.</p>'}</div>
 <div class="form-group full"><button class="btn primary" type="submit">Save business and payment details</button></div></form></div>`)}
 ${panel('Data management','Export for backup or spreadsheet use',`<div class="panel-body" style="display:grid;gap:12px">
 <div><strong>Full backup (JSON)</strong><p class="text-muted">Includes customers, services, orders, payments, invoices, expenses and settings.</p>${btn('Download full backup','backup-export','small primary')}</div><hr>
 <div><strong>Excel-compatible CSV</strong><p class="text-muted">Export individual modules or all tables for spreadsheet use.</p>${btn('Export all CSV tables','export:all','small')}</div><hr>
 <div><strong>Import backup</strong><p class="text-muted">Import replaces the current local data after confirmation.</p>${btn('Choose JSON backup','backup-import','small')}</div><hr>
 <div><strong>Demo data</strong><p class="text-muted">Load clearly labelled fictional records to explore the CRM.</p>${btn(db.demo?'Clear demo data':'Load demo data',db.demo?'clear-demo':'load-demo','small')}${btn('Clear all local data','clear-all','small danger')}</div></div>`)}
 ${panel('Access & security','Owner mode now; staff support later',`<div class="panel-body"><div class="notice"><strong>Owner-only prototype</strong>This client-side version has no real login or server-side permissions. Do not publish it with real customer records or treat the owner label as authentication.</div><div class="form-group"><label>Current access mode</label><input value="Owner mode — local browser only" disabled></div><div class="form-group" style="margin-top:13px"><label>Future staff access</label><input value="Requires backend authentication and shared storage" disabled></div></div>`)}
 </div>`;
}
function openModal(title,subtitle,body,submitLabel='Save',onSubmit=null,wide=false){
 $('#modalRoot').innerHTML=`<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><div><h2>${title}</h2><p>${subtitle||''}</p></div><button class="close-btn" data-action="close-modal">×</button></div><form id="activeForm"><div class="modal-body">${body}</div><div class="modal-foot"><button type="button" class="btn" data-action="close-modal">Cancel</button><button class="btn primary" type="submit">${submitLabel}</button></div></form></div></div>`;
 $('#modalRoot .modal').style.width=wide?'min(850px,100%)':'min(680px,100%)';
 const form=$('#activeForm');form.onsubmit=e=>{e.preventDefault();if(onSubmit)onSubmit(new FormData(form));};
}
function closeModal(){$('#modalRoot').innerHTML=''}
function customerForm(existing={}){
 const edit=!!existing.id;
 openModal(edit?'Edit customer':'Add customer',edit?'Update this customer profile.':'Customer profiles connect to orders, payments and invoices.',
 `<div class="form-grid">${field('Full name','name',existing.name||'','text',true)}${selectField('Customer type','type',['individual','student','startup','business'],existing.type||'individual',true)}${field('Company / organization','company',existing.company||'')}${field('Phone number','phone',existing.phone||'','tel',true)}${field('Email address','email',existing.email||'','email')}${field('City','city',existing.city||'')}${textareaField('Address','address',existing.address||'')}${textareaField('Notes','notes',existing.notes||'')}</div>`,edit?'Save changes':'Add customer',fd=>{
 const d=Object.fromEntries(fd.entries());if(!d.name.trim()||!d.phone.trim()){toast('Name and phone are required.','error');return}
 if(db.customers.some(c=>c.phone.trim()===d.phone.trim()&&c.id!==existing.id)&&!confirm('A customer with this phone already exists. Save anyway?'))return;
 if(edit)Object.assign(existing,d,{updatedAt:new Date().toISOString()});else{Object.assign(d,{id:id('CUS'),code:id('CUS'),createdAt:new Date().toISOString()});db.customers.push(d);addActivity('Added customer '+d.name)}
 save();closeModal();render();toast(edit?'Customer updated.':'Customer added.');
 },true);
}
function serviceForm(existing){
 openModal('Edit service','Existing orders keep their saved agreed price.',`<div class="form-grid">${field('Service name','name',existing.name,'text',true)}${field('Minimum price (₹)','min',existing.min,'number',true)}${field('Maximum price (₹)','max',existing.max,'number',true)}${selectField('Status','active',['true','false'],String(existing.active))}${textareaField('Description','description',existing.description||'')}</div>`,'Save service',fd=>{const d=Object.fromEntries(fd.entries()),min=Number(d.min),max=Number(d.max);if(!d.name.trim()||min<0||max<min){toast('Check service name and price range.','error');return}Object.assign(existing,{name:d.name,min,max,active:d.active==='true',description:d.description});save();closeModal();render();toast('Service updated.')},true);
}
function orderForm(existing){
 if(!db.customers.length){toast('Add a customer before creating an order.','error');customerForm();return}
 const edit=!!existing?.id, current=existing||{};
 const body=`<div class="form-grid">${selectField('Customer','customerId',db.customers.map(c=>({value:c.id,label:c.name+(c.company?' — '+c.company:'')})),current.customerId||db.customers[0].id,true)}${selectField('Service','serviceId',db.services.filter(s=>s.active||s.id===current.serviceId).map(s=>({value:s.id,label:s.name})),current.serviceId||db.services.find(s=>s.active)?.id,true)}${field('Order title','title',current.title||'','text',true)}${field('Agreed amount (₹)','amount',current.amount??'','number',true)}${field('Quoted amount (₹)','quoted',current.quoted??'','number')}${field('Order date','date',current.date||today(),'date',true)}${field('Promised delivery date','dueDate',current.dueDate||'','date')}${selectField('Delivery status','deliveryStatus',['Not started','In progress','Ready for delivery','Delivered'],current.deliveryStatus||(current.status==='Delivered'?'Delivered':'Not started'),true)}${field('Completed / delivered date','deliveredDate',current.deliveredDate||'','date')}${selectField('Status','status',['New','Quotation sent','Awaiting approval','Confirmed','In progress','Review','Completed','Delivered','Closed','Cancelled'],current.status||'New',true)}${textareaField('Requirements','requirements',current.requirements||'')}${textareaField('Delivery notes','deliveryNotes',current.deliveryNotes||'')}${textareaField('Notes / deliverables','notes',current.notes||'')}</div>`;
 openModal(edit?'Edit order':'Create order','Agreed amount is saved to this order.',body,edit?'Save changes':'Create order',fd=>{
 const d=Object.fromEntries(fd.entries()),amount=Number(d.amount);if(d.deliveryStatus==='Delivered'&&!d.deliveredDate)d.deliveredDate=today();if(d.deliveryStatus!=='Delivered')d.deliveredDate=d.deliveredDate||'';if(!d.customerId||!d.serviceId||!d.title.trim()||!Number.isFinite(amount)||amount<0){toast('Complete required fields with a valid amount.','error');return}
 const hist=current.history||[];if(edit&&current.status!==d.status)hist.unshift({from:current.status,to:d.status,at:new Date().toISOString()});
 if(edit)Object.assign(current,{...d,amount,quoted:d.quoted===''?null:Number(d.quoted),history:hist,updatedAt:new Date().toISOString()});
 else{const o={id:id('ORD'),code:id('ORD'),...d,amount,quoted:d.quoted===''?null:Number(d.quoted),history:[{from:null,to:d.status,at:new Date().toISOString()}],createdAt:new Date().toISOString()};db.orders.push(o);addActivity('Created order '+o.code+' for '+customer(o.customerId)?.name)}
 save();closeModal();render();toast(edit?'Order updated.':'Order created.');
 },true);
}
function paymentForm(existing){
 if(!db.orders.length){toast('Create an order before recording a payment.','error');return}
 const edit=!!existing?.id,cur=existing||{};
 openModal(edit?'Edit payment':'Record payment','Verify receipts against your bank or UPI record.',`<div class="form-grid">${selectField('Order','orderId',db.orders.map(o=>({value:o.id,label:o.code+' · '+(customer(o.customerId)?.name||'Unknown')+' · '+money(o.amount)})),cur.orderId||db.orders[0].id,true)}${field('Amount (₹)','amount',cur.amount??'','number',true)}${field('Payment date','date',cur.date||today(),'date',true)}${selectField('Method','method',['UPI','Bank transfer','Cash','Payment gateway','Other'],cur.method||'UPI',true)}${selectField('Status','status',['Pending verification','Verified','Failed','Refunded','Partially refunded'],cur.status||'Pending verification',true)}${field('Transaction reference','reference',cur.reference||'')}${field('Refund amount (₹)','refundAmount',cur.refundAmount||0,'number')}${textareaField('Notes','notes',cur.notes||'')}</div>`,edit?'Save changes':'Record payment',fd=>{
 const d=Object.fromEntries(fd.entries()),amount=Number(d.amount),refund=Number(d.refundAmount||0);if(!d.orderId||!Number.isFinite(amount)||amount<=0||refund<0||refund>amount){toast('Enter a valid order, amount and refund amount.','error');return}
 if(edit)Object.assign(cur,{...d,amount,refundAmount:refund});else{const pay={id:id('PAY'),code:id('PAY'),...d,amount,refundAmount:refund,createdAt:new Date().toISOString()};db.payments.push(pay);addActivity('Recorded payment '+pay.code+' for '+money(amount))}
 save();closeModal();render();toast(edit?'Payment updated.':'Payment recorded.');
 },true);
}
function invoiceForm(existing){
 const eligible=db.orders.filter(o=>!db.invoices.some(i=>i.orderId===o.id&&i.id!==existing?.id));
 if(!eligible.length){toast('Each order supports one invoice in this version. Create an order first or edit its invoice.','error');return}
 const cur=existing||{},o=order(cur.orderId||eligible[0].id);
 openModal(existing?'Edit invoice':'Create invoice','Tax defaults to ₹0. Check your actual tax obligations.',`<div class="form-grid">${selectField('Order','orderId',eligible.map(x=>({value:x.id,label:x.code+' · '+(customer(x.customerId)?.name||'Unknown')+' · '+money(x.amount)})),cur.orderId||eligible[0].id,true)}${field('Invoice number','number',cur.number||id('INV'),'text',true)}${field('Issue date','date',cur.date||today(),'date',true)}${field('Due date','dueDate',cur.dueDate||'','date')}${field('Subtotal (₹)','subtotal',cur.subtotal??o?.amount??0,'number',true)}${field('Discount (₹)','discount',cur.discount??0,'number')}${field('Tax (₹)','tax',cur.tax??0,'number')}${selectField('Status','status',['Draft','Sent','Partially paid','Paid','Overdue','Cancelled'],cur.status||'Draft',true)}${textareaField('Notes','notes',cur.notes||'')}</div>`,existing?'Save invoice':'Create invoice',fd=>{
 const d=Object.fromEntries(fd.entries()),subtotal=Number(d.subtotal),discount=Number(d.discount||0),tax=Number(d.tax||0);if(!d.orderId||!d.number.trim()||subtotal<0||discount<0||tax<0||discount>subtotal){toast('Check invoice number and amounts.','error');return}
 if(db.invoices.some(i=>i.number===d.number&&i.id!==cur.id)){toast('Invoice number already exists.','error');return}
 const data={...d,subtotal,discount,tax,total:subtotal-discount+tax};
 if(existing)Object.assign(existing,data);else{data.id=id('INV');data.createdAt=new Date().toISOString();db.invoices.push(data);addActivity('Created invoice '+data.number)}
 save();closeModal();render();toast(existing?'Invoice updated.':'Invoice created.');
 },true);
}
function expenseForm(existing){
 const edit=!!existing?.id,cur=existing||{};
 openModal(edit?'Edit expense':'Add expense','Record actual business spending.',`<div class="form-grid">${field('Expense code','code',cur.code||id('EXP'),'text',true)}${field('Category','category',cur.category||'Software','text',true)}${field('Amount (₹)','amount',cur.amount??'','number',true)}${field('Date','date',cur.date||today(),'date',true)}${selectField('Payment method','method',['UPI','Bank transfer','Cash','Card','Other'],cur.method||'UPI')}${textareaField('Description','description',cur.description||'')}</div>`,edit?'Save changes':'Add expense',fd=>{
 const d=Object.fromEntries(fd.entries()),amount=Number(d.amount);if(!d.category.trim()||!Number.isFinite(amount)||amount<=0){toast('Enter a category and amount above zero.','error');return}
 if(db.expenses.some(e=>e.code===d.code&&e.id!==cur.id)){toast('Expense code already exists.','error');return}
 if(edit)Object.assign(cur,{...d,amount});else{db.expenses.push({id:id('EXP'),...d,amount});addActivity('Added expense '+d.category+' for '+money(amount))}
 save();closeModal();render();toast(edit?'Expense updated.':'Expense added.');
 },true);
}
function customerTabContent(c,orders,pays,invs){
 if(detailTab==='Overview')return `<div class="form-grid"><div><span class="text-muted">Customer type</span><p><strong>${esc(c.type)}</strong></p></div><div><span class="text-muted">Email</span><p><strong>${esc(c.email||'—')}</strong></p></div><div><span class="text-muted">City</span><p><strong>${esc(c.city||'—')}</strong></p></div><div><span class="text-muted">Added</span><p><strong>${dateFmt(c.createdAt?.slice(0,10))}</strong></p></div><div class="form-group full"><label>Address</label><p>${esc(c.address||'—')}</p></div><div class="form-group full"><label>Notes</label><p>${esc(c.notes||'—')}</p></div></div>`;
 if(detailTab==='Orders & Services')return table(['Order','Service','Amount','Balance','Status'],orders.map(o=>`<tr><td>${esc(o.code)}</td><td>${esc(service(o.serviceId)?.name||'—')}</td><td>${money(o.amount)}</td><td>${money(Math.max(0,balance(o)))}</td><td>${statusBadge(o.status)}</td></tr>`).join(''),'No orders for this customer.');
 if(detailTab==='Payments')return table(['Payment','Order','Date','Amount','Method','Status'],pays.map(p=>`<tr><td>${esc(p.code)}</td><td>${esc(order(p.orderId)?.code||'—')}</td><td>${dateFmt(p.date)}</td><td>${money(p.amount)}</td><td>${esc(p.method)}</td><td>${statusBadge(p.status)}</td></tr>`).join(''),'No payments for this customer.');
 return table(['Invoice','Order','Date','Total','Status'],invs.map(i=>`<tr><td>${esc(i.number)}</td><td>${esc(order(i.orderId)?.code||'—')}</td><td>${dateFmt(i.date)}</td><td>${money(i.total)}</td><td>${statusBadge(i.status)}</td></tr>`).join(''),'No invoices for this customer.');
}
function showCustomerDetail(cid){
 const c=customer(cid);if(!c)return;customerDetailId=cid;detailTab='Overview';const orders=db.orders.filter(o=>o.customerId===cid),pays=db.payments.filter(p=>orders.some(o=>o.id===p.orderId)),invs=db.invoices.filter(i=>orders.some(o=>o.id===i.orderId)),paid=orders.reduce((s,o)=>s+paidForOrder(o),0),due=orders.reduce((s,o)=>s+Math.max(0,balance(o)),0);
 openModal('Customer profile','',`<div class="detail-header"><div style="display:flex;gap:13px;align-items:center"><div class="person-avatar">${esc(initials(c.name))}</div><div><h2>${esc(c.name)}</h2><p>${esc(c.company||c.type)} · ${esc(c.phone)}</p></div></div><button type="button" class="btn small" data-action="edit-customer:${c.id}">Edit profile</button></div><div class="detail-grid grid" style="padding:16px 18px 0"><div class="detail-stat"><span>Orders</span><strong>${orders.length}</strong></div><div class="detail-stat"><span>Paid / verified</span><strong>${money(paid)}</strong></div><div class="detail-stat"><span>Outstanding</span><strong>${money(due)}</strong></div></div><div class="tabs" id="customerTabs">${['Overview','Orders & Services','Payments','Invoices'].map(t=>`<button type="button" class="tab ${detailTab===t?'active':''}" data-action="customer-tab:${t}">${t}</button>`).join('')}</div><div id="customerDetailBody" class="detail-content">${customerTabContent(c,orders,pays,invs)}</div>`, 'Close',()=>{},true);
 $('#activeForm .modal-foot').innerHTML=`<button type="button" class="btn" data-action="close-modal">Close</button><button type="button" class="btn primary" data-action="add-order-for:${c.id}">＋ Create order</button>`;
}
function showInvoicePreview(iid){
 const i=db.invoices.find(x=>x.id===iid);if(!i)return;const o=order(i.orderId),c=customer(o?.customerId);
 openModal('Invoice preview','Print or save as PDF from the browser print dialog.',`<div class="invoice-paper" id="invoicePaper"><div class="invoice-top"><div style="display:flex;align-items:center;gap:14px"><img src="logo.png" alt="UN Digital Hub logo" style="width:76px;height:76px;object-fit:contain" onerror="this.style.display='none'"><div class="invoice-brand">${esc(db.profile.businessName)}<small>${esc(db.profile.tagline)}<br>${esc(db.profile.address)}<br>${esc(db.profile.email)} · ${esc(db.profile.phone)}</small></div></div><div><div class="invoice-title">INVOICE</div><p style="text-align:right;color:#7a887f;font-size:11px">${esc(i.number)}<br>Issued: ${dateFmt(i.date)}<br>Due: ${dateFmt(i.dueDate)}</p></div></div><div class="invoice-meta"><div><small class="text-muted">BILL TO</small><h3>${esc(c?.name||'Customer')}</h3><div>${esc(c?.company||'')}</div><div>${esc(c?.phone||'')}</div><div>${esc(c?.email||'')}</div><div>${esc(c?.address||c?.city||'')}</div></div><div><small class="text-muted">ORDER DETAILS</small><h3>${esc(o?.code||'—')}</h3><div>${esc(service(o?.serviceId)?.name||'Service')}</div><div>${esc(o?.title||'')}</div></div></div>${table(['Description','Qty','Unit price','Line total'],`<tr><td>${esc(o?.title||service(o?.serviceId)?.name||'Service')}</td><td>1</td><td>${money(i.subtotal)}</td><td>${money(i.subtotal)}</td></tr>`)}<div class="invoice-total"><div><span>Subtotal</span><strong>${money(i.subtotal)}</strong></div><div><span>Discount</span><strong>− ${money(i.discount)}</strong></div><div><span>Tax</span><strong>${money(i.tax)}</strong></div><div class="grand"><span>Total</span><strong>${money(i.total)}</strong></div></div><div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:start;margin-top:28px;padding-top:18px;border-top:1px solid #e6ece8"><div><strong style="display:block;color:#07543f;margin-bottom:9px;font-size:12px">PAYMENT DETAILS</strong>${db.profile.upiId?`<div style="font-size:11px;margin:5px 0"><b>UPI ID:</b> ${esc(db.profile.upiId)}</div>`:''}${db.profile.accountName?`<div style="font-size:11px;margin:5px 0"><b>Account holder:</b> ${esc(db.profile.accountName)}</div>`:''}${db.profile.bankName?`<div style="font-size:11px;margin:5px 0"><b>Bank:</b> ${esc(db.profile.bankName)}</div>`:''}${db.profile.accountNumber?`<div style="font-size:11px;margin:5px 0"><b>Account number:</b> ${esc(db.profile.accountNumber)}</div>`:''}${db.profile.ifsc?`<div style="font-size:11px;margin:5px 0"><b>IFSC:</b> ${esc(db.profile.ifsc)}</div>`:''}${!db.profile.upiId&&!db.profile.accountNumber&&!db.profile.paymentQr?'<div style="font-size:10px;color:#9ba59e">Add payment details in Settings & Backup.</div>':''}<p style="margin-top:18px;font-size:11px;color:#6d7b72">${esc(i.notes||db.profile.invoiceNote||'Thank you.')}</p></div>${db.profile.paymentQr?`<div style="text-align:center;max-width:150px"><img src="${db.profile.paymentQr}" alt="Scan to pay via UPI" style="width:135px;height:135px;object-fit:contain;border:1px solid #e6ece8;padding:5px"><div style="font-size:10px;font-weight:700;margin-top:5px;color:#07543f">SCAN TO PAY</div></div>`:''}</div><p style="font-size:9px;color:#9ba59e;margin-top:15px">Please verify payment details before paying. Tax settings should reflect your actual registration and obligations. This invoice is generated by your local CRM.</p></div>`, 'Close',()=>{},true);
 $('#activeForm .modal-foot').innerHTML=`<button type="button" class="btn" data-action="close-modal">Close</button><button type="button" class="btn" data-action="print-invoice:${iid}">Print / Save PDF</button><button type="button" class="btn primary" data-action="whatsapp-invoice:${iid}">Send via WhatsApp</button>`;
}
function viewOrder(oid){
 const o=order(oid);if(!o)return;const c=customer(o.customerId);
 openModal('Order details',o.code,`<div class="detail-grid grid"><div class="detail-stat"><span>Agreed amount</span><strong>${money(o.amount)}</strong></div><div class="detail-stat"><span>Verified payments</span><strong>${money(paidForOrder(o))}</strong></div><div class="detail-stat"><span>Outstanding</span><strong>${money(Math.max(0,balance(o)))}</strong></div></div><div class="form-grid"><div><label class="text-muted">Customer</label><p><strong>${esc(c?.name||'Unknown')}</strong></p></div><div><label class="text-muted">Service</label><p><strong>${esc(service(o.serviceId)?.name||'—')}</strong></p></div><div><label class="text-muted">Status</label><p>${statusBadge(o.status)}</p></div><div><label class="text-muted">Due date</label><p><strong>${dateFmt(o.dueDate)}</strong></p></div><div class="form-group full"><label>Delivery tracking</label><p><strong>${esc(o.deliveryStatus||'Not started')}</strong> · Promised: ${dateFmt(o.dueDate)} · Delivered: ${dateFmt(o.deliveredDate)}</p><p>${esc(o.deliveryNotes||'—')}</p></div><div class="form-group full"><label>Requirements</label><p>${esc(o.requirements||'—')}</p></div><div class="form-group full"><label>Notes / deliverables</label><p>${esc(o.notes||'—')}</p></div><div class="form-group full"><label>Status history</label>${(o.history||[]).map(h=>`<p class="text-muted">${esc(h.from||'Created')} → <strong>${esc(h.to)}</strong> · ${new Date(h.at).toLocaleString('en-IN')}</p>`).join('')||'—'}</div></div>`, 'Close',()=>{},true);
 $('#activeForm .modal-foot').innerHTML=`<button type="button" class="btn" data-action="close-modal">Close</button><button type="button" class="btn" data-action="edit-order:${oid}">Edit order</button><button type="button" class="btn primary" data-action="add-payment-for:${oid}">＋ Record payment</button>`;
}

function csvCell(v){if(v===null||v===undefined)return '';if(typeof v==='object')v=JSON.stringify(v);return '"'+String(v).replace(/"/g,'""')+'"'}
function toCSV(rows){if(!rows.length)return '';const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))];return [keys.map(csvCell).join(','),...rows.map(r=>keys.map(k=>csvCell(r[k])).join(','))].join('\r\n')}
function download(name,content,type='text/plain;charset=utf-8'){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function exportModule(which){
 if(which==='all'){
  const all=[];
  const groups=[['customer',db.customers],['service',db.services],['order',db.orders],['payment',db.payments],['invoice',db.invoices],['expense',db.expenses],['reminder',db.reminders||[]]];
  groups.forEach(([recordType,rows])=>rows.forEach(row=>all.push({record_type:recordType,...row})));
  if(!all.length){toast('There are no records to export yet.','error');return}
  download('undigitalhub-crm-all-records-'+today()+'.csv',toCSV(all),'text/csv;charset=utf-8');
  toast('All CRM records exported as one Excel-compatible CSV.');
  return;
 }
 let rows=[];
 if(which==='report'){
  const payments=filteredDates(db.payments.filter(p=>p.status==='Verified'));
  const expenses=filteredDates(db.expenses);
  const orders=filteredDates(db.orders);
  const invoices=filteredDates(db.invoices);
  const services=db.services.map(s=>({type:'service_summary',service:s.name,order_count:orders.filter(o=>o.serviceId===s.id).length,order_value:orders.filter(o=>o.serviceId===s.id).reduce((a,o)=>a+Number(o.amount||0),0)}));
  const reportRows=[
   ...services,
   ...orders.map(o=>({type:'order',order:o.code,order_date:o.date,customer:customer(o.customerId)?.name||'',phone:customer(o.customerId)?.phone||'',service:service(o.serviceId)?.name||'',amount:Number(o.amount||0),status:o.status,delivery_status:o.deliveryStatus||'Not started',paid:paidForOrder(o),balance:Math.max(0,balance(o))})),
   ...payments.map(p=>({type:'verified_payment',payment:p.code,payment_date:p.date,order:order(p.orderId)?.code||'',customer:customer(order(p.orderId)?.customerId)?.name||'',amount:Number(p.amount||0),refund:Number(p.refundAmount||0),net_amount:Number(p.amount||0)-Number(p.refundAmount||0),method:p.method,reference:p.reference,status:p.status})),
   ...expenses.map(e=>({type:'expense',expense:e.code,date:e.date,category:e.category,description:e.description,amount:Number(e.amount||0),method:e.method})),
   ...invoices.map(i=>({type:'invoice',invoice:i.number,date:i.date,due_date:i.dueDate,order:order(i.orderId)?.code||'',customer:customer(order(i.orderId)?.customerId)?.name||'',subtotal:i.subtotal,discount:i.discount,tax:i.tax,total:i.total,status:i.status}))
  ];
  const summary=[
   {type:'report_summary',metric:'verified_receipts',value:payments.reduce((n,p)=>n+Number(p.amount||0)-Number(p.refundAmount||0),0),from:reportStart||'All dates',to:reportEnd||'All dates'},
   {type:'report_summary',metric:'expenses',value:expenses.reduce((n,e)=>n+Number(e.amount||0),0),from:reportStart||'All dates',to:reportEnd||'All dates'},
   {type:'report_summary',metric:'net_cash_flow',value:payments.reduce((n,p)=>n+Number(p.amount||0)-Number(p.refundAmount||0),0)-expenses.reduce((n,e)=>n+Number(e.amount||0),0),from:reportStart||'All dates',to:reportEnd||'All dates'},
   {type:'report_summary',metric:'order_value',value:orders.reduce((n,o)=>n+Number(o.amount||0),0),from:reportStart||'All dates',to:reportEnd||'All dates'}
  ];
  rows=[...summary,...reportRows];
  if(!rows.length){toast('No report data found for this period.','error');return}
 }else{
  rows=which==='reminders'?(db.reminders||[]):(db[which]||[]);
 }
 if(!rows.length){toast('There are no records in this section to export yet.','error');return}
 download('undigitalhub-'+which+'-'+today()+'.csv',toCSV(rows),'text/csv;charset=utf-8');
 toast(which==='report'?'Report CSV downloaded. Check your browser Downloads folder.':'CSV downloaded. Open it with Excel.');
}
function backupExport(){download('undigitalhub-crm-backup-'+today()+'.json',JSON.stringify(db,null,2),'application/json');toast('Full JSON backup downloaded. Keep it in a safe place.')}
function backupImport(){const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';inp.onchange=async()=>{const file=inp.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text());const needed=['customers','services','orders','payments','invoices','expenses'];if(!parsed||!needed.every(k=>Array.isArray(parsed[k]))||!parsed.profile)throw new Error('This does not look like a supported UN Digital Hub CRM backup.');if(!confirm('Importing replaces all current CRM records in this browser. Export a backup first. Continue?'))return;db={...emptyState(),...parsed,version:1};save();render();toast('Backup imported successfully.')}catch(e){toast(e.message||'Could not import backup.','error')}};inp.click()}
function demoData(){
 if(db.customers.length||db.orders.length||db.payments.length){toast('Demo data can only be loaded into an empty CRM. Export your backup first.','error');return}
 const c1={id:'CUS-DEMO-001',code:'CUS-DEMO-001',name:'Aarav Kumar',type:'business',company:'Aarav Retail (Demo)',phone:'9000000001',email:'aarav.demo@example.com',city:'Theni',address:'Fictional demo address',notes:'Fictional sample record only.',createdAt:new Date().toISOString()};
 const c2={id:'CUS-DEMO-002',code:'CUS-DEMO-002',name:'Meera S.',type:'student',company:'',phone:'9000000002',email:'meera.demo@example.com',city:'Cumbum',address:'Fictional demo address',notes:'Fictional sample record only.',createdAt:new Date().toISOString()};
 const s1=db.services.find(s=>s.id==='SVC01'),s2=db.services.find(s=>s.id==='SVC05');
 const o1={id:'ORD-DEMO-001',code:'ORD-DEMO-001',customerId:c1.id,serviceId:s1.id,title:'Demo business website',amount:1499,quoted:1499,date:today(),dueDate:'',status:'In progress',requirements:'Fictional sample requirements',notes:'Demo only',history:[{from:null,to:'In progress',at:new Date().toISOString()}],createdAt:new Date().toISOString()};
 const o2={id:'ORD-DEMO-002',code:'ORD-DEMO-002',customerId:c2.id,serviceId:s2.id,title:'Demo project presentation',amount:299,quoted:299,date:today(),dueDate:'',status:'Completed',requirements:'Fictional sample requirements',notes:'Demo only',history:[{from:null,to:'Completed',at:new Date().toISOString()}],createdAt:new Date().toISOString()};
 db.customers.push(c1,c2);db.orders.push(o1,o2);db.payments.push({id:'PAY-DEMO-001',code:'PAY-DEMO-001',orderId:o1.id,amount:500,date:today(),method:'UPI',status:'Verified',reference:'DEMO-NOT-A-REAL-TRANSACTION',refundAmount:0,notes:'Fictional demo payment'});db.invoices.push({id:'INV-DEMO-001',orderId:o1.id,number:'INV-DEMO-001',date:today(),dueDate:'',subtotal:1499,discount:0,tax:0,total:1499,status:'Sent',notes:'Fictional demo invoice'});db.expenses.push({id:'EXP-DEMO-001',code:'EXP-DEMO-001',category:'Software',description:'Fictional demo expense',amount:250,date:today(),method:'UPI'});db.demo=true;addActivity('Loaded fictional demo data');save();render();toast('Fictional demo data loaded. Do not mistake it for real records.')}
function clearDemo(){if(!confirm('Remove all demo records? This clears demo records and any edits made to those records.'))return;db=emptyState();save();render();toast('Demo records cleared.')}
function clearAll(){if(!confirm('This permanently clears all CRM records in this browser, including customers, orders, payments, invoices, expenses and settings. Export a backup first. Continue?'))return;if(!confirm('Final confirmation: clear all local CRM data?'))return;db=emptyState();save();page='dashboard';render();toast('Local CRM data cleared.')}
function sendInvoiceWhatsApp(iid){
 const inv=db.invoices.find(x=>x.id===iid);if(!inv){toast('Invoice not found.','error');return}
 const o=order(inv.orderId),c=customer(o?.customerId);
 if(!c?.phone){toast('This customer has no phone number. Edit the customer profile first.','error');return}
 let phone=String(c.phone).replace(/\D/g,'');
 if(phone.startsWith('0'))phone=phone.slice(1);
 if(phone.length===10)phone='91'+phone;
 if(phone.length<10||phone.length>15){toast('Please check the customer phone number format.','error');return}
 const serviceName=service(o?.serviceId)?.name||'Service';
 const paid=paidForOrder(o||{id:''}),due=Math.max(0,Number(inv.total||0)-paid);
 const message=[
  `Hello ${c.name||'there'},`,
  '',
  `Please find the invoice summary from ${db.profile.businessName||'UN Digital Hub'}.`,
  `Invoice: ${inv.number}`,
  `Order: ${o?.code||'—'}`,
  `Service: ${serviceName}${o?.title?' — '+o.title:''}`,
  `Invoice date: ${dateFmt(inv.date)}`,
  `Due date: ${dateFmt(inv.dueDate)}`,
  `Invoice total: ${money(inv.total)}`,
  `Verified payments: ${money(paid)}`,
  `Balance due: ${money(due)}`,
  '',
  `Payment UPI: ${db.profile.upiId||'Please refer to the invoice'}`,
  '',
  'I will attach the invoice PDF in this chat. Thank you.',
  db.profile.businessName||'UN Digital Hub',
  db.profile.tagline||'Your Digital Growth Partner'
 ].join('\n');
 const url='https://wa.me/'+phone+'?text='+encodeURIComponent(message);
 window.open(url,'_blank','noopener,noreferrer');
 toast('WhatsApp opened with the invoice summary. Print/save the invoice as PDF, then attach it in the chat and tap Send.');
}
function printInvoice(iid){const i=db.invoices.find(x=>x.id===iid);if(!i)return;closeModal();page='invoices';render();showInvoicePreview(iid);setTimeout(()=>window.print(),250)}
function handleAction(action){
 if(action==='close-modal'){closeModal();return}
 if(action==='add-customer'){customerForm();return}
 if(action==='add-order'){orderForm();return}
 if(action==='add-reminder'){reminderForm();return}
 if(action==='add-payment'){paymentForm();return}
 if(action==='add-invoice'){invoiceForm();return}
 if(action==='add-expense'){expenseForm();return}
 if(action==='backup-export'){backupExport();return}
 if(action==='remove-payment-qr'){db.profile.paymentQr='';save();render();toast('Payment QR removed.');return}
 if(action==='backup-import'){backupImport();return}
 if(action==='load-demo'){demoData();return}
 if(action==='clear-demo'){clearDemo();return}
 if(action==='clear-all'){clearAll();return}
 if(action==='clear-report'){reportStart='';reportEnd='';render();return}
 if(action.startsWith('go:')){page=action.split(':')[1];render();return}
 if(action.startsWith('export:')){exportModule(action.split(':')[1]);return}
 if(action.startsWith('edit-customer:')){const c=customer(action.split(':')[1]);if(c)customerForm(c);return}
 if(action.startsWith('customer-detail:')){showCustomerDetail(action.split(':')[1]);return}
 if(action.startsWith('customer-tab:')){detailTab=action.slice('customer-tab:'.length);const c=customer(customerDetailId);if(c){const orders=db.orders.filter(o=>o.customerId===c.id),pays=db.payments.filter(p=>orders.some(o=>o.id===p.orderId)),invs=db.invoices.filter(i=>orders.some(o=>o.id===i.orderId));$('#customerTabs').innerHTML=['Overview','Orders & Services','Payments','Invoices'].map(t=>`<button type="button" class="tab ${detailTab===t?'active':''}" data-action="customer-tab:${t}">${t}</button>`).join('');$('#customerDetailBody').innerHTML=customerTabContent(c,orders,pays,invs)}return}
 if(action.startsWith('add-order-for:')){const cid=action.split(':')[1];closeModal();orderForm({customerId:cid});return}
 if(action.startsWith('edit-service:')){const s=service(action.split(':')[1]);if(s)serviceForm(s);return}
 if(action.startsWith('toggle-service:')){const s=service(action.split(':')[1]);if(s){s.active=!s.active;save();render();toast('Service status updated.')}return}
 if(action.startsWith('edit-reminder:')){const r=db.reminders.find(x=>x.id===action.split(':')[1]);if(r)reminderForm(r);return}
 if(action.startsWith('complete-reminder:')){const r=db.reminders.find(x=>x.id===action.split(':')[1]);if(r){r.status='Completed';r.completedAt=new Date().toISOString();save();render();toast('Reminder marked complete.')}return}
 if(action.startsWith('delete-reminder:')){const rid=action.split(':')[1];if(confirm('Delete this reminder?')){db.reminders=db.reminders.filter(r=>r.id!==rid);save();render();toast('Reminder deleted.')}return}
 if(action.startsWith('edit-order:')){const o=order(action.split(':')[1]);if(o)orderForm(o);return}
 if(action.startsWith('view-order:')){viewOrder(action.split(':')[1]);return}
 if(action.startsWith('add-payment-for:')){const oid=action.split(':')[1];closeModal();paymentForm({orderId:oid});return}
 if(action.startsWith('edit-payment:')){const p=db.payments.find(x=>x.id===action.split(':')[1]);if(p)paymentForm(p);return}
 if(action.startsWith('verify-payment:')){const p=db.payments.find(x=>x.id===action.split(':')[1]);if(p&&confirm('Mark this payment as verified? Confirm that the money has actually reached your account.')){p.status='Verified';p.verifiedAt=new Date().toISOString();addActivity('Verified payment '+p.code);save();render();toast('Payment marked verified.')}return}
 if(action.startsWith('whatsapp-invoice:')){sendInvoiceWhatsApp(action.split(':')[1]);return}
 if(action.startsWith('preview-invoice:')){showInvoicePreview(action.split(':')[1]);return}
 if(action.startsWith('print-invoice:')){printInvoice(action.split(':')[1]);return}
 if(action.startsWith('edit-invoice:')){const i=db.invoices.find(x=>x.id===action.split(':')[1]);if(i)invoiceForm(i);return}
 if(action.startsWith('edit-expense:')){const e=db.expenses.find(x=>x.id===action.split(':')[1]);if(e)expenseForm(e);return}
 if(action.startsWith('delete-expense:')){const eid=action.split(':')[1];confirmAction('Delete this expense record?',()=>{db.expenses=db.expenses.filter(e=>e.id!==eid);save();render();toast('Expense deleted.')});return}
}
document.addEventListener('click',e=>{
 const nav=e.target.closest('[data-page]');if(nav){page=nav.dataset.page;closeModal();render();$('#sidebar').classList.remove('open');return}
 const a=e.target.closest('[data-action]');if(a){if(e.target===a&&a.classList.contains('modal-backdrop'))return;handleAction(a.dataset.action);return}
});
$('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
document.addEventListener('input',e=>{
 if(e.target.id==='customerSearch'){customerSearch=e.target.value;const pos=e.target.selectionStart;render();const el=$('#customerSearch');el.focus();el.setSelectionRange(pos,pos)}
 if(e.target.id==='orderSearch'){orderSearch=e.target.value;const pos=e.target.selectionStart;render();const el=$('#orderSearch');el.focus();el.setSelectionRange(pos,pos)}
 if(e.target.id==='paySearch'){paySearch=e.target.value;const pos=e.target.selectionStart;render();const el=$('#paySearch');el.focus();el.setSelectionRange(pos,pos)}
 if(e.target.id==='invoiceSearch'){invoiceSearch=e.target.value;const pos=e.target.selectionStart;render();const el=$('#invoiceSearch');el.focus();el.setSelectionRange(pos,pos)}
 if(e.target.id==='expenseSearch'){expenseSearch=e.target.value;const pos=e.target.selectionStart;render();const el=$('#expenseSearch');el.focus();el.setSelectionRange(pos,pos)}
});
document.addEventListener('change',e=>{
 if(e.target.id==='reportStart'){reportStart=e.target.value;render()}
 if(e.target.id==='reportEnd'){reportEnd=e.target.value;render()}
});
document.addEventListener('change',e=>{if(e.target.id==='paymentQrFile'){const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/')){toast('Choose an image file for the payment QR.','error');return}if(file.size>1500000){toast('Please use a QR image smaller than 1.5 MB.','error');return}const reader=new FileReader();reader.onload=()=>{db.profile.paymentQr=reader.result;save();render();toast('Payment QR saved. It will appear on invoices.')};reader.readAsDataURL(file)}});
document.addEventListener('submit',e=>{
 if(e.target.id==='profileForm'){e.preventDefault();const d=Object.fromEntries(new FormData(e.target).entries());delete d.paymentQrFile;db.profile={...db.profile,...d};save();render();toast('Business and payment details saved.')}
});
window.addEventListener('storage',()=>{db=loadDB();render()});
render();
