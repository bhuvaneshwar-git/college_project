let authgearClient = null;

// ✅ Configure Authgear client
const configureClient = async () => {
  authgearClient = window.authgear.default;

  await authgearClient
    .configure({
      endpoint: "https://install-gxwpq4.authgear.cloud",
      clientID: "11a3a280bbc31c7d",
      redirectURI: "http://localhost:3000/", // unified URI with trailing slash
      sessionType: "refresh_token",
    })
    .then(
      () => {
        console.log("✅ Authgear client successfully configured!");
      },
      (err) => {
        console.error("❌ Failed to configure Authgear:", err);
      }
    );
};

// ✅ Login function
const login = async () => {
  if (!authgearClient) {
    console.error("Authgear client not initialized yet!");
    return;
  }

  await authgearClient
    .startAuthentication({
      redirectURI: "http://localhost:3000/", // must match configure()
      prompt: "login",
    })
    .then(
      () => {
        console.log("🔐 Login started...");
      },
      (err) => {
        console.error("❌ Login failed:", err);
      }
    );
};

// ✅ Logout function
const logout = async () => {
  if (!authgearClient) return;

  await authgearClient
    .logout({
      redirectURI: "http://localhost:3000/", // match same origin
    })
    .then(
      () => {
        console.log("👋 Logged out successfully");
      },
      (err) => {
        console.error("❌ Logout failed:", err);
      }
    );

  updateUI();
};

// ✅ Open Authgear user settings
const openUserSettings = () => {
  if (authgearClient) {
    authgearClient.open("/settings");
  }
};

// ✅ Update UI buttons dynamically
const updateUI = async () => {
  const isAuthenticated = authgearClient?.sessionState === "AUTHENTICATED";

  document.getElementById("btn-login").disabled = isAuthenticated;
  document.getElementById("btn-logout").disabled = !isAuthenticated;
  document.getElementById("btn-settings").disabled = !isAuthenticated;

  console.log("🔄 Auth state:", isAuthenticated ? "Logged In" : "Logged Out");
};

// ✅ Run after page loads
window.onload = async () => {
  await configureClient();
  updateUI();

  const query = window.location.search;
  if (query.includes("code=")) {
    await authgearClient.finishAuthentication();
    updateUI();

    // remove query params from URL
    window.history.replaceState({}, document.title, "/");
  }
};

// -------------------------------------------------

// let authgearClient = null;

// // ✅ Configure Authgear client
// const configureClient = async () => {
//   authgearClient = window.authgear.default;

//   await authgearClient
//     .configure({
//       endpoint: "https://install-gxwpq4.authgear.cloud",
//       clientID: "11a3a280bbc31c7d",
//       redirectURI: "http://localhost:3000/", // unified URI with trailing slash
//       sessionType: "refresh_token",
//     })
//     .then(
//       () => {
//         console.log("✅ Authgear client successfully configured!");
//       },
//       (err) => {
//         console.error("❌ Failed to configure Authgear:", err);
//       }
//     );
// };

// // ✅ Login function
// const login = async () => {
//   if (!authgearClient) {
//     console.error("Authgear client not initialized yet!");
//     return;
//   }

//   await authgearClient
//     .startAuthentication({
//       redirectURI: "http://localhost:3000/", // must match configure()
//       prompt: "login",
//     })
//     .then(
//       () => {
//         console.log("🔐 Login started...");
//       },
//       (err) => {
//         console.error("❌ Login failed:", err);
//       }
//     );
// };

// // ✅ Logout function
// const logout = async () => {
//   if (!authgearClient) return;

//   await authgearClient
//     .logout({
//       redirectURI: "http://localhost:3000/", // match same origin
//     })
//     .then(
//       () => {
//         console.log("👋 Logged out successfully");
//       },
//       (err) => {
//         console.error("❌ Logout failed:", err);
//       }
//     );

//   updateUI();
// };

// // ✅ Open Authgear user settings
// const openUserSettings = () => {
//   if (authgearClient) {
//     authgearClient.open("/settings");
//   }
// };

// // ✅ Update UI buttons dynamically
// const updateUI = async () => {
//   const isAuthenticated = authgearClient?.sessionState === "AUTHENTICATED";

//   document.getElementById("btn-login").disabled = isAuthenticated;
//   document.getElementById("btn-logout").disabled = !isAuthenticated;
//   document.getElementById("btn-settings").disabled = !isAuthenticated;

//   console.log("🔄 Auth state:", isAuthenticated ? "Logged In" : "Logged Out");
// };

// // ✅ Run after page loads
// window.onload = async () => {
//   await configureClient();
//   updateUI();

//   const query = window.location.search;
//   if (query.includes("code=")) {
//     await authgearClient.finishAuthentication();
//     updateUI();

//     // remove query params from URL
//     window.history.replaceState({}, document.title, "/");
//   }
// };
