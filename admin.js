const ADMIN_USER = "admin";
const ADMIN_PASS = "12345";

const API_URL =
"https://script.google.com/macros/s/AKfycbzW8Ns6d74iNImmvpd66hMntXbbd1sY8Rr-LH4zzPYiqaUXnXGK8KxgxnxnWud_n-L0/exec";

let allBookings = [];

function login(){
  const u = document.getElementById("adminUser").value.trim();
  const p = document.getElementById("adminPass").value;

  if(u === ADMIN_USER && p === ADMIN_PASS){
    sessionStorage.kdAdmin = "1";
    showPanel();
  }else{
    document.getElementById("loginMsg").textContent =
      "Wrong username or password.";
  }
}

function logout(){
  sessionStorage.removeItem("kdAdmin");
  location.reload();
}

function showPanel(){
  document.getElementById("loginBox").hidden = true;
  document.getElementById("panel").hidden = false;
  renderAll();
}

document.addEventListener("DOMContentLoaded",()=>{
  if(sessionStorage.kdAdmin === "1"){
    showPanel();
  }
});

function esc(x){
  return String(x ?? "").replace(/[&<>"']/g,m=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[m]));
}


// ==============================
// LOAD ONLINE BOOKINGS
// ==============================
async function bookings(){

  try{

    const response = await fetch(
      API_URL + "?action=list&t=" + Date.now(),
      {cache:"no-store"}
    );

    const data = await response.json();

    if(!Array.isArray(data)){
      return [];
    }

    allBookings = data;

    return data;

  }catch(error){

    console.error(error);

    document.getElementById("bookings").innerHTML =
      "<p>❌ Online database connection error.</p>";

    return [];
  }
}


// ==============================
// RENDER BOOKINGS
// ==============================
async function renderBookings(){

  const list = document.getElementById("bookings");

  list.innerHTML =
    "<p>⏳ Bookings loading...</p>";

  const data = await bookings();

  const searchBox = document.getElementById("search");

  const q = searchBox
    ? searchBox.value.toLowerCase().trim()
    : "";

  const filtered = data.filter(x => {

    const text =
      `${x.name || ""} ${x.mobile || ""} ${x.service || ""} ${x.id || ""}`
      .toLowerCase();

    return text.includes(q);
  });

  if(!filtered.length){

    list.innerHTML =
      "<p>📭 No bookings found.</p>";

    updateCounters(data);

    return;
  }

  list.innerHTML = filtered.map(x => {

    const statusValue = x.status || "New";

    const receipt =
      "receipt.html?" +
      "id=" + encodeURIComponent(x.id || "") +
      "&name=" + encodeURIComponent(x.name || "") +
      "&mobile=" + encodeURIComponent(x.mobile || "") +
      "&from=" + encodeURIComponent(x.from || "") +
      "&to=" + encodeURIComponent(x.to || "") +
      "&date=" + encodeURIComponent(x.date || "") +
      "&service=" + encodeURIComponent(x.service || "");

    const waText =
      `KD GOLDEN TRAVELS BOOKING%0A` +
      `Booking ID: ${encodeURIComponent(x.id || "")}%0A` +
      `Name: ${encodeURIComponent(x.name || "")}%0A` +
      `Service: ${encodeURIComponent(x.service || "")}%0A` +
      `From: ${encodeURIComponent(x.from || "")}%0A` +
      `To: ${encodeURIComponent(x.to || "")}`;

    return `
      <div class="adminrow">

        <b>👤 ${esc(x.name)}</b>
        • ${esc(x.mobile)}

        <br>

        🆔 Booking ID:
        <b>${esc(x.id)}</b>

        <br>

        🚗 ${esc(x.service)}

        | 📅 ${esc(x.date)}

        <br>

        📍 ${esc(x.from)}
        →
        ${esc(x.to)}

        <br>

        ${x.car ? "🚘 Car: " + esc(x.car) + "<br>" : ""}

        ${x.passengers
          ? "👥 Passengers: " + esc(x.passengers) + "<br>"
          : ""}

        ${x.message
          ? "💬 " + esc(x.message) + "<br>"
          : ""}

        <br>

        <select
          onchange="changeStatus('${esc(x.id)}',this.value)"
        >

          <option value="New"
            ${statusValue==="New"?"selected":""}>
            🆕 New
          </option>

          <option value="Confirmed"
            ${statusValue==="Confirmed"?"selected":""}>
            ✅ Confirmed
          </option>

          <option value="Completed"
            ${statusValue==="Completed"?"selected":""}>
            ✔️ Completed
          </option>

          <option value="Cancelled"
            ${statusValue==="Cancelled"?"selected":""}>
            ❌ Cancelled
          </option>

        </select>

        <a
          class="btn small"
          href="${receipt}"
          target="_blank"
        >
          🧾 Receipt
        </a>

        <a
          class="btn small"
          href="https://wa.me/91${esc(x.mobile)}?text=${waText}"
          target="_blank"
        >
          💬 WhatsApp
        </a>

      </div>
    `;

  }).join("");

  updateCounters(data);
}


// ==============================
// STATUS UPDATE
// ==============================
async function changeStatus(id,statusValue){

  if(!id){
    alert("Booking ID missing");
    return;
  }

  try{

    const url =
      API_URL +
      "?action=status" +
      "&id=" + encodeURIComponent(id) +
      "&status=" + encodeURIComponent(statusValue) +
      "&t=" + Date.now();

    const response = await fetch(
      url,
      {cache:"no-store"}
    );

    const result = await response.json();

    if(!result.success){

      alert(
        "Status update failed: " +
        (result.message || "Unknown error")
      );

      return;
    }

    await renderBookings();

  }catch(error){

    alert(
      "Status update error: " +
      error.message
    );
  }
}


// ==============================
// COUNTERS
// ==============================
function updateCounters(a){

  document.getElementById("total").textContent =
    a.length;

  document.getElementById("newCount").textContent =
    a.filter(x =>
      (x.status || "New") === "New"
    ).length;

  document.getElementById("confirmed").textContent =
    a.filter(x =>
      x.status === "Confirmed"
    ).length;

  document.getElementById("completed").textContent =
    a.filter(x =>
      x.status === "Completed"
    ).length;
}


// ==============================
// SEARCH
// ==============================
function searchBookings(){

  renderBookings();
}


// ==============================
// REFRESH
// ==============================
function refreshBookings(){

  renderAll();
}


// ==============================
// PACKAGES
// ==============================
function packages(){

  return JSON.parse(
    localStorage.getItem("kdPackages") || "null"
  ) || [

    {
      name:"Kashmir Tour",
      price:"Starting ₹12,999",
      desc:"Beautiful valleys, mountains and unforgettable experiences.",
      image:"https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80"
    },

    {
      name:"Goa Tour",
      price:"Starting ₹8,999",
      desc:"Beaches, sightseeing and exciting activities.",
      image:"https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80"
    },

    {
      name:"Char Dham Yatra",
      price:"Custom Package",
      desc:"A memorable spiritual journey with complete travel support.",
      image:"https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80"
    }

  ];
}


function addPackage(){

  const p = {

    name:
      document.getElementById("pName").value.trim(),

    price:
      document.getElementById("pPrice").value.trim(),

    desc:
      document.getElementById("pDesc").value.trim(),

    image:
      document.getElementById("pImage").value.trim()

  };

  if(!p.name){

    alert("Package name required");

    return;
  }

  const a = packages();

  a.push(p);

  localStorage.setItem(
    "kdPackages",
    JSON.stringify(a)
  );

  document.getElementById("pName").value="";
  document.getElementById("pPrice").value="";
  document.getElementById("pImage").value="";
  document.getElementById("pDesc").value="";

  renderPackages();
}


function delPackage(i){

  const a = packages();

  a.splice(i,1);

  localStorage.setItem(
    "kdPackages",
    JSON.stringify(a)
  );

  renderPackages();
}


function renderPackages(){

  const el =
    document.getElementById("adminPackages");

  if(!el) return;

  el.innerHTML =
    packages().map((p,i)=>`

      <div class="adminpackage">

        <img src="${esc(p.image)}">

        <div>

          <b>${esc(p.name)}</b>

          <br>

          ${esc(p.price)}

          <br>

          <button onclick="delPackage(${i})">
            Delete
          </button>

        </div>

      </div>

    `).join("");
}


// ==============================
// ALL
// ==============================
function renderAll(){

  renderPackages();
  renderBookings();
}
