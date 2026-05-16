import { afterEach, describe, expect, it, vi } from "vitest";
import {
  connectCommunitySocket,
  createFood,
  createMeal,
  deleteFood,
  deleteMe,
  deleteMeal,
  deleteProfilePhoto,
  getDailySummary,
  getCommunityMessages,
  getGoal,
  getMe,
  getMyAllergies,
  listAllergens,
  listMeals,
  listFoods,
  loginUser,
  registerUser,
  updateFood,
  updateMe,
  updateMeal,
  updateMyAllergies,
  updateMyProfile,
  upsertGoal,
  uploadProfilePhoto,
} from "../api";

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function textResponse(body, init = {}) {
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
    ...init,
  });
}

function noContentResponse() {
  return new Response(null, { status: 204 });
}

describe("api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registerUser sends JSON payload", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ id: 1, email: "ana@example.com" }));

    await expect(
      registerUser({ name: "Ana", email: "ana@example.com", password: "secret123" }),
    ).resolves.toEqual({ id: 1, email: "ana@example.com" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/auth/register",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name: "Ana",
          email: "ana@example.com",
          password: "secret123",
        }),
      }),
    );
  });

  it("loginUser sends OAuth form data and returns the access token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ access_token: "token-123", token_type: "bearer" }),
    );

    await expect(
      loginUser({ email: "ana@example.com", password: "secret123" }),
    ).resolves.toBe("token-123");

    const [, options] = globalThis.fetch.mock.calls[0];
    expect(options.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(options.body).toBe("username=ana%40example.com&password=secret123");
  });

  it("listFoods includes token and optional search query", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse([{ id: 1, name: "Avena" }]));

    await expect(listFoods({ token: "abc", search: "ave" })).resolves.toEqual([
      { id: 1, name: "Avena" },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/foods/?search=ave",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer abc" }),
      }),
    );
  });

  it("createFood throws API error details", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ detail: "Ya tienes un alimento con ese nombre" }, { status: 400 }),
    );

    await expect(
      createFood({
        token: "abc",
        payload: { name: "Avena", calories: 1, protein: 1, carbs: 1, fat: 1 },
      }),
    ).rejects.toThrow("Ya tienes un alimento con ese nombre");
  });

  it("updateFood sends PUT JSON payload", async () => {
    const payload = { name: "Arroz", calories: 350, protein: 7, carbs: 78, fat: 1 };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ id: 7, ...payload }));

    await updateFood({ token: "abc", id: 7, payload });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/foods/7",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer abc",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      }),
    );
  });

  it("deleteFood returns null on 204 response", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(noContentResponse());

    await expect(deleteFood({ token: "abc", id: 7 })).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/foods/7",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({ Authorization: "Bearer abc" }),
      }),
    );
  });

  it("getCommunityMessages builds pagination query", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));

    await getCommunityMessages({
      token: "abc",
      roomId: "general",
      limit: 10,
      beforeId: 25,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/community/messages?room_id=general&limit=10&before_id=25",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer abc" }),
      }),
    );
  });

  it("getCommunityMessages uses shared JSON error parsing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ detail: "Sala no disponible" }, { status: 503 }),
    );

    await expect(getCommunityMessages({ token: "abc" })).rejects.toThrow("Sala no disponible");
  });

  it("listMeals includes the selected day query", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([]));

    await listMeals({ token: "abc", day: "2026-05-16" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/meals/?day=2026-05-16",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer abc" }),
      }),
    );
  });

  it("createMeal posts meal payload as JSON", async () => {
    const payload = { food_id: 1, quantity: 120, date: "2026-05-16" };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ id: 10, ...payload }));

    await createMeal({ token: "abc", payload });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/meals/",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer abc",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      }),
    );
  });

  it("updateMeal sends PUT to the selected meal", async () => {
    const payload = { food_id: 1, quantity: 150, date: "2026-05-16" };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ id: 3, ...payload }));

    await updateMeal({ token: "abc", id: 3, payload });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/meals/3",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    );
  });

  it("deleteMeal calls the meal delete endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(noContentResponse());

    await expect(deleteMeal({ token: "abc", id: 3 })).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/meals/3",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("upsertGoal posts the goal payload as JSON", async () => {
    const payload = { calories: 2200, protein: 120, carbs: 250, fat: 70 };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse(payload));

    await expect(upsertGoal({ token: "abc", payload })).resolves.toEqual(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/goals/",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer abc",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(payload),
      }),
    );
  });

  it("getGoal includes auth headers", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ calories: 2000 }));

    await expect(getGoal("abc")).resolves.toEqual({ calories: 2000 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/goals/",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer abc" }),
      }),
    );
  });

  it("getDailySummary builds the user summary query", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ total_calories: 1200 }));

    await getDailySummary({ userId: 4, date: "2026-05-16", token: "abc" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/users/4/summary?date=2026-05-16",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer abc" }),
      }),
    );
  });

  it("getMe and updateMe target authenticated user endpoints", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ id: 4 }))
      .mockResolvedValueOnce(jsonResponse({ id: 4, name: "Ana" }));

    await getMe("abc");
    await updateMe({ userId: 4, token: "abc", payload: { name: "Ana" } });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer abc" }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/users/4",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "Ana" }),
      }),
    );
  });

  it("deleteMe calls DELETE on the user endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(noContentResponse());

    await expect(deleteMe({ userId: 4, token: "abc" })).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/users/4",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("listAllergens reads public allergens", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse([{ id: 1, name: "Gluten" }]));

    await expect(listAllergens()).resolves.toEqual([{ id: 1, name: "Gluten" }]);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/allergens/",
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: "application/json" }),
      }),
    );
  });

  it("profile allergy helpers use the expected endpoints", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse([{ id: 1 }]))
      .mockResolvedValueOnce(jsonResponse([{ id: 1 }, { id: 2 }]));

    await getMyAllergies("abc");
    await updateMyAllergies([1, 2], "abc");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/profile/allergies",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer abc" }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/profile/allergies",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ allergen_ids: [1, 2] }),
      }),
    );
  });

  it("updateMyAllergies throws backend detail when saving fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ detail: "Alérgeno inválido" }, { status: 400 }),
    );

    await expect(updateMyAllergies([999], "abc")).rejects.toThrow("Alérgeno inválido");
  });

  it("profile helpers update data, upload photo and delete photo", async () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ id: 1 }))
      .mockResolvedValueOnce(jsonResponse({ id: 1, profile_image_url: "/photo.png" }))
      .mockResolvedValueOnce(jsonResponse({ id: 1, profile_image_url: null }));

    await updateMyProfile({ token: "abc", payload: { name: "Ana", email: "ana@example.com" } });
    await uploadProfilePhoto({ token: "abc", file });
    await deleteProfilePhoto("abc");

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/profile/me",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ name: "Ana", email: "ana@example.com" }),
      }),
    );
    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:8000/profile/photo");
    expect(fetchMock.mock.calls[1][1]).toEqual(
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:8000/profile/photo",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("uses plain text errors when the backend is not JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(textResponse("Servidor caído", { status: 500 }));

    await expect(getGoal("abc")).rejects.toThrow("Servidor caído");
  });

  it("aborts requests that take too long", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_url, options = {}) =>
        new Promise((_resolve, reject) => {
          options.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        }),
    );

    const assertion = expect(getGoal("abc")).rejects.toThrow(
      "La petición tardó demasiado. Inténtalo de nuevo.",
    );
    await vi.advanceTimersByTimeAsync(15000);

    await assertion;
    vi.useRealTimers();
  });

  it("connectCommunitySocket builds websocket url with encoded token", () => {
    const WebSocketMock = vi.fn();
    vi.stubGlobal("WebSocket", WebSocketMock);

    connectCommunitySocket({ token: "a b+c" });

    expect(WebSocketMock).toHaveBeenCalledWith("ws://localhost:8000/community/ws?token=a%20b%2Bc");
    vi.unstubAllGlobals();
  });
});
