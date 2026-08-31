const ADMIN_USER = "admin";
const ADMIN_PASS = "12345";

const API_URL =
  "https://script.google.com/macros/s/AKfycbzW8Ns6d74iNImmvpd66hMntXbbd1sY8Rr-LH4zzPYiqaUXnXGK8KxgxnxnWud_n-L0/exec";

let allBookings = [];


// ===============================
// ADMIN LOGIN
// ===============================
function login() {

  const username =
    document.getElementById("adminUser").value.trim();

  const password =
    document.getElementById("adminPass").value;

  if (
    username === ADMIN_USER &&
    password === ADMIN_PASS
  ) {

    sessionStorage.kdAdmin = "1";

    showPanel();

  } else {

    document.getElementById("loginMsg").textContent =
      "Wrong username or password.";

  }
}


// ===============================
// LOGOUT
// ===============================
function logout() {

  sessionStorage.removeItem("kdAdmin");

  location.reload();

}


// ===============================
// SHOW ADMIN PANEL
// ===============================
function showPanel() {

  document.getElementById("loginBox").hidden = true;

  document.getElementById("panel").hidden = false;

  renderAll();

}


// ===============================
// CHECK LOGIN
// ===============================
document.addEventListener(
  "DOMContentLoaded",
  function () {

    if (sessionStorage.kdAdmin === "1") {

      showPanel();

    }

  }
);


// ===============================
// ESCAPE HTML
// ===============================
function esc(value) {

  return String(value ?? "").replace(
    /[&<>"']/g,
    function (m) {

      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"

      }[m];

    }
  );

}


// ===============================
// LOAD BOOKINGS FROM GOOGLE SHEET
// ===============================
async function loadBookings() {

  try {

    const response = await fetch(
      API_URL +
      "?action=list&t=" +
      Date.now(),
      {
        method: "GET",
        cache: "no-store"
      }
    );

    const data = await response.json();

    if (!Array.isArray(data)) {

      allBookings = [];

      return [];

    }

    allBookings = data;

    return data;

  } catch (error) {

    console.error(error);

    allBookings = [];

    return [];

  }

}


// ===============================
// RENDER BOOKINGS
// ===============================
async function renderBookings() {

  const list =
    document.getElementById("bookings");

  if (!list) return;

  list.innerHTML =
    "<p>⏳ Bookings loading...</p>";

  const data =
    await loadBookings();

  const searchBox =
    document.getElementById("search");

  const query =
    searchBox
      ? searchBox.value.toLowerCase().trim()
      : "";


  const filtered =
    data.filter(function (booking) {

      const text =
        (
          (booking.id || "") +
          " " +
          (booking.name || "") +
          " " +
          (booking.mobile || "") +
          " " +
          (booking.service || "") +
          " " +
          (booking.from || "") +
          " " +
          (booking.to || "")
        ).toLowerCase();

      return text.includes(query);

    });


  if (!filtered.length) {

    list.innerHTML =
      "<p>📭 No bookings found.</p>";

    updateCounters(data);

    return;

  }


  list.innerHTML =
    filtered.map(function (booking) {

      const status =
        booking.status || "New";


      const receiptUrl =
        "receipt.html?" +
        "id=" +
        encodeURIComponent(
          booking.id || ""
        ) +
        "&name=" +
        encodeURIComponent(
          booking.name || ""
        ) +
        "&mobile=" +
        encodeURIComponent(
          booking.mobile || ""
        ) +
        "&from=" +
        encodeURIComponent(
          booking.from || ""
        ) +
        "&to=" +
        encodeURIComponent(
          booking.to || ""
        ) +
        "&date=" +
        encodeURIComponent(
          booking.date || ""
        ) +
        "&service=" +
        encodeURIComponent(
          booking.service || ""
        );


      const whatsappText =
        "KD GOLDEN TRAVELS BOOKING\n\n" +
        "Booking ID: " +
        (booking.id || "") +
        "\nName: " +
        (booking.name || "") +
        "\nMobile: " +
        (booking.mobile || "") +
        "\nService: " +
        (booking.service || "") +
        "\nFrom: " +
        (booking.from || "") +
        "\nTo: " +
        (booking.to || "") +
        "\nTravel Date: " +
        (booking.date || "") +
        "\nStatus: " +
        status;


      const whatsappUrl =
        "https://wa.me/91" +
        encodeURIComponent(
          String(booking.mobile || "")
            .replace(/\D/g, "")
        ) +
        "?text=" +
        encodeURIComponent(
          whatsappText
        );


      return `
        <div class="adminrow">

          <b>
            👤 ${esc(booking.name)}
          </b>

          • ${esc(booking.mobile)}

          <br>

          🆔 Booking ID:
          <b>${esc(booking.id)}</b>

          <br>

          🚗 ${esc(booking.service)}

          | 📅 ${esc(booking.date)}

          <br>

          📍 ${esc(booking.from)}
          →
          ${esc(booking.to)}

          ${
            booking.car
              ? `<br>🚘 Car: ${esc(booking.car)}`
              : ""
          }

          ${
            booking.passengers
              ? `<br>👥 Passengers: ${esc(booking.passengers)}`
              : ""
          }

          ${
            booking.message
              ? `<br>💬 ${esc(booking.message)}`
              : ""
          }

          <br><br>

          <label>
            <b>Status:</b>
          </label>

          <select
            onchange="
              changeStatus(
                '${esc(booking.id)}',
                this.value
              )
            "
          >

            <option value="New"
              ${status === "New" ? "selected" : ""}>
              🆕 New
            </option>

            <option value="Confirmed"
              ${status === "Confirmed" ? "selected" : ""}>
              ✅ Confirmed
            </option>

            <option value="Completed"
              ${status === "Completed" ? "selected" : ""}>
              ✔️ Completed
            </option>

            <option value="Cancelled"
              ${status === "Cancelled" ? "selected" : ""}>
              ❌ Cancelled
            </option>

          </select>

          <br>

          <a
            class="btn small"
            href="${receiptUrl}"
            target="_blank"
          >
            🧾 Receipt
          </a>

          <a
            class="btn small"
            href="${whatsappUrl}"
            target="_blank"
          >
            💬 WhatsApp
          </a>

        </div>
      `;

    }).join("");


  updateCounters(data);

}


