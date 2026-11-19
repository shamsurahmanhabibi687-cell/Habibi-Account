const $=s=>document.querySelector(s);
const fa=n=>new Intl.NumberFormat('fa-IR').format(n||0);
const today=new Date();
$('#today').textContent=new Intl.DateTimeFormat('fa-IR',{year:'numeric',month:'long',day:'numeric'}).format(today);
const DB='HabibiAccountingDB', STORE='records';
let db;
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE,{keyPath:'id',autoIncrement:true})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
function all(){return new Promise((resolve,reject)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function save(record){return new Promise((resolve,reject)=>{const r=db.transaction(STORE,'readwrite').objectStore(STORE).add(record);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error)})}
function render(records){const day=today.toISOString().slice(0,10);const sum=(type,filter)=>records.filter(x=>x.type===type&&filter(x)).reduce((a,x)=>a+Number(x.amount||0),0);
$('#todaySales').textContent=fa(sum('sale',x=>x.date===day));
$('#todayExpenses').textContent=fa(sum('expense',x=>x.date===day));
$('#receivables').textContent=fa(sum('sale',x=>x.status==='credit'));
$('#payables').textContent=fa(sum('purchase',x=>x.status==='credit'));
const recent=records.slice(-5).reverse();
$('#recent').innerHTML=recent.length?recent.map(x=>`<p>${x.label} — ${fa(x.amount)} افغانی</p>`).join(''):'<p class="muted">هنوز معامله‌ای ثبت نشده است.</p>';
}
const labels={sales:'فروش',purchases:'خرید',items:'اجناس و انبار',customers:'مشتریان',suppliers:'تأمین‌کنندگان',expenses:'مصارف',cash:'صندوق و بانک',reports:'گزارش‌ها',settings:'تنظیمات و پشتیبان'};
function showPage(key){const p=$('#page');p.innerHTML=`<h2>${labels[key]}</h2>`;
if(key==='sales'||key==='purchases'||key==='expenses'){const type=key==='sales'?'sale':key==='purchases'?'purchase':'expense';p.innerHTML+=`<form id="entry"><label>شرح معامله<input name="label" required placeholder="مثلاً فروش اجناس"></label><label>مبلغ (افغانی)<input name="amount" type="number" min="0.01" step="0.01" required></label><label>تاریخ<input name="date" type="date" value="${new Date().toISOString().slice(0,10)}" required></label><label>نوع پرداخت<select name="status"><option value="cash">نقدی</option><option value="credit">اعتباری</option></select></label><button class="primary">ثبت معامله</button></form><p class="muted">این نسخه آغازین، ثبت ساده معاملات را به‌صورت محلی در همین دستگاه نگهداری می‌کند.</p>`;
$('#entry').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);await save({type,label:f.get('label'),amount:Number(f.get('amount')),date:f.get('date'),status:f.get('status')});render(await all());showPage(key);};}
else if(key==='settings'){p.innerHTML+=`<p>اطلاعات این نسخه در حافظه مرورگر همین دستگاه ذخیره می‌شود.</p><button id="backup" class="primary">گرفتن نسخه پشتیبان (JSON)</button><p class="muted">فایل پشتیبان را در جای امن نگهداری کنید. حذف داده‌های مرورگر ممکن است اطلاعات را پاک کند.</p>`;$('#backup').onclick=async()=>{const blob=new Blob([JSON.stringify(await all(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='habibi-accounting-backup.json';a.click();URL.revokeObjectURL(a.href)};}
else p.innerHTML+=`<p class="muted">این بخش در مرحله بعدی تکمیل می‌شود. اطلاعات این بخش هنوز برای ثبت عملیاتی فعال نیست.</p>`;
}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
(async()=>{if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});db=await openDB();render(await all())})();
