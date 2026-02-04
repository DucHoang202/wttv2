(function () {
    const API_BASE = "https://wttbe.metapress.ai/";
    const LOGIN_PAGE = "/login.html";
    const CHECK_USER_ENDPOINT = "api/user-check";

    const getToken = () => localStorage.getItem("auth_token") || "";
    const clearToken = () => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
    };
    const redirectLogin = () => {
        if (!location.pathname.endsWith(LOGIN_PAGE)) {
            location.href = LOGIN_PAGE;
        }
    };

    async function guard() {
        const token = getToken();
        if (!token) return redirectLogin();

        try {
            const res = await fetch(API_BASE + CHECK_USER_ENDPOINT, {
                headers: { Authorization: "Bearer " + token, Accept: "application/json" },
            });
            if (!res.ok) throw new Error("Unauthorized");

            const response = await res.json();

            if (!response || (response.user.role && response.user.role !== "admin")) {
                clearToken();
                redirectLogin();
                return;
            }
            localStorage.setItem("auth_user", JSON.stringify(user));
            
        } catch (err) {
            //clearToken();
            //redirectLogin();
        }
    }

    // Chỉ chạy guard nếu không phải trang login
    if (!location.pathname.endsWith(LOGIN_PAGE)) {
        guard();
    }
})();