// ===============================
// CHANGE STATUS
// ===============================
async function changeStatus(
  bookingId,
  newStatus
) {

  if (!bookingId) {

    alert("Booking ID missing");

    return;

  }


  try {

    const url =
      API_URL +
      "?action=status" +
      "&id=" +
      encodeURIComponent(
        bookingId
      ) +
      "&status=" +
      encodeURIComponent(
        newStatus
      ) +
      "&t=" +
      Date.now();


    const response =
      await fetch(
        url,
        {
          method: "GET",
          cache: "no-store"
        }
      );


    const result =
      await response.json();


    if (!result.success) {

      alert(
        "Status update failed:\n" +
        (result.message ||
          "Unknown error")
      );

      await renderBookings();

      return;

    }


    await renderBookings();


  } catch (error) {

    alert(
      "Status update error:\n" +
      error.message
    );

  }

}


// ===============================
// COUNTERS
// ===============================
function updateCounters(data) {

  const total =
    document.getElementById("total");

  const newCount =
    document.getElementById("newCount");

  const confirmed =
    document.getElementById("confirmed");

  const completed =
    document.getElementById("completed");


  if (total) {

    total.textContent =
      data.length;

  }


  if (newCount) {

    newCount.textContent =
      data.filter(function (x) {

        return (
          x.status || "New"
        ) === "New";

      }).length;

  }


  if (confirmed) {

    confirmed.textContent =
      data.filter(function (x) {

        return x.status === "Confirmed";

      }).length;

  }


  if (completed) {

    completed.textContent =
      data.filter(function (x) {

        return x.status === "Completed";

      }).length;

  }

}


// ===============================
// SEARCH
// ===============================
function searchBookings() {

  renderBookings();

}


// ===============================
// REFRESH
// ===============================
function refreshBookings() {

  renderBookings();

}


// ===============================
// PACKAGES
// ===============================
function packages() {

  return (
    JSON.parse(
      localStorage.getItem(
        "kdPackages"
      ) || "null"
    )
    ||
    [

      {
        name:
          "Kashmir Tour",

        price:
          "Starting ₹12,999",

        desc:
          "Beautiful valleys, mountains and unforgettable experiences.",

        image:
          "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80"
      },


      {
        name:
          "Goa Tour",

        price:
          "Starting ₹8,999",

        desc:
          "Beaches, sightseeing and exciting activities.",

        image:
          "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80"
      },


      {
        name:
          "Char Dham Yatra",

        price:
          "Custom Package",

        desc:
          "A memorable spiritual journey with complete travel support.",

        image:
          "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80"
      }

    ]
  );

}


// ===============================
// ADD PACKAGE
// ===============================
function addPackage() {

  const name =
    document.getElementById(
      "pName"
    ).value.trim();


  const price =
    document.getElementById(
      "pPrice"
    ).value.trim();


  const desc =
    document.getElementById(
      "pDesc"
    ).value.trim();


  const image =
    document.getElementById(
      "pImage"
    ).value.trim();


  if (!name) {

    alert(
      "Package name required"
    );

    return;

  }


  const list =
    packages();


  list.push({

    name:
      name,

    price:
      price,

    desc:
      desc,

    image:
      image

  });


  localStorage.setItem(
    "kdPackages",
    JSON.stringify(list)
  );


  document.getElementById(
    "pName"
  ).value = "";


  document.getElementById(
    "pPrice"
  ).value = "";


  document.getElementById(
    "pDesc"
  ).value = "";


  document.getElementById(
    "pImage"
  ).value = "";


  renderPackages();

}


// ===============================
// DELETE PACKAGE
// ===============================
function delPackage(i) {

  const list =
    packages();


  list.splice(
    i,
    1
  );


  localStorage.setItem(
    "kdPackages",
    JSON.stringify(list)
  );


  renderPackages();

}


// ===============================
// RENDER PACKAGES
// ===============================
function renderPackages() {

  const element =
    document.getElementById(
      "adminPackages"
    );


  if (!element) return;


  element.innerHTML =
    packages().map(
      function (p, i) {

        return `

          <div class="adminpackage">

            <img
              src="${esc(p.image)}"
            >

            <div>

              <b>
                ${esc(p.name)}
              </b>

              <br>

              ${esc(p.price)}

              <br>

              <button
                onclick="
                  delPackage(${i})
                "
              >
                Delete
              </button>

            </div>

          </div>

        `;

      }
    ).join("");

}


// ===============================
// RENDER EVERYTHING
// ===============================
function renderAll() {

  renderPackages();

  renderBookings();

}
