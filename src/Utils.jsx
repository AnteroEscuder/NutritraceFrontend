import React, { useEffect, useMemo, useState } from "react";
return { goal, loading, upsert, refresh: load };
}


function useMeals(userId?: number | null, token?: string | null) {
const [meals, setMeals] = useState<any[]>([]);
const [loading, setLoading] = useState(false);


const list = async (d?: string) => {
if (!userId || !token) return;
setLoading(true);
const url = new URL(`${API_BASE}/meals/user/${userId}`);
if (d) url.searchParams.set("date", d);
const r = await fetch(url.toString(), { headers: authHeaders(token || undefined) });
setMeals(r.ok ? await r.json() : []);
setLoading(false);
};


const add = async (payload: any) => {
const r = await fetch(`${API_BASE}/meals/`, {
method: "POST",
headers: authHeaders(token || undefined),
body: JSON.stringify(payload),
});
if (!r.ok) throw await r.json();
return r.json();
};


const remove = async (mealId: number) => {
const r = await fetch(`${API_BASE}/meals/${mealId}`, {
method: "DELETE",
headers: authHeaders(token || undefined),
});
if (!r.ok) throw await r.json();
};


return { meals, loading, list, add, remove };
}